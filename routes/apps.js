const express = require('express');
const crypto = require('crypto');
const { getDb, getClient } = require('../db');

const router = express.Router();
const META_DB = '_mongodash';
const META_COL = 'apps';

const COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16'];

function generatePassword() {
  return crypto.randomBytes(16).toString('base64url');
}

function isAdmin(req) {
  return req.session && req.session.username === 'admin';
}

function ownerFilter(req) {
  // admin sees everything; other users only see their own apps
  if (isAdmin(req)) return {};
  return { owner: req.session.username };
}

async function getAppsCollection() {
  return getDb(META_DB).collection(META_COL);
}

async function getAppStats(appName) {
  try {
    const client = getClient();
    const stats = await client.db(appName).stats();
    const collections = await client.db(appName).listCollections().toArray();
    return {
      dataSize: stats.dataSize || 0,
      storageSize: stats.storageSize || 0,
      collections: stats.collections || 0,
      objects: stats.objects || 0,
      collectionNames: collections.map(c => c.name),
    };
  } catch {
    return { dataSize: 0, storageSize: 0, collections: 0, objects: 0, collectionNames: [] };
  }
}

async function ensureCredentials(app, col) {
  if (!app.mongoPassword) {
    const mongoPassword = generatePassword();
    await col.updateOne(
      { _id: app._id },
      { $set: { mongoUser: app.name, mongoPassword } }
    );
    return { ...app, mongoUser: app.name, mongoPassword };
  }
  return app;
}

async function createMongoUser(name, password) {
  try {
    await getClient().db('admin').command({
      createUser: name,
      pwd: password,
      roles: [{ role: 'readWrite', db: name }],
    });
  } catch (e) {
    if (e.code === 51003 || (e.message && e.message.toLowerCase().includes('already exists'))) {
      await getClient().db('admin').command({ updateUser: name, pwd: password });
    } else {
      console.warn(`[apps] Warning: could not create MongoDB user '${name}': ${e.message}`);
    }
  }
}

async function deleteMongoUser(name) {
  try {
    await getClient().db('admin').command({ dropUser: name });
  } catch {
    // ignore if user doesn't exist
  }
}

// ── LIST ─────────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const col = await getAppsCollection();
    const apps = await col.find(ownerFilter(req)).sort({ createdAt: -1 }).toArray();
    const enriched = await Promise.all(apps.map(async (app) => {
      const withCreds = await ensureCredentials(app, col);
      const stats = await getAppStats(withCreds.name);
      return { ...withCreds, _id: withCreds._id.toString(), stats };
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DETAIL ───────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const col = await getAppsCollection();
    let app = await col.findOne({ _id: new ObjectId(req.params.id), ...ownerFilter(req) });
    if (!app) return res.status(404).json({ error: 'App not found.' });
    app = await ensureCredentials(app, col);
    const stats = await getAppStats(app.name);
    res.json({ ...app, _id: app._id.toString(), stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CREATE ───────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { displayName, description, color } = req.body;
    if (!displayName) return res.status(400).json({ error: 'displayName is required.' });

    const name = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '') || 'app';
    const col = await getAppsCollection();
    const exists = await col.findOne({ name });
    if (exists) return res.status(409).json({ error: `An app with database name "${name}" already exists.` });

    const mongoPassword = generatePassword();
    const doc = {
      name,
      displayName,
      description: description || '',
      color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
      status: 'running',
      mongoUser: name,
      mongoPassword,
      owner: req.session.username,
      createdAt: new Date().toISOString(),
    };
    const result = await col.insertOne(doc);
    await getClient().db(name).createCollection('_init');
    await createMongoUser(name, mongoPassword);

    res.status(201).json({ ...doc, _id: result.insertedId.toString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── REGENERATE PASSWORD ───────────────────────────────────────────────────────

router.post('/:id/regenerate-password', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const col = await getAppsCollection();
    const app = await col.findOne({ _id: new ObjectId(req.params.id), ...ownerFilter(req) });
    if (!app) return res.status(404).json({ error: 'App not found.' });

    const mongoPassword = generatePassword();
    await col.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { mongoPassword, updatedAt: new Date().toISOString() } }
    );

    try {
      await getClient().db('admin').command({ updateUser: app.name, pwd: mongoPassword });
    } catch (e) {
      await createMongoUser(app.name, mongoPassword);
    }

    res.json({ ok: true, mongoPassword });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STATUS ───────────────────────────────────────────────────────────────────

router.patch('/:id/status', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const { status } = req.body;
    if (!['running', 'suspended', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'status must be running, suspended, or paused.' });
    }
    const col = await getAppsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(req.params.id), ...ownerFilter(req) },
      { $set: { status, updatedAt: new Date().toISOString() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'App not found.' });
    res.json({ ok: true, status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── EDIT ─────────────────────────────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const { displayName, description, color } = req.body;
    const update = {};
    if (displayName) update.displayName = displayName;
    if (description !== undefined) update.description = description;
    if (color) update.color = color;
    update.updatedAt = new Date().toISOString();
    const col = await getAppsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(req.params.id), ...ownerFilter(req) },
      { $set: update }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'App not found.' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE ───────────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const col = await getAppsCollection();
    const app = await col.findOne({ _id: new ObjectId(req.params.id), ...ownerFilter(req) });
    if (!app) return res.status(404).json({ error: 'App not found.' });

    await deleteMongoUser(app.name);
    await getClient().db(app.name).dropDatabase();
    await col.deleteOne({ _id: new ObjectId(req.params.id) });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
