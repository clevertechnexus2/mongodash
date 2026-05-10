let _client = null;
let _connected = false;

function setClient(client) { _client = client; }
function setConnected(v) { _connected = v; }
function isConnected() { return _connected; }
function getClient() { return _client; }

function getDb(database) {
  if (!_connected || !_client) throw new Error('MongoDB not ready. Please retry in a moment.');
  return _client.db(database);
}

module.exports = { setClient, setConnected, isConnected, getClient, getDb };
