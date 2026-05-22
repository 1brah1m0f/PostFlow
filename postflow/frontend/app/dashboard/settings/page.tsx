'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Camera, Instagram, CheckCircle2, AlertCircle, Loader2, Pencil } from 'lucide-react';

interface Account {
  id: string;
  username: string;
  is_active: boolean;
  profile_pic_url: string | null;
  is_verified: boolean;
}

type Tab = 'profile' | 'social' | 'team' | 'billing';

export default function Settings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('social');
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit modal
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '' });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');

  // Per-card states
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [pageError, setPageError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const auth = { Authorization: `Bearer ${token}` };

  async function loadAccounts() {
    if (!token) { router.push('/login'); return; }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, { headers: auth });
    const data = await res.json();
    setAccounts(Array.isArray(data) ? data : []);
  }

  useEffect(() => { loadAccounts(); }, []);

  /* ── Add ─────────────────────────────────────────────── */
  async function handleAdd() {
    if (!addForm.username.trim() || !addForm.password.trim()) {
      setAddError('Please fill in both fields.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: addForm.username.replace('@', ''), password: addForm.password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Failed to add account');
      setShowAddModal(false);
      setAddForm({ username: '', password: '' });
      loadAccounts();
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  }

  /* ── Edit ────────────────────────────────────────────── */
  function openEdit(account: Account) {
    setEditAccount(account);
    setEditForm({ username: account.username, password: '' });
    setEditError('');
  }

  async function handleEdit() {
    if (!editAccount) return;
    if (!editForm.username.trim()) { setEditError('Username cannot be empty.'); return; }
    setEditing(true);
    setEditError('');
    try {
      const body: Record<string, string> = {
        username: editForm.username.replace('@', ''),
      };
      if (editForm.password.trim()) body.password = editForm.password;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/${editAccount.id}`, {
        method: 'PUT',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Failed to update account');
      setEditAccount(null);
      loadAccounts();
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditing(false);
    }
  }

  /* ── Unlink ──────────────────────────────────────────── */
  async function handleUnlink(id: string) {
    setUnlinking(id);
    setPageError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/${id}`, {
        method: 'DELETE',
        headers: auth,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || 'Failed to unlink account');
      }
      loadAccounts();
    } catch (e: any) {
      setPageError(e.message);
    } finally {
      setUnlinking(null);
    }
  }

  /* ── Verify ──────────────────────────────────────────── */
  async function handleVerify(id: string) {
    setVerifying(id);
    setPageError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/${id}/verify`, {
        method: 'POST',
        headers: auth,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Verification failed');
      loadAccounts();
    } catch (e: any) {
      setPageError(e.message);
    } finally {
      setVerifying(null);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'social', label: 'Social Accounts' },
    { key: 'team', label: 'Team Members' },
    { key: 'billing', label: 'Billing' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md space-y-5">
            <h2 className="text-2xl font-bold text-pf-brown">Connect Instagram</h2>
            <p className="text-pf-brown/60 text-sm">Enter your Instagram credentials to connect your account.</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  placeholder="@username"
                  value={addForm.username}
                  onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                  className="w-full bg-pf-tan/10 border border-pf-brown/10 rounded-xl px-4 py-3 text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full bg-pf-tan/10 border border-pf-brown/10 rounded-xl px-4 py-3 text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green transition-colors"
                />
              </div>
            </div>
            {addError && <p className="text-sm text-red-500">{addError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowAddModal(false); setAddError(''); setAddForm({ username: '', password: '' }); }}
                className="flex-1 py-3 bg-pf-tan/30 text-pf-brown font-bold rounded-xl hover:bg-pf-tan/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 py-3 bg-pf-green text-white font-bold rounded-xl hover:bg-pf-green/90 transition-colors disabled:opacity-60"
              >
                {adding ? 'Connecting...' : 'Connect Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editAccount && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md space-y-5">
            <h2 className="text-2xl font-bold text-pf-brown">Edit Account</h2>
            <p className="text-pf-brown/60 text-sm">Update your Instagram username or password.</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full bg-pf-tan/10 border border-pf-brown/10 rounded-xl px-4 py-3 text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">
                  New Password <span className="normal-case font-normal text-pf-brown/40">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-pf-tan/10 border border-pf-brown/10 rounded-xl px-4 py-3 text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green transition-colors"
                />
              </div>
            </div>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditAccount(null)}
                className="flex-1 py-3 bg-pf-tan/30 text-pf-brown font-bold rounded-xl hover:bg-pf-tan/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editing}
                className="flex-1 py-3 bg-pf-green text-white font-bold rounded-xl hover:bg-pf-green/90 transition-colors disabled:opacity-60"
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-pf-brown">Settings</h1>
        <p className="text-pf-brown/60 mt-1">Manage your workspace preferences and connected accounts.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-pf-brown/10">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.key ? 'text-pf-brown' : 'text-pf-brown/40 hover:text-pf-brown/70'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pf-brown rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Social Accounts Tab */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          {pageError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {pageError}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-pf-brown">Instagram Connections</h2>
              <p className="text-pf-brown/60 text-sm mt-1">Connect Instagram Business accounts to schedule posts and reels.</p>
            </div>
            <button
              onClick={() => { setShowAddModal(true); setAddError(''); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-pf-green text-white font-semibold rounded-xl hover:bg-pf-green/90 transition-colors shadow-sm text-sm whitespace-nowrap"
            >
              <PlusCircle size={16} />
              Add Account
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map(account => (
              <div key={account.id} className="bg-white rounded-2xl border border-pf-brown/8 p-4 flex items-center gap-4 shadow-sm">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {account.profile_pic_url ? (
                    <img src={account.profile_pic_url} alt={account.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pf-tan to-pf-rust/40 flex items-center justify-center text-white font-bold text-lg">
                      {account.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 rounded-full ${account.is_verified ? 'text-pf-green' : 'text-pf-brown/30'}`}>
                    {account.is_verified
                      ? <CheckCircle2 size={16} className="bg-white rounded-full" />
                      : <AlertCircle size={16} className="bg-white rounded-full" />
                    }
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-pf-brown truncate capitalize">{account.username.replace(/_/g, ' ')}</p>
                  <p className="text-pf-brown/50 text-sm truncate">@{account.username}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pf-green/10 text-pf-green text-xs font-semibold rounded-md">
                      <Instagram size={10} /> Instagram
                    </span>
                    {account.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs font-semibold rounded-md">
                        <CheckCircle2 size={10} /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-md">
                        <AlertCircle size={10} /> Not verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleVerify(account.id)}
                    disabled={verifying === account.id}
                    className="px-3 py-1.5 border border-pf-green/40 text-pf-green text-xs font-semibold rounded-lg hover:bg-pf-green/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {verifying === account.id ? <><Loader2 size={12} className="animate-spin" /> Verifying...</> : 'Verify'}
                  </button>
                  <button
                    onClick={() => openEdit(account)}
                    className="px-3 py-1.5 border border-pf-brown/15 text-pf-brown text-xs font-medium rounded-lg hover:bg-pf-brown/5 transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleUnlink(account.id)}
                    disabled={unlinking === account.id}
                    className="px-3 py-1.5 border border-red-200 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {unlinking === account.id ? '...' : 'Unlink'}
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slot */}
            <button
              onClick={() => { setShowAddModal(true); setAddError(''); }}
              className="bg-white/60 border-2 border-dashed border-pf-brown/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[90px] hover:bg-pf-tan/10 transition-colors"
            >
              <Camera size={24} className="text-pf-brown/30" />
              <p className="text-pf-brown/70 text-sm font-semibold">Room for more creativity.</p>
              <p className="text-pf-brown/40 text-xs">Connect another account to manage everything in one place.</p>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-pf-brown/8 p-8 text-center space-y-2 shadow-sm">
          <p className="text-pf-brown font-semibold">Profile settings</p>
          <p className="text-pf-brown/50 text-sm">Coming soon.</p>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-white rounded-2xl border border-pf-brown/8 p-8 text-center space-y-2 shadow-sm">
          <p className="text-pf-brown font-semibold">Team Members</p>
          <p className="text-pf-brown/50 text-sm">Coming soon.</p>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-pf-brown/8 p-8 text-center space-y-2 shadow-sm">
          <p className="text-pf-brown font-semibold">Billing</p>
          <p className="text-pf-brown/50 text-sm">Coming soon.</p>
        </div>
      )}
    </div>
  );
}
