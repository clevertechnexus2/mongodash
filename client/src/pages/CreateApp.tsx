import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { apps as appsApi } from '../api';

const COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1',
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
}

export default function CreateApp() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dbName = slugify(displayName) || 'my_app';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await appsApi.create({ displayName: displayName.trim(), description, color });
      navigate(`/apps/${res.data._id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create app.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/apps" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Apps
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">Create New App</h1>
        <p className="text-slate-500 text-sm mt-1">Each app gets its own MongoDB database and connection string.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">App Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Awesome App"
              maxLength={50}
              required
            />
            <p className="text-slate-600 text-xs mt-1.5">
              Database name: <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">{dbName}</code>
            </p>
          </div>

          <div>
            <label className="label">Description <span className="text-slate-600">(optional)</span></label>
            <textarea
              className="input resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this app for?"
              rows={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg relative transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview</p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: color }}
            >
              {(displayName || 'A')[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-100">{displayName || 'App Name'}</p>
              <p className="text-slate-500 text-xs font-mono mt-0.5">
                mongodb://127.0.0.1:27018/<span className="text-emerald-400">{dbName}</span>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/apps" className="btn-secondary flex-1 text-center text-sm">Cancel</Link>
          <button type="submit" className="btn-primary flex-1 text-sm" disabled={loading || !displayName.trim()}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : 'Create App'}
          </button>
        </div>
      </form>
    </div>
  );
}
