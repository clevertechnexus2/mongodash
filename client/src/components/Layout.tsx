import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, AppWindow, Database, BookOpen,
  LogOut, Leaf, Menu, X, Users, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { auth } from '../api';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/apps', label: 'Apps', icon: AppWindow },
  { to: '/databases', label: 'Databases', icon: Database },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/docs', label: 'Docs', icon: BookOpen },
];

function SidebarContent({ mobile, onClose, onLogout }: { mobile?: boolean; onClose?: () => void; onLogout: () => void }) {
  return (
    <div className="flex flex-col bg-slate-900 border-r border-slate-800 h-screen w-60">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-100 text-sm leading-tight tracking-wide">MongoDash</p>
          <p className="text-emerald-400 text-xs">MongoDB Manager</p>
        </div>
        {mobile && (
          <button className="text-slate-400 hover:text-slate-200" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80">
        <a
          href="https://clevertechnexus.qzz.io"
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-white text-xs font-black"
              style={{ background: 'linear-gradient(135deg,#6e5cff,#0ff4c6)' }}
            >
              X
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors tracking-wide">
              CleverX
            </span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
          </div>
          <p className="text-slate-600 text-xs leading-snug pl-7">
            by Clever Tech Nexus ·CleverX Devs
          </p>
        </a>
      </div>
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-800 bg-slate-900/80">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center shrink-0">
              <Leaf className="w-3 h-3 text-white" />
            </div>
            <div>
              <span className="text-slate-200 font-bold text-sm tracking-wide">MongoDash</span>
              <span className="text-slate-600 text-xs ml-2 hidden sm:inline">Self-hosted MongoDB Management</span>
            </div>
          </div>

          {/* Legal + external links */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <Link to="/terms" className="text-slate-600 hover:text-slate-300 transition-colors">Terms</Link>
            <span className="text-slate-800">·</span>
            <Link to="/privacy" className="text-slate-600 hover:text-slate-300 transition-colors">Privacy</Link>
            <span className="text-slate-800">·</span>
            <Link to="/license" className="text-slate-600 hover:text-slate-300 transition-colors">License</Link>
            <span className="text-slate-800">·</span>
            <Link to="/docs" className="text-slate-600 hover:text-slate-300 transition-colors">Docs</Link>
            <span className="text-slate-800">·</span>
            <a
              href="https://panel.clevertechnexus.qzz.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              Hosting Panel <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span className="text-slate-800">·</span>
            <a href="mailto:support@clevertechnexus.qzz.io" className="text-slate-600 hover:text-slate-300 transition-colors">
              Support
            </a>
          </nav>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-slate-700 text-xs">© {year} Clever Tech Nexus · CleverX Hosting &amp; CleverX Tech Devs · Devs</p>
          <a
            href="https://clevertechnexus.qzz.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 group"
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: 'linear-gradient(135deg,#6e5cff,#0ff4c6)' }}
            >
              
            </div>
            <span
              className="text-xs font-bold text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg,#6e5cff,#0ff4c6)' }}
            >
              CleverX
            </span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden lg:block w-60 shrink-0">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative">
            <SidebarContent mobile onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-100 text-sm tracking-wide">MongoDash</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
