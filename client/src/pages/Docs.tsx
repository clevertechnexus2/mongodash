import { useState } from 'react';
import {
  Copy, Check, BookOpen, Zap, Code2, Globe,
  Server, Rocket, Shield, Terminal, Users,
} from 'lucide-react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="code-block text-xs leading-relaxed overflow-x-auto">
        <code className={`language-${lang}`}>{code.trim()}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={code.trim()} />
      </div>
    </div>
  );
}

function Section({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <code className="text-emerald-300 font-mono text-xs">{value}</code>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-emerald-900/50 border border-emerald-800 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0 pb-6 border-b border-slate-800 last:border-0">
        <p className="font-semibold text-slate-200 mb-2">{title}</p>
        {children}
      </div>
    </div>
  );
}

const origin = window.location.origin;
const endpoint = `${origin}/app/data-api/endpoint/data/v1/action`;

export default function Docs() {
  const sections = [
    { id: 'first-login',    label: 'First Login' },
    { id: 'deployment',     label: 'VPS Deployment' },
    { id: 'users',          label: 'User Management' },
    { id: 'connections',    label: 'Connection Strings' },
    { id: 'http-api',       label: 'HTTP API' },
    { id: 'nodejs',         label: 'Node.js' },
    { id: 'python',         label: 'Python' },
    { id: 'actions',        label: 'All Actions' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-400" /> Documentation
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Setup guide, deployment instructions, user management, and API reference
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden xl:block w-48 shrink-0">
          <div className="sticky top-6 space-y-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block px-3 py-2 text-sm text-slate-500 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        <div className="flex-1 space-y-10 min-w-0">

          {/* ── FIRST LOGIN ───────────────────────────────────────────── */}
          <Section id="first-login" title="First Login" icon={Shield}>
            <div className="card p-4 border-emerald-800/50 bg-emerald-950/20">
              <p className="text-emerald-300 text-sm font-semibold mb-2">How the admin account is created</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                On the very first startup, MongoDash automatically creates an <strong className="text-slate-200">admin</strong> account
                with a randomly generated password. The password is printed once in the server console — look for the banner below.
              </p>
            </div>

            <CodeBlock lang="bash" code={`╔══════════════════════════════════════╗
║     ADMIN DASHBOARD CREDENTIALS      ║
╠══════════════════════════════════════╣
║  Username: admin                     ║
║  Password: AbCdEfGhIj1234567         ║
╠══════════════════════════════════════╣
║  Save this — shown only once!        ║
╚══════════════════════════════════════╝`} />

            <div className="card p-4 space-y-2">
              <InfoRow label="Default username" value="admin" />
              <InfoRow label="Password" value="Shown in console on first run only" />
              <InfoRow label="Can be deleted?" value="No — admin is permanently protected" />
              <InfoRow label="Change password" value="Users page → hover admin → Password" />
            </div>

            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 text-sm">
              <p className="text-amber-300 font-semibold mb-1">If you missed the password</p>
              <p className="text-slate-400 leading-relaxed">
                Check the server logs: <code className="text-emerald-300 font-mono text-xs">cat data/mongod.log</code> won't
                have it, but if you're on a VPS with PM2 check <code className="text-emerald-300 font-mono text-xs">pm2 logs mongodash</code>.
                If it's gone, delete <code className="text-emerald-300 font-mono text-xs">data/mongo_admin_pass.txt</code> and the
                dashboard's <code className="text-emerald-300 font-mono text-xs">_mongodash.users</code> collection, then restart —
                a fresh admin password will be printed.
              </p>
            </div>
          </Section>

          {/* ── DEPLOYMENT ────────────────────────────────────────────── */}
          <Section id="deployment" title="VPS Deployment" icon={Rocket}>
            <p className="text-slate-400 text-sm leading-relaxed">
              MongoDash runs as a single Node.js process — it starts MongoDB, builds the frontend,
              and serves the API. Everything is self-contained.
            </p>

            <div className="space-y-0">
              <Step n={1} title="Clone and install">
                <CodeBlock code={`git clone https://github.com/your-repo/mongodash.git
cd mongodash
npm install
cd client && npm install && npm run build && cd ..`} />
              </Step>

              <Step n={2} title="Set environment variables">
                <p className="text-slate-500 text-xs mb-2">Create a <code className="text-emerald-300 font-mono">.env</code> file or set these in your process manager:</p>
                <CodeBlock code={`SESSION_SECRET=your-long-random-secret-here
MONGO_PUBLIC_HOST=your.domain.com   # or your VPS IP
# MONGODB_API_KEY=optional-custom-key  (auto-generated if omitted)`} />
              </Step>

              <Step n={3} title="Start with PM2 (recommended)">
                <CodeBlock code={`npm install -g pm2
pm2 start server.js --name mongodash
pm2 save
pm2 startup    # auto-start on reboot`} />
              </Step>

              <Step n={4} title="Open firewall ports">
                <CodeBlock code={`# Dashboard UI + HTTP API
ufw allow 5000/tcp

# MongoDB external access (only if you need VPS connection strings)
ufw allow 27018/tcp`} />
              </Step>

              <Step n={5} title="First login">
                <p className="text-slate-400 text-sm">
                  Check the PM2 logs for your admin password, then open{' '}
                  <code className="text-emerald-300 font-mono text-xs">http://your-vps-ip:5000</code> in your browser.
                </p>
                <CodeBlock code={`pm2 logs mongodash --lines 50 | grep -A5 "CREDENTIALS"`} />
              </Step>
            </div>

            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Server info</p>
              <InfoRow label="Dashboard + HTTP API" value="port 5000 (configurable)" />
              <InfoRow label="MongoDB (internal)" value="127.0.0.1:27018" />
              <InfoRow label="MongoDB (external)" value="0.0.0.0:27018 (auth required)" />
              <InfoRow label="Auth credentials" value="data/mongo_admin_pass.txt" />
              <InfoRow label="API key" value="data/api_key.txt" />
            </div>

            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Nginx reverse proxy (optional)</p>
              <CodeBlock lang="nginx" code={`server {
    listen 80;
    server_name your.domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}`} />
              <p className="text-slate-600 text-xs mt-2">Add SSL with <code className="font-mono">certbot --nginx</code> for HTTPS.</p>
            </div>
          </Section>

          {/* ── USERS ─────────────────────────────────────────────────── */}
          <Section id="users" title="User Management" icon={Users}>
            <p className="text-slate-400 text-sm leading-relaxed">
              All dashboard login accounts are managed from the <strong className="text-slate-200">Users</strong> page.
              Each user can log in independently and has full access to all databases and apps.
            </p>
            <div className="card p-4 space-y-2">
              <InfoRow label="Create user" value="Users page → Add User" />
              <InfoRow label="Change any password" value="Users page → hover user → Password" />
              <InfoRow label="Delete user" value="Users page → hover user → Delete" />
              <InfoRow label="Admin account" value="Cannot be deleted, always protected" />
              <InfoRow label="Minimum password" value="6 characters" />
            </div>
            <div className="bg-slate-800/60 rounded-lg p-4 text-sm">
              <p className="text-slate-300 font-semibold mb-1">These are dashboard login accounts only</p>
              <p className="text-slate-500 text-sm">
                Dashboard users are separate from MongoDB users. Each app you create gets its own MongoDB
                credential (shown on the App Detail page) for use in your application code.
              </p>
            </div>
          </Section>

          {/* ── CONNECTIONS ───────────────────────────────────────────── */}
          <Section id="connections" title="Connection Strings" icon={Server}>
            <p className="text-slate-400 text-sm">
              All connection strings for your app are shown on the App Detail page with real credentials
              already filled in. Copy them directly without editing.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">Internal — same machine</p>
                <CodeBlock code={`mongodb://127.0.0.1:27018/<your-database>`} />
                <p className="text-slate-600 text-xs mt-1.5">
                  Use this when your app runs on the same server. No auth required — fastest option.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">VPS / External — with auth</p>
                <CodeBlock code={`mongodb://<user>:<password>@<your-vps-ip>:27018/<database>?authSource=admin`} />
                <p className="text-slate-600 text-xs mt-1.5">
                  Auth is enabled by default. Port is <strong>27018</strong>. The user and password are generated
                  per-app and shown on the App Detail page.
                </p>
              </div>

              <div className="card p-4 border-blue-900/40 bg-blue-950/10">
                <p className="text-blue-300 text-sm font-semibold mb-2">Set your public host</p>
                <p className="text-slate-400 text-xs mb-2">
                  Connection strings auto-detect your server's public IP. Override it with an env var:
                </p>
                <CodeBlock code={`MONGO_PUBLIC_HOST=your.domain.com node server.js`} />
              </div>
            </div>
          </Section>

          {/* ── HTTP API ──────────────────────────────────────────────── */}
          <Section id="http-api" title="HTTP API Reference" icon={Globe}>
            <p className="text-slate-400 text-sm">
              The HTTP API is fully Atlas Data API-compatible. Send <code className="text-emerald-300 font-mono text-xs">POST</code> requests
              with your API key and a JSON body. Find your API key in <code className="text-emerald-300 font-mono text-xs">data/api_key.txt</code>.
            </p>

            <div className="card p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Base endpoint</p>
                  <code className="text-emerald-300 font-mono text-xs break-all">{endpoint}/&#123;action&#125;</code>
                </div>
                <CopyBtn text={`${endpoint}/{action}`} />
              </div>
            </div>

            <CodeBlock code={`curl -X POST "${endpoint}/findOne" \\
  -H "api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "database": "myapp",
    "collection": "users",
    "filter": { "email": "alice@example.com" }
  }'`} />

            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Request body fields</p>
              <div className="space-y-2 text-sm">
                {[
                  ['database',               'string',        'Required — the database name'],
                  ['collection',             'string',        'Required — the collection name'],
                  ['filter',                 'object',        'MongoDB query filter'],
                  ['document / documents',   'object / array','For insert operations'],
                  ['update',                 'object',        'For update operations ($set, $inc, …)'],
                  ['pipeline',               'array',         'For aggregate operations'],
                  ['limit / skip / sort',    'number / object','For find operations'],
                  ['upsert',                 'boolean',       'Insert if no match (updateOne/Many)'],
                ].map(([field, type, desc]) => (
                  <div key={field as string} className="flex gap-3">
                    <code className="text-emerald-300 text-xs font-mono w-36 shrink-0">{field}</code>
                    <code className="text-blue-300 text-xs font-mono w-24 shrink-0 hidden sm:block">{type}</code>
                    <span className="text-slate-500 text-xs">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── NODE.JS ───────────────────────────────────────────────── */}
          <Section id="nodejs" title="Node.js Examples" icon={Code2}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">MongoDB driver — internal connection</p>
                <CodeBlock code={`const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb://127.0.0.1:27018/');
await client.connect();

const db = client.db('myapp');
const users = db.collection('users');

await users.insertOne({ name: 'Alice', email: 'alice@example.com' });
const user = await users.findOne({ email: 'alice@example.com' });
console.log(user);

await client.close();`} lang="js" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">MongoDB driver — external (VPS) connection</p>
                <CodeBlock code={`const { MongoClient } = require('mongodb');

const uri = 'mongodb://myapp:YOUR_APP_PASSWORD@your-vps-ip:27018/myapp?authSource=admin';
const client = new MongoClient(uri);
await client.connect();

const db = client.db('myapp');`} lang="js" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">Mongoose</p>
                <CodeBlock code={`const mongoose = require('mongoose');

await mongoose.connect('mongodb://127.0.0.1:27018/myapp');

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
}));

await User.create({ name: 'Alice', email: 'alice@example.com' });
const users = await User.find().limit(10);`} lang="js" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">HTTP API with fetch</p>
                <CodeBlock code={`const BASE = '${endpoint}';
const API_KEY = 'your-api-key-here';

async function mongoFetch(action, body) {
  const res = await fetch(\`\${BASE}/\${action}\`, {
    method: 'POST',
    headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ database: 'myapp', collection: 'users', ...body }),
  });
  return res.json();
}

await mongoFetch('insertOne', { document: { name: 'Alice' } });
const { documents } = await mongoFetch('find', { filter: {}, limit: 10 });`} lang="js" />
              </div>
            </div>
          </Section>

          {/* ── PYTHON ────────────────────────────────────────────────── */}
          <Section id="python" title="Python Examples" icon={Terminal}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">PyMongo — internal</p>
                <CodeBlock code={`from pymongo import MongoClient

client = MongoClient('mongodb://127.0.0.1:27018/')
db = client['myapp']
users = db['users']

users.insert_one({'name': 'Alice', 'email': 'alice@example.com'})
user = users.find_one({'email': 'alice@example.com'})
print(user)

users.update_one({'email': 'alice@example.com'}, {'$set': {'name': 'Alice Smith'}})
client.close()`} lang="python" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-300 mb-2">HTTP API with requests</p>
                <CodeBlock code={`import requests

BASE = '${endpoint}'
API_KEY = 'your-api-key-here'
HEADERS = {'api-key': API_KEY, 'Content-Type': 'application/json'}
DB = {'database': 'myapp', 'collection': 'users'}

def mongo(action, **kwargs):
    r = requests.post(f'{BASE}/{action}', headers=HEADERS, json={**DB, **kwargs})
    r.raise_for_status()
    return r.json()

mongo('insertOne', document={'name': 'Alice', 'email': 'alice@example.com'})
result = mongo('find', filter={}, limit=20)
for doc in result['documents']:
    print(doc)`} lang="python" />
              </div>
            </div>
          </Section>

          {/* ── ALL ACTIONS ───────────────────────────────────────────── */}
          <Section id="actions" title="All API Actions" icon={BookOpen}>
            <div className="card divide-y divide-slate-800">
              {[
                { action: 'findOne',    desc: 'Find a single matching document',       body: '{ database, collection, filter, projection }' },
                { action: 'find',       desc: 'Find multiple documents',               body: '{ database, collection, filter, projection, sort, limit, skip }' },
                { action: 'insertOne',  desc: 'Insert a single document',              body: '{ database, collection, document }' },
                { action: 'insertMany', desc: 'Insert multiple documents',             body: '{ database, collection, documents }' },
                { action: 'updateOne',  desc: 'Update the first matching document',    body: '{ database, collection, filter, update, upsert? }' },
                { action: 'updateMany', desc: 'Update all matching documents',         body: '{ database, collection, filter, update, upsert? }' },
                { action: 'deleteOne',  desc: 'Delete the first matching document',    body: '{ database, collection, filter }' },
                { action: 'deleteMany', desc: 'Delete all matching documents',         body: '{ database, collection, filter }' },
                { action: 'aggregate',  desc: 'Run an aggregation pipeline',           body: '{ database, collection, pipeline }' },
              ].map(({ action, desc, body }) => (
                <div key={action} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded mt-0.5">POST</span>
                    <div className="flex-1 min-w-0">
                      <code className="text-emerald-300 font-mono text-sm">/action/<strong>{action}</strong></code>
                      <p className="text-slate-500 text-xs mt-1">{desc}</p>
                      <code className="text-slate-600 font-mono text-xs mt-1 block">{body}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
