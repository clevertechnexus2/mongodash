require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const net = require('net');

const { setClient, setConnected, getDb } = require('./db');
const { detectPublicHost } = require('./lib/hostDetect');
const requireAuth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const { ensureAdminExists } = require('./routes/auth');
const appsRoutes = require('./routes/apps');
const statsRoutes = require('./routes/stats');
const dbRoutes = require('./routes/databases');
const usersRoutes = require('./routes/users');

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '5000', 10);
const MONGO_PORT = parseInt(process.env.MONGO_PORT || '27018', 10);
const MONGO_CONNECT_HOST = '127.0.0.1';
const MONGOD_BIND_IP = process.env.MONGO_BIND_IP || '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data', 'db');
const KEY_FILE = path.join(__dirname, 'data', 'api_key.txt');
const MONGO_ADMIN_USER = 'mongodash';
const MONGO_ADMIN_PASS_FILE = path.join(__dirname, 'data', 'mongo_admin_pass.txt');
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });

// ── API Key ────────────────────────────────────────────────────────────────────

function loadOrCreateApiKey() {
  if (process.env.MONGODB_API_KEY) {
    console.log('[api] Using MONGODB_API_KEY from environment.');
    return process.env.MONGODB_API_KEY;
  }
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE, 'utf8').trim();
  }
  const key = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });
  console.log('[api] New API key generated and saved to data/api_key.txt');
  return key;
}

const API_KEY = loadOrCreateApiKey();

// ── MongoDB Auth Setup ─────────────────────────────────────────────────────────

function loadMongoAdminPass() {
  if (fs.existsSync(MONGO_ADMIN_PASS_FILE)) {
    return fs.readFileSync(MONGO_ADMIN_PASS_FILE, 'utf8').trim();
  }
  return null;
}

async function initMongoAuth() {
  let adminPass = loadMongoAdminPass();

  if (!adminPass) {
    console.log('[mongo] First run: creating MongoDB admin via localhost exception...');
    const noAuthUri = `mongodb://${MONGO_CONNECT_HOST}:${MONGO_PORT}/?directConnection=true`;
    const noAuthClient = new MongoClient(noAuthUri, { serverSelectionTimeoutMS: 8000 });
    try {
      await noAuthClient.connect();
      adminPass = crypto.randomBytes(24).toString('base64url');
      await noAuthClient.db('admin').command({
        createUser: MONGO_ADMIN_USER,
        pwd: adminPass,
        roles: [{ role: 'root', db: 'admin' }],
      });
      fs.writeFileSync(MONGO_ADMIN_PASS_FILE, adminPass, { mode: 0o600 });
      console.log(`[mongo] Admin user '${MONGO_ADMIN_USER}' created.`);
    } finally {
      await noAuthClient.close().catch(() => {});
    }
  }

  return adminPass;
}

async function migrateAppUsers(client) {
  const appsCol = client.db('_mongodash').collection('apps');
  const apps = await appsCol.find({}).toArray();

  for (const app of apps) {
    let pass = app.mongoPassword;
    if (!pass) {
      pass = crypto.randomBytes(16).toString('base64url');
      await appsCol.updateOne({ _id: app._id }, { $set: { mongoUser: app.name, mongoPassword: pass } });
    }
    try {
      await client.db('admin').command({
        createUser: app.name,
        pwd: pass,
        roles: [{ role: 'readWrite', db: app.name }],
      });
      console.log(`[mongo] Created user for app: ${app.name}`);
    } catch (e) {
      if (e.code === 51003 || (e.message && e.message.toLowerCase().includes('already exists'))) {
        // user already exists — fine
      } else {
        console.warn(`[mongo] Warning: could not create user for app '${app.name}': ${e.message}`);
      }
    }
  }
}

// ── Wait for port helper ───────────────────────────────────────────────────────

function waitForPort(host, port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on('connect', () => { socket.destroy(); resolve(); });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for ${host}:${port}`));
        setTimeout(tryConnect, 500);
      });
      socket.on('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timed out waiting for ${host}:${port}`));
        setTimeout(tryConnect, 500);
      });
      socket.connect(port, host);
    };
    tryConnect();
  });
}

