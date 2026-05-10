const express = require('express');
const { listUsers, createUser, deleteUser, updatePassword, countUsers } = require('../lib/users');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await listUsers();
    res.json(users.map(u => ({ ...u, _id: u._id.toString() })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
    const user = await createUser(username, password);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword is required.' });
    await updatePassword(req.params.id, newPassword);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const users = await listUsers();
    if (users.length <= 1) return res.status(400).json({ error: 'Cannot delete the last user.' });

    const sessionUserId = req.session?.userId;
    if (sessionUserId && sessionUserId === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    const target = users.find(u => u._id.toString() === req.params.id);
    if (target && target.username === 'admin') {
      return res.status(400).json({ error: 'The admin account cannot be deleted.' });
    }

    const deleted = await deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found.' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
