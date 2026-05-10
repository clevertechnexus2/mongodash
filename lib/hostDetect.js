const { execSync } = require('child_process');

let _cachedHost = null;

function detectPublicHost() {
  if (_cachedHost) return _cachedHost;

  if (process.env.MONGO_PUBLIC_HOST) {
    _cachedHost = process.env.MONGO_PUBLIC_HOST;
    return _cachedHost;
  }

  try {
    const out = execSync('hostname -I 2>/dev/null', { timeout: 2000 }).toString().trim();
    const ips = out.split(/\s+/).filter(ip => ip && ip !== '127.0.0.1' && !ip.startsWith('172.'));
    if (ips.length > 0) {
      _cachedHost = ips[0];
      return _cachedHost;
    }
  } catch {}

  try {
    const out = execSync('curl -s --max-time 2 https://api.ipify.org 2>/dev/null', { timeout: 4000 }).toString().trim();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(out)) {
      _cachedHost = out;
      return _cachedHost;
    }
  } catch {}

  _cachedHost = 'your-server-ip';
  return _cachedHost;
}

module.exports = { detectPublicHost };