function startMongod() {
  return new Promise((resolve, reject) => {
    const logFile = path.join(__dirname, 'data', 'mongod.log');
    const mongod = spawn('mongod', [
      '--dbpath', DATA_DIR,
      '--port', String(MONGO_PORT),
      '--bind_ip', MONGOD_BIND_IP,
      '--auth',
      '--logpath', logFile,
      '--logappend',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    mongod.stdout.on('data', d => process.stdout.write(`[mongod] ${d}`));
    mongod.stderr.on('data', d => process.stderr.write(`[mongod] ${d}`));
    mongod.on('error', err => reject(new Error(`Failed to start mongod: ${err.message}`)));
    mongod.on('exit', (code) => {
      if (code !== null && code !== 0) reject(new Error(`mongod exited with code ${code}`));
    });

    process.on('exit', () => mongod.kill());
    process.on('SIGINT', () => { mongod.kill(); process.exit(0); });
    process.on('SIGTERM', () => { mongod.kill(); process.exit(0); });

    setTimeout(() => resolve(mongod), 500);
  });
}

async function buildClient() {
  const indexHtml = path.join(CLIENT_DIST, 'index.html');
  if (fs.existsSync(indexHtml)) return;

  console.log('\n[dashboard] Building frontend... (first run — this takes ~30 seconds)');
  try {
    execSync('npm install', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
    execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
    console.log('[dashboard] Frontend built successfully.\n');
  } catch (e) {
    console.error('[dashboard] Frontend build failed:', e.message);
    console.error('[dashboard] Run: cd client && npm install && npm run build');
  }
}

// ── Document helpers ───────────────────────────────────────────────────────────

function parseDoc(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(parseDoc);
  if (typeof doc === 'object') {
    if ('$oid' in doc && typeof doc.$oid === 'string') return new ObjectId(doc.$oid);
    const out = {};
    for (const [k, v] of Object.entries(doc)) out[k] = parseDoc(v);
    return out;
  }
  return doc;
}

function serializeDoc(doc) {
  if (!doc) return doc;
  if (doc instanceof ObjectId) return { $oid: doc.toString() };
  if (doc instanceof Date) return { $date: doc.toISOString() };
  if (Array.isArray(doc)) return doc.map(serializeDoc);
  if (typeof doc === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(doc)) out[k] = serializeDoc(v);
    return out;
  }
  return doc;
}

// ── Express Middleware ─────────────────────────────────────────────────────────

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mongo-dashboard-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' },
}));

// ── Health ─────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mongodb: connected ? 'connected' : 'starting' });
});

// ── Dashboard API ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/apps', requireAuth, appsRoutes);
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/databases', requireAuth, dbRoutes);
app.use('/api/users', requireAuth, usersRoutes);

app.get('/api/config', requireAuth, (req, res) => {
  res.json({
    mongoHost: detectPublicHost(),
    mongoPort: MONGO_PORT,
  });
});

// ── Atlas-Compatible HTTP API ──────────────────────────────────────────────────

function apiAuth(req, res, next) {
  const key = req.headers['api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing api-key header' });
  }
  next();
}

function checkConnected(req, res, next) {
  if (!connected) return res.status(503).json({ error: 'MongoDB is starting up, please retry in a moment.' });
  next();
}

const BASE = '/app/data-api/endpoint/data/v1/action';

