import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppWindow, Database, HardDrive, Zap,
  PauseCircle, AlertCircle, Plus, ExternalLink, Activity
} from 'lucide-react';
import { stats, apps } from '../api';
import type { DashboardStats, App } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: App['status'] }) {
  const map = {
    running: 'bg-emerald-400',
    suspended: 'bg-amber-400',
    paused: 'bg-slate-500',
  };
  return <span className={`w-2 h-2 rounded-full ${map[status]} shrink-0`} />;
}

export default function Dashboard() {
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([stats.get(), apps.list()])
      .then(([statsRes, appsRes]) => {
        setDashStats(statsRes.data);
        setRecentApps(appsRes.data.slice(0, 6));
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your MongoDB overview</p>
        </div>
        <Link to="/apps/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          New App
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {dashStats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Running Apps"
              value={dashStats.apps.running}
              sub={`${dashStats.apps.total} total`}
              icon={Zap}
              color="bg-emerald-600"
            />
            <StatCard
              label="Suspended"
              value={dashStats.apps.suspended}
              icon={AlertCircle}
              color="bg-amber-600"
            />
            <StatCard
              label="Paused"
              value={dashStats.apps.paused}
              icon={PauseCircle}
              color="bg-slate-600"
            />
            <StatCard
              label="Data Size"
              value={formatBytes(dashStats.storage.dataSize)}
              sub={dashStats.storage.disk.total > 0
                ? `${formatBytes(dashStats.storage.disk.available)} free`
                : undefined}
              icon={HardDrive}
              color="bg-blue-600"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                  <AppWindow className="w-4 h-4 text-slate-400" /> Recent Apps
                </h2>
                <Link to="/apps" className="text-emerald-400 hover:text-emerald-300 text-sm">
                  View all →
                </Link>
              </div>
              <div className="card divide-y divide-slate-800">
                {recentApps.length === 0 ? (
                  <div className="p-8 text-center">
                    <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">No apps yet.</p>
                    <Link to="/apps/new" className="text-emerald-400 hover:underline text-sm mt-2 inline-block">
                      Create your first app
                    </Link>
                  </div>
                ) : (
                  recentApps.map((app) => (
                    <Link
                      key={app._id}
                      to={`/apps/${app._id}`}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: app.color }}
                      >
                        {app.displayName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 text-sm truncate">{app.displayName}</p>
                        <p className="text-slate-500 text-xs font-mono truncate">{app.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusDot status={app.status} />
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-slate-400" /> Server Info
              </h2>
              <div className="card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">MongoDB</span>
                  <span className="text-slate-200 font-mono">v{dashStats.mongodb.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Uptime</span>
                  <span className="text-slate-200">{formatUptime(dashStats.mongodb.uptime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Connections</span>
                  <span className="text-slate-200">
                    {dashStats.mongodb.connections?.current ?? '–'}
                    {dashStats.mongodb.connections?.available
                      ? ` / ${dashStats.mongodb.connections.available}`
                      : ''}
                  </span>
                </div>
                {dashStats.storage.disk.total > 0 && (
                  <>
                    <div className="border-t border-slate-800 pt-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Disk Usage</span>
                        <span className="text-slate-200">
                          {Math.round((dashStats.storage.disk.used / dashStats.storage.disk.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((dashStats.storage.disk.used / dashStats.storage.disk.total) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>{formatBytes(dashStats.storage.disk.used)} used</span>
                        <span>{formatBytes(dashStats.storage.disk.total)} total</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Link to="/apps/new" className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Create New App
                </Link>
                <Link to="/databases" className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
                  <Database className="w-4 h-4" /> Browse Databases
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
