import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Database, ChevronRight, ChevronLeft, ChevronDown, Rows } from 'lucide-react';
import { databases as dbApi } from '../api';
import type { Database as DB, Collection, DocumentPage } from '../types';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

export default function Databases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dbs, setDbs] = useState<DB[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | null>(searchParams.get('db'));
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCol, setSelectedCol] = useState<string | null>(searchParams.get('col'));
  const [docPage, setDocPage] = useState<DocumentPage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [colLoading, setColLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    dbApi.list()
      .then((r) => setDbs(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDb) { setCollections([]); setSelectedCol(null); setDocPage(null); return; }
    setColLoading(true);
    dbApi.collections(selectedDb)
      .then((r) => setCollections(r.data))
      .finally(() => setColLoading(false));
  }, [selectedDb]);

  useEffect(() => {
    if (!selectedDb || !selectedCol) { setDocPage(null); return; }
    setDocLoading(true);
    dbApi.documents(selectedDb, selectedCol, page)
      .then((r) => setDocPage(r.data))
      .finally(() => setDocLoading(false));
  }, [selectedDb, selectedCol, page]);

  const selectDb = (name: string) => {
    const next = selectedDb === name ? null : name;
    setSelectedDb(next);
    setSelectedCol(null);
    setPage(1);
    setSearchParams(next ? { db: next } : {});
  };

  const selectCol = (name: string) => {
    const next = selectedCol === name ? null : name;
    setSelectedCol(next);
    setPage(1);
    if (selectedDb) setSearchParams(next ? { db: selectedDb, col: next } : { db: selectedDb });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Databases</h1>
        <p className="text-slate-500 text-sm mt-0.5">Browse your MongoDB databases and collections</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Databases {dbs.length > 0 && `(${dbs.length})`}
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dbs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Database className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No databases yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {dbs.map((db) => (
                  <button
                    key={db.name}
                    onClick={() => selectDb(db.name)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-left text-sm transition-colors ${
                      selectedDb === db.name
                        ? 'bg-emerald-900/30 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 truncate font-mono text-xs">{db.name}</span>
                    <span className="text-slate-600 text-xs">{formatBytes(db.sizeOnDisk)}</span>
                    {selectedDb === db.name
                      ? <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDb && (
            <div className="card mt-4">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Collections</p>
              </div>
              {colLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : collections.length === 0 ? (
                <p className="text-slate-500 text-sm px-4 py-6 text-center">No collections</p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {collections.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => selectCol(col.name)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                        selectedCol === col.name
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Rows className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate font-mono text-xs">{col.name}</span>
                      <span className="text-slate-600 text-xs">{col.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selectedCol ? (
            <div className="card p-12 text-center">
              <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">Select a database and collection to browse documents</p>
            </div>
          ) : docLoading ? (
            <div className="card flex justify-center items-center h-64">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docPage ? (
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200 text-sm font-mono">
                    {selectedDb}.{selectedCol}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {docPage.total.toLocaleString()} documents · page {docPage.page} of {docPage.pages}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-slate-500 text-xs">{page} / {docPage.pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(docPage.pages, p + 1))}
                    disabled={page >= docPage.pages}
                    className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-250px)]">
                {docPage.documents.map((doc, i) => (
                  <div key={i} className="border-b border-slate-800/50 last:border-0">
                    <pre className="px-5 py-4 text-xs text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed hover:bg-slate-800/30 transition-colors">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                ))}
                {docPage.documents.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No documents in this collection.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
