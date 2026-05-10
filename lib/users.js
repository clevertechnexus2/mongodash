const crypto = require('crypto');
const { getDb } = require('../db');

const USERS_DB = '_mongodash';
const USERS_COL = 'users';

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex'));
    });
  });
}

async function getUsersCol() {
  return getDb(USERS_DB).collection(USERS_COL);
}

async function findByUsername(username) {
  const col = await getUsersCol();
  return col.findOne({ username });
}

async function findById(id) {
  const { ObjectId } = require('mongodb');
  const col = await getUsersCol();
  return col.findOne({ _id: new ObjectId(id) });
}

async function listUsers() {
  const col = await getUsersCol();
  return col.find({}, { projection: { hash: 0, salt: 0 } }).sort({ createdAt: 1 }).toArray();
}

async function createUser(username, password) {
  if (!username || username.length < 2) throw new Error('Username must be at least 2 characters.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
  const existing = await findByUsername(username);
  if (existing) throw new Error(`Username "${username}" is already taken.`);
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPassword(password, salt);
  const col = await getUsersCol();
  const result = await col.insertOne({
    username,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  });
  return { _id: result.insertedId.toString(), username, createdAt: new Date().toISOString() };
}

async function deleteUser(id) {
  const { ObjectId } = require('mongodb');
  const col = await getUsersCol();
  const result = await col.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

async function updatePassword(id, newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters.');
  const { ObjectId } = require('mongodb');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPassword(newPassword, salt);
  const col = await getUsersCol();
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { salt, hash, updatedAt: new Date().toISOString() } });
}

async function countUsers() {
  const col = await getUsersCol();
  return col.countDocuments();
}

module.exports = { hashPassword, findByUsername, findById, listUsers, createUser, deleteUser, updatePassword, countUsers };
