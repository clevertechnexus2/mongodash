import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Play, Pause, Ban, Trash2,
  Database, AlertCircle, ExternalLink, Eye, EyeOff,
  RefreshCw, Server
} from 'lucide-react';
import { apps as appsApi, config as configApi } from '../api';
import type { App, ServerConfig } from '../types';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors shrink-0" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ status }: { status: App['status'] }) {
  const map = { running: 'badge-running', suspended: 'badge-suspended', paused: 'badge-paused' };
  return <span className={map[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function ConnRow({
  label, value, color = 'text-emerald-300', note
}: { label: string; value: string; color?: string; note?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
        <code className={`${color} text-sm font-mono flex-1 break-all`}>{value}</code>
        <CopyButton text={value} />
      </div>
      {note && <p className="text-slate-600 text-xs mt-1.5">{note}</p>}
    </div>
  );
}

export default function AppDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<App | null>(null);
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenConfirm, setRegenConfirm] = useState(false);

  const load = () => {
    if (!id) return;
    Promise.all([appsApi.get(id), configApi.get()])
      .then(([appRes, cfgRes]) => {
        setApp(appRes.data);
        setServerConfig(cfgRes.data);
      })
      .catch(() => setError('Failed to load app.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleStatus = async (status: App['status']) => {
    if (!app) return;
    setActionLoading(status);
    try {
      await appsApi.updateStatus(app._id, status);
      setApp((a) => a ? { ...a, status } : a);
    } catch { setError('Failed to update status.'); }
    finally { setActionLoading(''); }
  };

  const handleDelete = async () => {
    if (!app || deleteInput !== app.name) return;
    setActionLoading('delete');
    try {
      await appsApi.delete(app._id);
      navigate('/apps');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to delete app.');
      setActionLoading('');
    }
  };

  const handleRegenPassword = async () => {
    if (!app) return;
    setRegenLoading(true);
    try {
      const res = await appsApi.regeneratePassword(app._id);
      setApp((a) => a ? { ...a, mongoPassword: res.data.mongoPassword } : a);
      setRegenConfirm(false);
      setShowPass(true);
    } catch { setError('Failed to regenerate password.'); }
    finally { setRegenLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-400">{error}</p>
          <Link to="/apps" className="text-emerald-400 hover:underline text-sm mt-3 inline-block">Back to Apps</Link>
        </div>
      </div>
    );
  }

  if (!app) return null;

  const host = serverConfig?.mongoHost ?? 'your-server-ip';
  const port = serverConfig?.mongoPort ?? 27017;
  const user = app.mongoUser ?? app.name;
  const pass = app.mongoPassword ?? '••••••••';
  const passDisplay = showPass ? pass : '••••••••••••••••';

  const internalConn = `mongodb://127.0.0.1:27018/${app.name}`;
  const vpsConn = `mongodb://${user}:${pass}@${host}:${port}/${app.name}?authSource=admin`;
  const vpsConnMasked = `mongodb://${user}:${showPass ? pass : '••••••••••••••••'}@${host}:${port}/${app.name}?authSource=admin`;
  const httpEndpoint = `${window.location.origin}/app/data-api/endpoint/data/v1/action/{action}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Link to="/apps" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Apps
        </Link>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: app.color }}
          >
            {app.displayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-100">{app.displayName}</h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-slate-500 text-sm font-mono mt-0.5">{app.name}</p>
            {app.description && <p className="text-slate-400 text-sm mt-1">{app.description}</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold text-slate-200 mb-1">App Status</h2>
        <p className="text-slate-500 text-sm mb-4">Control whether this app's database is active, paused, or suspended.</p>
        <div className="flex flex-wrap gap-2">
          {(['running', 'paused', 'suspended'] as const).map((s) => {
            const icons = { running: Play, paused: Pause, suspended: Ban };
            const Icon = icons[s];
            const activeStyles = {
              running: 'bg-emerald-800/50 text-emerald-300 border border-emerald-700',
              paused: 'bg-slate-700 text-slate-300 border border-slate-600',
              suspended: 'bg-amber-900/50 text-amber-300 border border-amber-700',
            };
            const hoverStyles = {
              running: 'text-emerald-400 hover:bg-emerald-900/20',
              paused: 'text-slate-400 hover:bg-slate-700',
              suspended: 'text-amber-400 hover:bg-amber-900/20',
            };
            const isActive = app.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                disabled={isActive || !!actionLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  isActive ? activeStyles[s] : `bg-slate-800 ${hoverStyles[s]}`
                }`}
              >
                <Icon className="w-4 h-4" /> {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-semibold text-slate-200">Connection Strings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPass(!showPass)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPass ? 'Hide' : 'Show'} password
            </button>
          </div>
        </div>
        <p className="text-slate-500 text-sm mb-5">Ready-to-use connection strings for all environments.</p>

        <div className="space-y-4">
          <ConnRow
            label="Internal (same server)"
            value={internalConn}
            color="text-emerald-300"
            note="Use this when your app runs on the same machine as MongoDB."
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                VPS / External · <Server className="w-3 h-3 inline" /> {host}:{port}
              </p>
              <button
                onClick={() => setRegenConfirm(true)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate password
              </button>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
              <code className="text-blue-300 text-sm font-mono flex-1 break-all">{vpsConnMasked}</code>
              <CopyButton text={vpsConn} />
            </div>
            <div className="mt-2 p-3 bg-slate-800/60 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex gap-2">
                <span className="text-slate-500 shrink-0">Host</span>
                <code className="text-slate-300 font-mono truncate">{host}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 shrink-0">Port</span>
                <code className="text-slate-300 font-mono">{port}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 shrink-0">Database</span>
                <code className="text-slate-300 font-mono truncate">{app.name}</code>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-500 shrink-0">User</span>
                <code className="text-emerald-300 font-mono truncate">{user}</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 shrink-0">Password</span>
                <code className="text-emerald-300 font-mono truncate">{passDisplay}</code>
              </div>
            </div>
            {serverConfig?.mongoHost === 'your-server-ip' && (
              <p className="text-amber-500/80 text-xs mt-2">
                Set <code className="font-mono">MONGO_PUBLIC_HOST</code> environment variable to your VPS IP for accurate connection strings.
              </p>
            )}
          </div>

          <ConnRow
            label="HTTP API Endpoint"
            value={httpEndpoint}
            color="text-amber-300"
            note="Atlas-compatible REST API. Add header: api-key: <your-key>"
          />
        </div>
      </div>

      {regenConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-900/40 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Regenerate Password</h3>
                <p className="text-slate-500 text-sm">Old password will stop working</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-5">
              A new password will be generated for <strong className="text-slate-200">{app.name}</strong>. Any apps using the old password will need to be updated.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRegenConfirm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleRegenPassword} disabled={regenLoading} className="btn-primary flex-1 text-sm">
                {regenLoading ? 'Generating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {app.stats && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-200 mb-4">Storage & Collections</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Collections', value: app.stats.collections },
              { label: 'Documents', value: app.stats.objects.toLocaleString() },
              { label: 'Data Size', value: formatBytes(app.stats.dataSize) },
              { label: 'Storage Size', value: formatBytes(app.stats.storageSize) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-slate-100">{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {app.stats.collectionNames.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Collections</p>
              <div className="flex flex-wrap gap-2">
                {app.stats.collectionNames.map((col) => (
                  <Link
                    key={col}
                    to={`/databases?db=${app.name}&col=${col}`}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    {col}
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card p-5 border-red-900/50">
        <h2 className="font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-slate-500 text-sm mb-4">Permanently delete this app and all its data. This cannot be undone.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger text-sm flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete App
          </button>
        ) : (
          <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-4">
            <p className="text-red-300 text-sm mb-3">
              Type <strong className="font-mono">{app.name}</strong> to confirm:
            </p>
            <input
              type="text"
              className="input mb-3 border-red-800/50 focus:ring-red-500"
              placeholder={app.name}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== app.name || actionLoading === 'delete'}
                className="btn-danger text-sm"
              >
                {actionLoading === 'delete' ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
