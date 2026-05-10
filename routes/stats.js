const express = require('express');
const { execSync } = require('child_process');
const { getClient } = require('../db');
const path = require('path');

const router = express.Router();

function getDiskStats(dataDir) {
  try {
    const out = execSync(`df -k "${dataDir}" 2>/dev/null | tail -1`, { timeout: 3000 }).toString().trim();
    const parts = out.split(/\s+/);
    const total = parseInt(parts[1], 10) * 1024;
    const used = parseInt(parts[2], 10) * 1024;
    const available = parseInt(parts[3], 10) * 1024;
    return { total, used, available };
  } catch {
    return { total: 0, used: 0, available: 0 };
  }
}

router.get('/', async (req, res) => {
  try {
    const client = getClient();
    const adminDb = client.db('admin');
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    const dbList = await adminDb.command({ listDatabases: 1 });

    const appDbs = dbList.databases.filter(d => !['admin', 'local', 'config', '_mongodash'].includes(d.name));
    const totalDataSize = appDbs.reduce((sum, d) => sum + (d.sizeOnDisk || 0), 0);

    const META_DB = '_mongodash';
    const metaDb = client.db(META_DB);
    const apps = await metaDb.collection('apps').find({}).toArray();
    const running = apps.filter(a => a.status === 'running').length;
    const suspended = apps.filter(a => a.status === 'suspended').length;
    const paused = apps.filter(a => a.status === 'paused').length;

    const dataDir = path.join(__dirname, '..', 'data', 'db');
    const disk = getDiskStats(dataDir);

    res.json({
      apps: { total: apps.length, running, suspended, paused },
      storage: {
        dataSize: totalDataSize,
        disk,
      },
      mongodb: {
        version: serverStatus.version,
        uptime: serverStatus.uptimeMillis,
        connections: serverStatus.connections,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