app.post(`${BASE}/findOne`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, filter = {}, projection } = req.body;
    if (!database || !collection) return res.status(400).json({ error: 'database and collection are required' });
    const db = getDb(database);
    const doc = await db.collection(collection).findOne(parseDoc(filter), projection ? { projection } : {});
    res.json({ document: serializeDoc(doc) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/find`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, filter = {}, projection, sort, limit, skip } = req.body;
    if (!database || !collection) return res.status(400).json({ error: 'database and collection are required' });
    const db = getDb(database);
    let cursor = db.collection(collection).find(parseDoc(filter));
    if (projection) cursor = cursor.project(projection);
    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    res.json({ documents: serializeDoc(await cursor.toArray()) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/insertOne`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, document } = req.body;
    if (!database || !collection || !document) return res.status(400).json({ error: 'database, collection, and document are required' });
    const db = getDb(database);
    const result = await db.collection(collection).insertOne(parseDoc(document));
    res.json({ insertedId: result.insertedId.toString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/insertMany`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, documents } = req.body;
    if (!database || !collection || !documents) return res.status(400).json({ error: 'database, collection, and documents are required' });
    const db = getDb(database);
    const result = await db.collection(collection).insertMany(parseDoc(documents));
    res.json({ insertedIds: Object.values(result.insertedIds).map(id => id.toString()) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/updateOne`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, filter = {}, update, upsert = false } = req.body;
    if (!database || !collection || !update) return res.status(400).json({ error: 'database, collection, and update are required' });
    const db = getDb(database);
    const result = await db.collection(collection).updateOne(parseDoc(filter), parseDoc(update), { upsert });
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId ? result.upsertedId.toString() : null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/updateMany`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, filter = {}, update, upsert = false } = req.body;
    if (!database || !collection || !update) return res.status(400).json({ error: 'database, collection, and update are required' });
    const db = getDb(database);
    const result = await db.collection(collection).updateMany(parseDoc(filter), parseDoc(update), { upsert });
    res.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId ? result.upsertedId.toString() : null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/deleteOne`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, filter = {} } = req.body;
    if (!database || !collection) return res.status(400).json({ error: 'database and collection are required' });
    const db = getDb(database);
    const result = await db.collection(collection).deleteOne(parseDoc(filter));
    res.json({ deletedCount: result.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/deleteMany`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, filter = {} } = req.body;
    if (!database || !collection) return res.status(400).json({ error: 'database and collection are required' });
    const db = getDb(database);
    const result = await db.collection(collection).deleteMany(parseDoc(filter));
    res.json({ deletedCount: result.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(`${BASE}/aggregate`, apiAuth, checkConnected, async (req, res) => {
  try {
    const { database, collection, pipeline = [] } = req.body;
    if (!database || !collection) return res.status(400).json({ error: 'database and collection are required' });
    const db = getDb(database);
    const documents = await db.collection(collection).aggregate(parseDoc(pipeline)).toArray();
    res.json({ documents: serializeDoc(documents) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── OG Image ──────────────────────────────────────────────────────────────────

let _ogPngCache = null;

app.get('/og.png', async (req, res) => {
  try {
    if (!_ogPngCache) {
      const sharp = require('sharp');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#059669"/>
          </linearGradient>
          <linearGradient id="xcBrand" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6e5cff"/>
            <stop offset="100%" stop-color="#0ff4c6"/>
          </linearGradient>
          <linearGradient id="glowR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>

        <!-- Glow blobs -->
        <ellipse cx="950" cy="150" rx="340" ry="260" fill="url(#glowR)" opacity="0.8"/>
        <ellipse cx="200" cy="530" rx="240" ry="180" fill="#6e5cff" opacity="0.06"/>

        <!-- Left accent bar -->
        <rect x="0" y="0" width="6" height="630" fill="url(#accent)"/>

        <!-- Top-right decorative grid dots -->
        <g opacity="0.08">
          ${Array.from({length:6}, (_,r) => Array.from({length:8}, (_,c) =>
            `<circle cx="${820 + c*50}" cy="${60 + r*50}" r="2" fill="#10b981"/>`
          ).join('')).join('')}
        </g>

        <!-- MongoDB leaf icon (simplified) -->
        <g transform="translate(80, 120)">
          <path d="M55 10 C55 10 20 38 20 65 A35 35 0 0 0 52 99.8 L52 115 L58 115 L58 99.8 A35 35 0 0 0 90 65 C90 38 55 10 55 10Z"
            fill="url(#accent)" opacity="0.9"/>
        </g>

        <!-- Main title -->
        <text x="200" y="196" font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
          font-size="88" font-weight="800" fill="#f1f5f9" letter-spacing="-2">Mongo</text>
        <text x="643" y="196" font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
          font-size="88" font-weight="800" fill="#10b981" letter-spacing="-2">Dash</text>

        <!-- Divider line -->
        <rect x="80" y="220" width="520" height="3" fill="#10b981" opacity="0.5" rx="2"/>

        <!-- Tagline -->
        <text x="80" y="276" font-family="'Segoe UI', system-ui, -apple-system, sans-serif"
          font-size="28" fill="#94a3b8" letter-spacing="0.5">Self-hosted MongoDB Management Dashboard</text>

        <!-- Feature pills -->
        <g transform="translate(80, 320)">
          <rect width="198" height="44" rx="22" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <text x="99" y="28" font-family="'Segoe UI', system-ui, sans-serif" font-size="17"
            fill="#10b981" text-anchor="middle" font-weight="600">&#x2713; Atlas REST API</text>
        </g>
        <g transform="translate(294, 320)">
          <rect width="178" height="44" rx="22" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <text x="89" y="28" font-family="'Segoe UI', system-ui, sans-serif" font-size="17"
            fill="#10b981" text-anchor="middle" font-weight="600">&#x2713; Multi-user Auth</text>
        </g>
        <g transform="translate(488, 320)">
          <rect width="200" height="44" rx="22" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
          <text x="100" y="28" font-family="'Segoe UI', system-ui, sans-serif" font-size="17"
            fill="#10b981" text-anchor="middle" font-weight="600">&#x2713; Auto Connection</text>
        </g>

        <!-- Connection string preview box -->
        <rect x="80" y="400" width="700" height="56" rx="10" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
        <text x="104" y="434" font-family="'Courier New', Courier, monospace" font-size="18" fill="#64748b">mongodb://</text>
        <text x="228" y="434" font-family="'Courier New', Courier, monospace" font-size="18" fill="#10b981">myapp</text>
        <text x="290" y="434" font-family="'Courier New', Courier, monospace" font-size="18" fill="#64748b">:••••••••@</text>
        <text x="413" y="434" font-family="'Courier New', Courier, monospace" font-size="18" fill="#60a5fa">your-vps-ip</text>
        <text x="540" y="434" font-family="'Courier New', Courier, monospace" font-size="18" fill="#64748b">:27018/myapp</text>

        <!-- Footer separator -->
        <rect x="0" y="540" width="1200" height="1" fill="#1e293b"/>

        <!-- Footer: CleverX brand -->
        <g transform="translate(80, 572)">
          <rect width="36" height="36" rx="8" fill="url(#xcBrand)"/>
          <text x="18" y="25" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="900"
            fill="white" text-anchor="middle">X</text>
        </g>
        <text x="128" y="584" font-family="'Segoe UI', system-ui, sans-serif"
          font-size="18" fill="#94a3b8" font-weight="600">CleverX Hosting</text>
        <text x="128" y="604" font-family="'Segoe UI', system-ui, sans-serif"
          font-size="14" fill="#475569">Built by Clever Tech Nexus · TZ, Dar es salaam &#x1F1F0;&#x1F1EA;</text>

        <!-- Right footer: URL -->
        <text x="1120" y="595" font-family="'Segoe UI', system-ui, sans-serif"
          font-size="16" fill="#334155" text-anchor="end">clevertechnexus.qzz.io</text>
      </svg>`;

      _ogPngCache = await sharp(Buffer.from(svg)).png().toBuffer();
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(_ogPngCache);
  } catch (e) {
    console.error('[og] Failed to generate OG image:', e.message);
    res.status(500).send('Image generation failed');
  }
});

