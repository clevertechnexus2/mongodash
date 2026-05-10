# Contributing to MongoDash

Thank you for your interest in contributing to MongoDash.  
This project is maintained by **Clever Tech Nexus · CleverX Hosting & CleverX Tech Devs**, TZ, Dar es salaam.

---

## Ways to Contribute

- **Bug reports** — open a GitHub issue with a clear reproduction
- **Feature requests** — open a GitHub issue describing the problem you want solved
- **Pull requests** — code improvements, bug fixes, documentation updates
- **Security issues** — see [SECURITY.md](SECURITY.md) for the responsible disclosure process

---

## Before You Start

1. Check the open [issues](../../issues) and [pull requests](../../pulls) to avoid duplicate work.
2. For significant changes, open an issue first to discuss your approach before writing code.
3. Small fixes (typos, documentation, minor bugs) can go straight to a pull request.

---

## Development Setup

MongoDash runs as a single Node.js process. You need **Node.js v18+** and **npm v8+**.

```bash
# 1. Fork and clone the repo
git clone https://github.com/your-username/mongodash.git
cd mongodash

# 2. Install server dependencies
npm install

# 3. Install and build the frontend
cd client
npm install
npm run build
cd ..

# 4. Copy and configure environment
cp .env.example .env
# Edit .env — set SESSION_SECRET at minimum

# 5. Start the server
node server.js
```

The dashboard will be available at `http://localhost:5000`.  
Admin credentials will be printed to the console on first run.

### Frontend development (hot reload)

The frontend uses **React + Vite**. For live reloading during UI development:

```bash
cd client
npm run dev
```

This runs the Vite dev server on port 5173. API calls are proxied to the Express server on port 5000, so both must be running.

---

## Project Structure

```
mongodash/
├── server.js              # Entry point — starts mongod, builds client, serves API
├── db.js                  # MongoDB client singleton
├── routes/
│   ├── apps.js            # App / database management routes
│   ├── auth.js            # Login / logout / session routes
│   ├── users.js           # Dashboard user management routes
│   └── databases.js       # Database browser routes
├── middleware/
│   └── auth.js            # Session authentication middleware
├── lib/
│   ├── users.js           # User CRUD and password hashing
│   ├── hostDetect.js      # VPS IP auto-detection
│   └── mongoInit.js       # mongod startup and auth initialisation
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Shared UI components
│   │   ├── api.ts         # API client (axios)
│   │   └── types.ts       # TypeScript interfaces
│   └── index.html         # HTML entry with OG meta tags
└── data/                  # Runtime data (gitignored)
```

---

## Code Style

- **Server:** Node.js (CommonJS), Express. No TypeScript on the server.
- **Client:** TypeScript, React, Tailwind CSS. Functional components only.
- Keep components small and focused — split into separate files when they grow.
- Follow existing naming and file structure conventions.
- No unnecessary comments — write self-documenting code.
- No emojis in code or commit messages.

---

## Submitting a Pull Request

1. Create a branch from `main`:
   ```bash
   git checkout -b fix/short-description
   ```

2. Make your changes and test them manually on a running instance.

3. Rebuild the frontend if you changed any client code:
   ```bash
   cd client && npm run build
   ```

4. Commit with a clear, concise message:
   ```
   Fix password visibility toggle not resetting on modal close
   Add owner badge to app cards for admin view
   ```

5. Push and open a pull request against `main`.

6. Describe what the PR does, why, and how to test it.

---

## Pull Request Checklist

- [ ] Changes tested manually on a running MongoDash instance
- [ ] Frontend rebuilt if client code was changed
- [ ] No secrets, passwords, or personal data in the diff
- [ ] Follows existing code style and file structure
- [ ] Security-sensitive changes flagged explicitly in the PR description

---

## Code of Conduct

Be respectful, constructive, and professional in all interactions.  
Harassment, discrimination, or abusive behaviour of any kind will not be tolerated.

---

## Questions?

Open a GitHub issue or reach out via [x.com/Clever_Tech_Nexus](https://twitter.com/Clever_Tech_Nexus).
