const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { hashPassword, findByUsername, countUsers, createUser, updatePassword, findById } = require('../lib/users');

const router = express.Router();
const ADMIN_FILE = path.join(__dirname, '..', 'data', 'admin.json');

async function ensureAdminExists() {
  try {
    const count = await countUsers();
    if (count > 0) return;

    let password;
    if (fs.existsSync(ADMIN_FILE)) {
      const stored = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      password = stored._migrationPassword;
    }

    if (!password) {
      password = crypto.randomBytes(12).toString('base64url');
      console.log('\n╔══════════════════════════════════════╗');
      console.log('║     ADMIN DASHBOARD CREDENTIALS      ║');
      console.log('╠══════════════════════════════════════╣');
      console.log(`║  Username: admin                     ║`);
      console.log(`║  Password: ${password.padEnd(25)} ║`);
      console.log('╠══════════════════════════════════════╣');
      console.log('║  Save this — shown only once!        ║');
      console.log('╚══════════════════════════════════════╝\n');
    }

    await createUser('admin', password);
  } catch (e) {
    console.error('[auth] Failed to ensure admin exists:', e.message);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

    const user = await findByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash) return res.status(401).json({ error: 'Invalid credentials.' });

    req.session.authenticated = true;
    req.session.username = user.username;
    req.session.userId = user._id.toString();
    res.json({ ok: true, username: user.username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.authenticated) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.json({ username: req.session.username, userId: req.session.userId });
});

router.post('/change-password', async (req, res) => {
  try {
    if (!req.session || !req.session.authenticated) return res.status(401).json({ error: 'Unauthorized.' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required.' });

    const user = await findByUsername(req.session.username);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const currentHash = await hashPassword(currentPassword, user.salt);
    if (currentHash !== user.hash) return res.status(401).json({ error: 'Current password incorrect.' });

    await updatePassword(user._id.toString(), newPassword);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
module.exports.ensureAdminExists = ensureAdminExists;