// ── Static Frontend ────────────────────────────────────────────────────────────

// Serve static assets but NOT index.html — that is handled below with dynamic injection
app.use(express.static(CLIENT_DIST, { index: false }));

app.get('*', (req, res) => {
  const indexHtml = path.join(CLIENT_DIST, 'index.html');
  if (fs.existsSync(indexHtml)) {
    // Inject absolute og:image URL so WhatsApp / social scrapers get a full URL
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost';
    const baseUrl = `${proto}://${host}`;
    const ogImageUrl = `${baseUrl}/og.png`;

    let html = fs.readFileSync(indexHtml, 'utf8');
    html = html
      .replace(/content="\/og\.png"/g, `content="${ogImageUrl}"`)
      .replace(/<meta property="og:url"[^>]*>/g, '')
      .replace('</head>', `  <meta property="og:url" content="${baseUrl}" />\n  </head>`);

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><head><title>Building...</title>
<meta http-equiv="refresh" content="5">
<style>body{background:#0f172a;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px}
h1{color:#34d399}p{color:#64748b;font-size:14px}</style></head>
<body><h1>Building dashboard...</h1><p>The frontend is compiling. This page will refresh automatically.</p>
<p>Check the console for progress.</p></body></html>`);
});

// ── Startup ────────────────────────────────────────────────────────────────────

let connected = false;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[server] Listening on port ${PORT}`);
  try {
    await buildClient();

    console.log('[server] Starting mongod...');
    await startMongod();
    console.log(`[server] Waiting for mongod on ${MONGO_CONNECT_HOST}:${MONGO_PORT}...`);
    await waitForPort(MONGO_CONNECT_HOST, MONGO_PORT, 30000);

    console.log('[server] mongod ready. Initialising auth...');
    const adminPass = await initMongoAuth();

    const authUri = `mongodb://${encodeURIComponent(MONGO_ADMIN_USER)}:${encodeURIComponent(adminPass)}@${MONGO_CONNECT_HOST}:${MONGO_PORT}/?authSource=admin&directConnection=true`;
    const mongoClient = new MongoClient(authUri, { serverSelectionTimeoutMS: 10000 });
    await mongoClient.connect();
    await mongoClient.db('admin').command({ ping: 1 });

    setClient(mongoClient);
    setConnected(true);
    connected = true;

    console.log('[server] Running app user migration...');
    await migrateAppUsers(mongoClient);

    await ensureAdminExists();
    console.log('[server] MongoDB connected. Dashboard ready!\n');
    console.log(`[server] Open: http://localhost:${PORT}`);
    console.log(`[server] MongoDB listening on ${MONGOD_BIND_IP}:${MONGO_PORT} (auth enabled)\n`);
  } catch (err) {
    console.error('[server] Startup failed:', err.message);
    process.exit(1);
  }
});
