# Security Policy

**MongoDash** is maintained by Clever Tech Nexus · CleverX Hosting & CleverX Tech Devs, TZ, Dar es salaam.

---

## Supported Versions

Only the latest release on the `main` branch receives security updates.  
Older versions or forks are not supported.

| Branch | Supported |
|---|---|
| `main` (latest) | Yes |
| Older tags / forks | No |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in MongoDash, report it privately so it can be addressed before public disclosure.

**Contact:**  
Email: `security@xcasper.dev` *(replace with your actual address)*  
Or: Open a [GitHub Security Advisory](../../security/advisories/new) on this repository.

Include in your report:

- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept code or request examples if applicable)
- The potential impact (data exposure, authentication bypass, privilege escalation, etc.)
- Your suggested fix, if you have one

We will acknowledge your report within **72 hours** and aim to release a fix within **14 days** for critical issues. You will be credited in the release notes unless you prefer anonymity.

---

## Security Disclaimer

> **READ BEFORE DEPLOYING**

MongoDash is designed for use on **private, trusted networks or secured VPS environments**. Before exposing it to the public internet, understand the following risks:

### 1. Dashboard exposes MongoDB management capabilities

The dashboard allows creating and dropping databases, managing credentials, and browsing all stored data. An attacker who gains access to a dashboard account gains full control over all databases owned by that account.

**Mitigations:**
- Use strong, unique passwords for all dashboard accounts
- Restrict access to the dashboard port (5000) using a firewall or VPN where possible
- Enable HTTPS via a reverse proxy (see README for Nginx configuration)

### 2. MongoDB port is publicly bound by default

MongoDash binds MongoDB to `0.0.0.0:27018`, making it reachable from the internet.  
Authentication is **enabled by default** — unauthenticated connections are rejected.  
However, exposing MongoDB directly to the internet increases your attack surface.

**Mitigations:**
- Firewall rule: only open port 27018 if external MongoDB connections are required
- If all your apps run on the same server, keep port 27018 closed externally
- Set `MONGO_BIND_IP=127.0.0.1` in `.env` to bind MongoDB to localhost only:
  ```env
  MONGO_BIND_IP=127.0.0.1
  ```

### 3. HTTP API has no rate limiting

The HTTP API endpoint is not rate-limited by default. An attacker with your API key can make unlimited requests.

**Mitigations:**
- Keep your API key (`data/api_key.txt`) private
- Add rate limiting via Nginx or a reverse proxy layer
- Restrict API access by IP if your use case allows it

### 4. Session cookies

Dashboard sessions use `express-session` with `httpOnly` and `sameSite: strict` cookies.  
Cookies are marked `secure` only when served over HTTPS.

**Mitigation:**
- Always run MongoDash behind HTTPS in production to enable secure cookies

### 5. Data directory is unencrypted

All MongoDB data is stored unencrypted in the `data/` directory on disk, including the internal admin password (`data/mongo_admin_pass.txt`) and the HTTP API key (`data/api_key.txt`).

**Mitigation:**
- Use filesystem-level encryption (e.g. LUKS) on the VPS if data-at-rest encryption is required
- Restrict file system permissions: `chmod 700 data/`

### 6. No built-in TLS for MongoDB connections

MongoDB connections (port 27018) are unencrypted in transit. Credentials transmitted over an unencrypted connection can be intercepted.

**Mitigation:**
- Use MongoDB connections only within trusted private networks
- For external clients, use an SSH tunnel instead of exposing port 27018 directly:
  ```bash
  ssh -L 27018:127.0.0.1:27018 user@your-vps-ip
  # Then connect via mongodb://user:pass@127.0.0.1:27018/
  ```

---

## Responsible Use

MongoDash is provided as-is for self-hosted personal and commercial use.  
The maintainers are not responsible for data loss, breaches, or misuse arising from improper deployment.

Always:
- Keep the server and all dependencies up to date
- Perform regular backups of the `data/` directory
- Monitor access logs for suspicious activity
- Follow the principle of least privilege when granting dashboard or API access

---

## Acknowledgements

We thank all researchers who responsibly disclose vulnerabilities and help make MongoDash more secure.
