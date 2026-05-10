import { useEffect, useState, FormEvent } from 'react';
import {
  UserPlus, Trash2, User, AlertCircle, Check, X,
  KeyRound, Shield, Clock
} from 'lucide-react';
import api from '../api';

interface UserRecord {
  _id: string;
  username: string;
  createdAt: string;
}

interface NewUserForm {
  username: string;
  password: string;
  confirmPassword: string;
}

interface ChangePassForm {
  newPassword: string;
  confirmPassword: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];
function avatarColor(username: string) {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<NewUserForm>({ username: '', password: '', confirmPassword: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [changePassTarget, setChangePassTarget] = useState<UserRecord | null>(null);
  const [changePassForm, setChangePassForm] = useState<ChangePassForm>({ newPassword: '', confirmPassword: '' });
  const [changePassError, setChangePassError] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    const [usersRes, meRes] = await Promise.all([
      api.get<UserRecord[]>('/users'),
      api.get<{ userId: string }>('/auth/me'),
    ]);
    setUsers(usersRes.data);
    setCurrentUserId(meRes.data.userId);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (addForm.password !== addForm.confirmPassword) {
      return setAddError('Passwords do not match.');
    }
    if (addForm.password.length < 6) {
      return setAddError('Password must be at least 6 characters.');
    }
    setAddLoading(true);
    try {
      await api.post('/users', { username: addForm.username, password: addForm.password });
      setAddForm({ username: '', password: '', confirmPassword: '' });
      setShowAdd(false);
      await load();
      showSuccess(`User "${addForm.username}" created successfully.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddError(msg || 'Failed to create user.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      setDeleteTarget(null);
      await load();
      showSuccess(`User "${deleteTarget.username}" deleted.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg || 'Failed to delete user.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePass = async (e: FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    if (changePassForm.newPassword !== changePassForm.confirmPassword) {
      return setChangePassError('Passwords do not match.');
    }
    setChangePassLoading(true);
    try {
      await api.patch(`/users/${changePassTarget!._id}/password`, { newPassword: changePassForm.newPassword });
      setChangePassTarget(null);
      setChangePassForm({ newPassword: '', confirmPassword: '' });
      showSuccess(`Password updated for "${changePassTarget!.username}".`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setChangePassError(msg || 'Failed to update password.');
    } finally {
      setChangePassLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} login account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowAdd(true); setAddError(''); }} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 rounded-lg px-4 py-3 text-sm mb-6">
          <Check className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {showAdd && (
        <div className="card p-5 mb-6 border-emerald-800/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" /> Create New User
            </h2>
            <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="e.g. alice"
                  minLength={2}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_\-]+"
                  title="Letters, numbers, underscores, hyphens"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  value={addForm.confirmPassword}
                  onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            {addError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {addError}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" className="btn-primary text-sm" disabled={addLoading}>
                {addLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card divide-y divide-slate-800">
          {users.map((user) => {
            const isCurrentUser = user._id === currentUserId;
            return (
              <div key={user._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: avatarColor(user.username) }}
                >
                  {getInitials(user.username)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-200">{user.username}</p>
                    {user.username === 'admin' && (
                      <span className="inline-flex items-center gap-1 bg-violet-900/40 text-violet-400 border border-violet-800/50 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="inline-flex items-center gap-1 bg-emerald-900/40 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Created {timeAgo(user.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setChangePassTarget(user); setChangePassForm({ newPassword: '', confirmPassword: '' }); setChangePassError(''); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Change password"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Password
                  </button>

                  {!isCurrentUser && user.username !== 'admin' && (
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>

                <div className="shrink-0">
                  <User className="w-4 h-4 text-slate-700" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Delete User</h3>
                <p className="text-slate-500 text-sm">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-5">
              Are you sure you want to delete <strong className="text-slate-200">{deleteTarget.username}</strong>? They will immediately lose access to the dashboard.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="btn-danger flex-1 text-sm">
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {changePassTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">Change Password</h3>
                  <p className="text-slate-500 text-sm">{changePassTarget.username}</p>
                </div>
              </div>
              <button onClick={() => setChangePassTarget(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePass} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={changePassForm.newPassword}
                  onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  value={changePassForm.confirmPassword}
                  onChange={(e) => setChangePassForm({ ...changePassForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              {changePassError && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {changePassError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setChangePassTarget(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={changePassLoading}>
                  {changePassLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
