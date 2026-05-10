import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, subtitle, lastUpdated, children }: LegalLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-100 text-sm tracking-wide group-hover:text-emerald-400 transition-colors">
              MongoDash
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-10 pb-8 border-b border-slate-800">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-slate-100 mb-3">{title}</h1>
          <p className="text-slate-500 text-sm">{subtitle}</p>
          <p className="text-slate-700 text-xs mt-3">Last updated: {lastUpdated}</p>
        </div>
        <div className="prose-legal">{children}</div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center shrink-0">
                  <Leaf className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-slate-200 text-sm">MongoDash</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Self-hosted MongoDB management dashboard<br />
                by Clever Tech Nexus · CleverX Hosting & CleverX Tech Devs<br />
                TZ, Dar es salaam
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3">
              <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <Link to="/terms" className="text-slate-500 hover:text-emerald-400 transition-colors">Terms of Service</Link>
                <Link to="/privacy" className="text-slate-500 hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                <Link to="/license" className="text-slate-500 hover:text-emerald-400 transition-colors">License</Link>
                <Link to="/docs" className="text-slate-500 hover:text-emerald-400 transition-colors">Docs</Link>
                <a href="mailto:support@clevertechnexus.qzz.io" className="text-slate-500 hover:text-emerald-400 transition-colors">Support</a>
              </nav>
              <p className="text-slate-700 text-xs">© {year} Clever Tech Nexus. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
