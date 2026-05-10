# MongoDB Dashboard

A self-hosted MongoDB management dashboard with a TypeScript React frontend and an Atlas-compatible HTTP REST API.

## Architecture

- **Backend**: Node.js + Express (server.js)
  - Spawns `mongod` on port 27018 (127.0.0.1 only) via child_process
  - Serves the React dashboard as static files from `client/dist/`
  - Builds the frontend automatically on first run if `client/dist/` doesn't exist
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (in `client/`)
  - Built to `client/dist/` (git-ignored)
  - Session-based authentication (express-session)
- **Database**: MongoDB 7 (Nix), data stored in `./data/db/`
- **Modules**: `db.js`, `middleware/auth.js`, `routes/auth.js`, `routes/apps.js`, `routes/stats.js`, `routes/databases.js`

## Single Workflow

```
node server.js
```

This starts everything:
1. Builds frontend (only on first run when `client/dist/` is missing)
2. Spawns mongod on 127.0.0.1:27018
3. Connects MongoDB driver
4. Serves the dashboard on port 5000

## Dashboard Features

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Session-based auth |
| Dashboard | `/` | Stats overview: apps, storage, server info |
| Apps | `/apps` | List, filter, manage status |
| Create App | `/apps/new` | Create a new database/app |
| App Detail | `/apps/:id` | Connection strings, collections, danger zone |
| Databases | `/databases` | Browse databases, collections, and documents |
| Docs | `/docs` | Connection guides, code examples |

## Authentication

- **Admin credentials**: auto-generated on first run, printed to console once
- **Credential file**: `data/admin.json` (git-ignored, mode 0600)
- **Session secret**: `SESSION_SECRET` env var (falls back to default)

## API Key (HTTP Data API)

- **Key file**: `data/api_key.txt` (git-ignored, mode 0600)
- **Override**: Set `MONGODB_API_KEY` environment secret

## HTTP API (Atlas-Compatible)

Base endpoint: `/app/data-api/endpoint/data/v1/action/{action}`

Auth: `api-key: <key>` header

Actions: `findOne`, `find`, `insertOne`, `insertMany`, `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `aggregate`

## Connection Strings

- **Internal**: `mongodb://127.0.0.1:27018/<database>`
- **VPS/External**: `mongodb://<user>:<pass>@<your-vps-ip>:27017/<database>?authSource=admin`

## Rebuilding the Frontend

After making changes to `client/src/`:
```bash
cd client && npm run build
```
Then restart the workflow.

## Important Files

- `server.js` — main entry point
- `db.js` — MongoDB client singleton
- `middleware/auth.js` — session auth middleware
- `routes/` — auth, apps, stats, databases
- `client/` — React TypeScript frontend
- `data/api_key.txt` — HTTP API key (git-ignored)
- `data/admin.json` — dashboard admin credentials (git-ignored)
- `data/db/` — MongoDB data directory (git-ignored)

## Security Notes

- MongoDB is bound to 127.0.0.1 only (not publicly accessible)
- Admin credentials and API key never committed to git
- `data/` directory is git-ignored
- Session cookies are httpOnly, sameSite=lax
