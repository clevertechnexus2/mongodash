import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { auth } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.login(username, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/50">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">MongoDash</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage your databases</p>
        </div>

        <div className="card p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">
          Password shown in console on first start
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-6 mb-8">
          <div
            className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ background: 'linear-gradient(135deg,#6e5cff,#0ff4c6)' }}
          >
            X
          </div>
          <span className="text-slate-700 text-xs">
            Built by{' '}
            <a
              href="https://clevertechnexus.qzz.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clever Tech Nexus · CleverX
            </a>
          </span>
        </div>

        <nav className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1.5 text-xs">
          <Link to="/terms" className="text-slate-700 hover:text-slate-400 transition-colors">Terms</Link>
          <span className="text-slate-800">·</span>
          <Link to="/privacy" className="text-slate-700 hover:text-slate-400 transition-colors">Privacy</Link>
          <span className="text-slate-800">·</span>
          <Link to="/license" className="text-slate-700 hover:text-slate-400 transition-colors">License</Link>
          <span className="text-slate-800">·</span>
          <a href="mailto:support@clevertechnexus.qzz.io" className="text-slate-700 hover:text-slate-400 transition-colors">Support</a>
        </nav>
      </div>
    </div>
  );
}
