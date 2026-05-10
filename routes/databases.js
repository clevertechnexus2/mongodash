const express = require('express');
const { getClient, getDb } = require('../db');

const router = express.Router();

const EXCLUDED = ['admin', 'local', 'config', '_mongodash'];

router.get('/', async (req, res) => {
  try {
    const client = getClient();
    const result = await client.db('admin').command({ listDatabases: 1 });
    const dbs = result.databases.filter(d => !EXCLUDED.includes(d.name));
    res.json(dbs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:dbName/collections', async (req, res) => {
  try {
    const db = getDb(req.params.dbName);
    const cols = await db.listCollections().toArray();
    const enriched = await Promise.all(cols.map(async (col) => {
      try {
        const stats = await db.command({ collStats: col.name });
        return { name: col.name, count: stats.count || 0, size: stats.size || 0 };
      } catch {
        return { name: col.name, count: 0, size: 0 };
      }
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:dbName/collections/:colName/documents', async (req, res) => {
  try {
    const { dbName, colName } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const db = getDb(dbName);
    const col = db.collection(colName);
    const total = await col.countDocuments();
    const docs = await col.find({}).skip(skip).limit(limit).toArray();

    res.json({ total, page, limit, pages: Math.ceil(total / limit), documents: docs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
