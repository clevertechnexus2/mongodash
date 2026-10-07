# MongoDash

**Self-hosted MongoDB management dashboard** built for VPS deployments.  
Branded and maintained by [Clever Tech Nexus · CleverX Hosting & CleverX Tech Devs](https://twitter.com/Clever_Tech_Nexus) — TZ, Dar es salaam.

---

## What is MongoDash?

MongoDash is a single-command, self-hosted MongoDB dashboard that:

- Starts and manages its own `mongod` process (no separate MongoDB install needed)
- Provides a web UI for creating and managing databases ("apps")
- Generates per-app MongoDB users with isolated `readWrite` permissions
- Exposes a fully **Atlas Data API-compatible** HTTP REST API
- Supports multiple dashboard login accounts with per-user app isolation
- Auto-generates secure VPS connection strings for each app

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | v22.x (Heroku) / v20.19+ |
| npm | v8 or later |
| MongoDB binary | Downloaded automatically on first start; pre-downloaded during Heroku build |
| OS | Linux (Ubuntu 20.04+ recommended) |
| RAM | 512 MB minimum, 1 GB recommended |
| Ports | 5000 (dashboard), 27018 (MongoDB) |

> MongoDash is designed primarily for Linux VPS environments. A Heroku deployment is supported for demos and testing, with the limitations described below.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/mongodash.git
cd mongodash
```

### 2. Install dependencies

```bash
npm install
cd client && npm install && npm run build && cd ..
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Required — use a long, random string (at least 32 characters)
SESSION_SECRET=replace-this-with-a-long-random-secret

# Optional — override the public host shown in connection strings
# Defaults to auto-detected VPS IP
MONGO_PUBLIC_HOST=your.domain.com

# Optional — override which IP mongod binds to (default: 0.0.0.0 locally, 127.0.0.1 on Heroku)
MONGO_BIND_IP=0.0.0.0

# Optional — override the dashboard port (default: 5000)
PORT=5000
```

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

### Deploying to Heroku (local MongoDB)

Heroku runs MongoDash and a local `mongod` process in the same web dyno. The Heroku build installs a pinned MongoDB binary and builds the dashboard frontend; the `Procfile` starts the web process on Heroku's assigned `PORT`.

1. Create a Heroku app and configure stable secrets:

   ```bash
   heroku create your-mongodash-app
   heroku config:set SESSION_SECRET="$(openssl rand -hex 32)" \
     MONGODB_API_KEY="$(openssl rand -hex 32)" -a your-mongodash-app
   ```

2. Deploy the repository's `main` branch:

   ```bash
   git push heroku main
   heroku logs --tail -a your-mongodash-app
   ```

3. Open the app and find the generated first-login admin password in the Heroku logs.

**Important limitations of local MongoDB on Heroku:**

- Heroku dyno filesystems are ephemeral. All MongoDB databases, dashboard accounts, and app records stored in the local `data/` directory are lost when the dyno restarts, is redeployed, or is replaced. This mode is only suitable for disposable demos/tests, not production data.
- Run exactly one web dyno (`heroku ps:scale web=1`). Multiple dynos would each have a separate, isolated MongoDB instance.
- Heroku exposes the web process's `PORT`, not MongoDB port `27018`. The database is bound to `127.0.0.1` by default on Heroku, so generated direct MongoDB connection strings are not reachable from external clients. Use the dashboard and HTTP API, or move to a separately hosted MongoDB service if durable data or direct client connections are required.
- Set both `SESSION_SECRET` and `MONGODB_API_KEY` as config vars. The app refuses to start on Heroku without them rather than using an insecure session default or silently rotating the API key after a restart.

### 4. Open firewall ports

```bash
# Dashboard + HTTP API
sudo ufw allow 5000/tcp

# MongoDB external access (required for VPS connection strings)
sudo ufw allow 27018/tcp

sudo ufw reload
```

---

## Starting the Dashboard

### Development / manual start

```bash
node server.js
```

### Production — PM2 (recommended)

```bash
npm install -g pm2
pm2 start server.js --name mongodash
pm2 save
pm2 startup    # follow the printed command to enable auto-start on reboot
```

### Verify it is running

```bash
pm2 status
pm2 logs mongodash --lines 50
```

The dashboard will be available at:

```
http://your-vps-ip:5000
```

---

## First Login

On the very first startup, MongoDash automatically creates an **admin** account with a randomly generated password. The credentials are printed **once** to the console:

```
╔══════════════════════════════════════╗
║     ADMIN DASHBOARD CREDENTIALS      ║
╠══════════════════════════════════════╣
║  Username: admin                     ║
║  Password: AbCdEfGhIj1234567         ║
╠══════════════════════════════════════╣
║  Save this — shown only once!        ║
╚══════════════════════════════════════╝
```

**Save this password immediately.** It is shown only once.

### Viewing the password after first run

If you are using PM2:

```bash
pm2 logs mongodash --lines 100 | grep -A 8 "CREDENTIALS"
```

### If you missed the password

Delete the admin user record from the dashboard's internal database and restart. A new password will be generated and printed:

```bash
# Stop the server first
pm2 stop mongodash

# Connect to mongod directly (while it may still be running)
mongosh --port 27018 --authenticationDatabase admin \
  -u mongodash -p "$(cat data/mongo_admin_pass.txt)" \
  --eval 'db.getSiblingDB("_mongodash").users.deleteOne({ username: "admin" })'

# Restart — new credentials will print
pm2 start mongodash
```

Alternatively, change the admin password from the **Users** page once you are logged in as any other admin-level account.

---

## Initial Settings Checklist

After your first login, complete the following:

| Step | Where |
|---|---|
| Change the admin password | Users → hover admin → Password |
| Set your public hostname | `.env` → `MONGO_PUBLIC_HOST=your.domain.com` |
| Create additional dashboard users | Users → Add User |
| Create your first app / database | Apps → New App |
| Copy your API key | `data/api_key.txt` or Docs page |

---

## User Accounts

MongoDash supports multiple dashboard login accounts.

- Each user only sees and manages **their own apps**
- The **admin** account sees all apps across all users
- Only the **admin** account can list, create, change passwords, or delete dashboard users
- The admin account **cannot be deleted**
- Passwords must be at least 6 characters

> Dashboard accounts are separate from MongoDB credentials. Each app gets its own isolated MongoDB user (shown on the App Detail page).

---

## Nginx Reverse Proxy (HTTPS)

To serve MongoDash over HTTPS with a domain name:

```nginx
server {
    listen 80;
    server_name your.domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Add SSL with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.com
```

After enabling HTTPS, update your `.env`:

```env
MONGO_PUBLIC_HOST=your.domain.com
```

And restart the server so connection strings update.

---

## HTTP API

MongoDash exposes a fully **Atlas Data API-compatible** REST endpoint.

**Base URL:**
```
http://your-vps-ip:5000/app/data-api/endpoint/data/v1/action/{action}
```

**Authentication:**
```
api-key: <your-api-key>
```

Find your API key at: `data/api_key.txt`

**Example — insert a document:**

```bash
curl -X POST "http://your-vps-ip:5000/app/data-api/endpoint/data/v1/action/insertOne" \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myapp",
    "collection": "users",
    "document": { "name": "Alice", "email": "alice@example.com" }
  }'
```

**Supported actions:**

| Action | Description |
|---|---|
| `findOne` | Find a single document |
| `find` | Find multiple documents |
| `insertOne` | Insert one document |
| `insertMany` | Insert multiple documents |
| `updateOne` | Update first matching document |
| `updateMany` | Update all matching documents |
| `deleteOne` | Delete first matching document |
| `deleteMany` | Delete all matching documents |
| `aggregate` | Run an aggregation pipeline |

Full API reference is available in the **Docs** section of the dashboard.

---

## Data & File Locations

| File / Directory | Contents |
|---|---|
| `data/` | All persistent data |
| `data/mongod/` | MongoDB data files |
| `data/mongod.log` | MongoDB log file |
| `data/mongo_admin_pass.txt` | Internal MongoDB admin password |
| `data/api_key.txt` | HTTP API key |

> **Back up the `data/` directory regularly.** Deleting it will permanently destroy all databases and credentials.

---

## Upgrading

```bash
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart mongodash
```

---

## Built by

**Clever Tech Nexus · CleverX Hosting & CleverX Tech Devs**  
Nairobi, Kenya  
[x.com/Clever_Tech_Nexus](https://twitter.com/Clever_Tech_Nexus)

---

## License

[MIT](LICENSE.md) — see the licence file for full terms.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security policy.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
