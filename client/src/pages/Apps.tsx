import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Database, ChevronRight, Play, Pause, Ban, User } from 'lucide-react';
import { apps as appsApi, auth as authApi } from '../api';
import type { App } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function StatusBadge({ status }: { status: App['status'] }) {
  const map = {
    running: { cls: 'badge-running', label: 'Running' },
    suspended: { cls: 'badge-suspended', label: 'Suspended' },
    paused: { cls: 'badge-paused', label: 'Paused' },
  };
  const { cls, label } = map[status];
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-emerald-400' : status === 'suspended' ? 'bg-amber-400' : 'bg-slate-500'}`} />
      {label}
    </span>
  );
}

export default function Apps() {
  const [appList, setAppList] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | App['status']>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  const load = () => {
    setLoading(true);
    appsApi.list()
      .then((r) => setAppList(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    authApi.me().then((r) => setCurrentUsername(r.data.username));
  }, []);

  const handleStatus = async (id: string, status: App['status']) => {
    setActionLoading(id + status);
    try {
      await appsApi.updateStatus(id, status);
      setAppList((prev) => prev.map((a) => a._id === id ? { ...a, status } : a));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = appList.filter((a) => {
    const matchesSearch =
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Apps</h1>
          <p className="text-slate-500 text-sm mt-0.5">{appList.length} total apps</p>
        </div>
        <Link to="/apps/new" className="btn-primary flex items-center gap-2 text-sm self-start">
          <Plus className="w-4 h-4" /> New App
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {(['all', 'running', 'suspended', 'paused'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-emerald-800/60 text-emerald-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">
            {search || filter !== 'all' ? 'No apps match your filters.' : 'No apps yet.'}
          </p>
          {!search && filter === 'all' && (
            <Link to="/apps/new" className="text-emerald-400 hover:underline text-sm mt-2 inline-block">
              Create your first app →
            </Link>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-slate-800">
          {filtered.map((app) => (
            <div key={app._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 group">
              <div
                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: app.color }}
              >
                {app.displayName[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-200 text-sm">{app.displayName}</p>
                  <StatusBadge status={app.status} />
                  {currentUsername === 'admin' && app.owner && (
                    <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-950/50 border border-violet-800/50 px-1.5 py-0.5 rounded-full">
                      <User className="w-2.5 h-2.5" />
                      {app.owner}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs font-mono mt-0.5">{app.name}</p>
                {app.description && (
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{app.description}</p>
                )}
              </div>

              <div className="hidden sm:flex flex-col items-end text-xs text-slate-500 gap-0.5">
                {app.stats && (
                  <>
                    <span>{app.stats.collections} collections</span>
                    <span>{formatBytes(app.stats.dataSize)}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {app.status !== 'running' && (
                  <button
                    title="Resume"
                    onClick={() => handleStatus(app._id, 'running')}
                    disabled={!!actionLoading}
                    className="p-1.5 text-emerald-500 hover:bg-emerald-900/30 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                {app.status !== 'paused' && (
                  <button
                    title="Pause"
                    onClick={() => handleStatus(app._id, 'paused')}
                    disabled={!!actionLoading}
                    className="p-1.5 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}
                {app.status !== 'suspended' && (
                  <button
                    title="Suspend"
                    onClick={() => handleStatus(app._id, 'suspended')}
                    disabled={!!actionLoading}
                    className="p-1.5 text-amber-500 hover:bg-amber-900/30 rounded-lg transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Link
                to={`/apps/${app._id}`}
                className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
