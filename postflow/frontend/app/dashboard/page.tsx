"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Zap, Plus, Users, BarChart2, Folder, Instagram, X, CheckCircle2, Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';

interface Post {
  id: string;
  account_id: string;
  caption: string;
  image_url: string | null;
  scheduled_at: string;
  published_at: string | null;
  status: string;
  error_message?: string | null;
}

interface Account { id: string; username: string; }

interface ReportData {
  total: number; published: number; scheduled: number; failed: number; drafts: number;
  monthly: { month: string; published: number; failed: number; scheduled: number }[];
}

const BAKU_TZ = 'Asia/Baku';

function bakuDateStr(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BAKU_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();

  const dStr = bakuDateStr(d);
  const todayStr = bakuDateStr(now);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);

  const time = new Intl.DateTimeFormat('en', {
    timeZone: BAKU_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);

  if (dStr === todayStr) return `Today, ${time}`;
  if (dStr === bakuDateStr(tomorrow)) return `Tomorrow, ${time}`;
  if (dStr === bakuDateStr(yesterday)) return `Yesterday, ${time}`;

  return new Intl.DateTimeFormat('en', {
    timeZone: BAKU_TZ, weekday: 'short', month: 'short', day: 'numeric',
  }).format(d) + `, ${time}`;
}

const STATUS_CONFIG = {
  scheduled: {
    label: 'Pending',
    icon: Clock,
    pill: 'bg-amber-50 text-amber-600',
    border: 'border-t-amber-400',
  },
  published: {
    label: 'Posted',
    icon: CheckCircle2,
    pill: 'bg-green-50 text-green-600',
    border: 'border-t-pf-green',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    pill: 'bg-red-50 text-red-500',
    border: 'border-t-red-400',
  },
} as const;

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickDraft, setShowQuickDraft] = useState(false);
  const [quickCaption, setQuickCaption] = useState('');
  const [quickAccountId, setQuickAccountId] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const auth = { Authorization: `Bearer ${token}` };

  async function loadData() {
    if (!token) { router.push('/login'); return; }
    try {
      const [userRes, postsRes, accountsRes] = await Promise.all([
        fetch('http://localhost:8000/auth/me', { headers: auth }),
        fetch('http://localhost:8000/posts', { headers: auth }),
        fetch('http://localhost:8000/accounts', { headers: auth }),
      ]);
      const [user, postsData, accountsData] = await Promise.all([
        userRes.json(), postsRes.json(), accountsRes.json(),
      ]);
      // Use saved name, fall back to email prefix
      const name = user.name || user.email?.split('@')[0] || '';
      setUserName(name);
      setPosts(Array.isArray(postsData) ? postsData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch {}
    setLoading(false);
  }

  async function openReports() {
    const res = await fetch('http://localhost:8000/posts/reports/summary', { headers: auth });
    const data = await res.json();
    setReportData(data);
    setShowReports(true);
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    setDeletingId(id);
    await fetch(`http://localhost:8000/posts/${id}`, { method: 'DELETE', headers: auth });
    setDeletingId(null);
    loadData();
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (accounts.length > 0 && !quickAccountId) setQuickAccountId(accounts[0].id);
  }, [accounts]);

  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';

  const now = new Date();

  // Upcoming = future scheduled (for stats counter)
  const upcoming = posts.filter(p => p.status === 'scheduled' && new Date(p.scheduled_at) > now);

  const drafts = posts.filter(p => p.status === 'draft');

  const publishedThisMonth = posts.filter(p => {
    if (p.status !== 'published') return false;
    const d = new Date(p.published_at ?? p.scheduled_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Lineup = all non-draft posts sorted by scheduled_at descending (most recent first)
  const lineup = posts
    .filter(p => p.status !== 'draft')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, 6);

  async function saveQuickDraft() {
    if (!quickCaption.trim() || !quickAccountId) return;
    setQuickSaving(true);
    const scheduled_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await fetch('http://localhost:8000/posts', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: quickAccountId, caption: quickCaption, scheduled_at, status: 'draft' }),
    });
    setQuickSaving(false);
    setShowQuickDraft(false);
    setQuickCaption('');
    loadData();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-pf-brown/60">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* Reports Modal */}
      {showReports && reportData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-pf-brown">Reports</h2>
              <button onClick={() => setShowReports(false)} className="text-pf-brown/40 hover:text-pf-brown"><X size={22} /></button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', value: reportData.total, color: 'bg-pf-tan/30 text-pf-brown' },
                { label: 'Posted', value: reportData.published, color: 'bg-green-50 text-green-700' },
                { label: 'Pending', value: reportData.scheduled, color: 'bg-amber-50 text-amber-700' },
                { label: 'Failed', value: reportData.failed, color: 'bg-red-50 text-red-600' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-xs font-semibold mt-1 uppercase tracking-wider opacity-70">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Monthly bar chart */}
            <div className="space-y-3">
              <h3 className="font-semibold text-pf-brown">Posts per Month</h3>
              <div className="space-y-3">
                {reportData.monthly.map(m => {
                  const total = m.published + m.failed + m.scheduled || 1;
                  const max = Math.max(...reportData.monthly.map(x => x.published + x.failed + x.scheduled), 1);
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-pf-brown/60 w-16 flex-shrink-0">{m.month}</span>
                      <div className="flex-1 flex gap-0.5 h-7 rounded-lg overflow-hidden bg-pf-tan/10">
                        {m.published > 0 && (
                          <div className="bg-pf-green/70 flex items-center justify-center text-white text-[10px] font-bold transition-all"
                            style={{ width: `${(m.published / max) * 100}%` }}>
                            {m.published}
                          </div>
                        )}
                        {m.scheduled > 0 && (
                          <div className="bg-amber-400/70 flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ width: `${(m.scheduled / max) * 100}%` }}>
                            {m.scheduled}
                          </div>
                        )}
                        {m.failed > 0 && (
                          <div className="bg-red-400/70 flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ width: `${(m.failed / max) * 100}%` }}>
                            {m.failed}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 text-xs text-pf-brown/60 pt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-pf-green/70 inline-block"/>Posted</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400/70 inline-block"/>Pending</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400/70 inline-block"/>Failed</span>
              </div>
            </div>

            <p className="text-xs text-pf-brown/40 border-t border-pf-brown/5 pt-4">
              Likes and views require Instagram Business API access — not available with automation-based posting.
            </p>
          </div>
        </div>
      )}

      {/* Quick Draft Modal */}
      {showQuickDraft && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-lg space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-pf-brown">Quick Draft</h2>
              <button onClick={() => setShowQuickDraft(false)} className="text-pf-brown/40 hover:text-pf-brown">
                <X size={22} />
              </button>
            </div>
            {accounts.length === 0 ? (
              <p className="text-pf-brown/60 text-sm">
                No accounts yet. <Link href="/dashboard/settings" className="text-pf-green underline">Add one in Settings.</Link>
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Account</label>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setQuickAccountId(a.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                          quickAccountId === a.id
                            ? 'border-pf-green bg-pf-green/10 text-pf-brown'
                            : 'border-transparent bg-pf-tan/20 text-pf-brown hover:bg-pf-tan/30'
                        }`}
                      >
                        @{a.username}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Caption</label>
                  <textarea
                    autoFocus
                    value={quickCaption}
                    onChange={e => setQuickCaption(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-pf-tan/10 border border-pf-brown/10 rounded-xl px-4 py-3 text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green transition-colors resize-none min-h-[120px]"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowQuickDraft(false)}
                    className="flex-1 py-3 bg-pf-tan/30 text-pf-brown font-bold rounded-xl hover:bg-pf-tan/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveQuickDraft}
                    disabled={quickSaving || !quickCaption.trim()}
                    className="flex-1 py-3 bg-pf-green text-white font-bold rounded-xl hover:bg-pf-green/90 transition-colors disabled:opacity-60"
                  >
                    {quickSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pf-tan/20 text-pf-brown rounded-full text-sm font-medium">
            <Calendar size={16} />
            <span>Today's Overview</span>
          </div>
          <h1 className="text-5xl font-bold text-pf-brown tracking-tight">
            Welcome back.
          </h1>
          <p className="text-pf-brown/60 text-lg">Here's what's happening across your channels today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowQuickDraft(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-pf-brown/10 text-pf-brown font-medium rounded-full hover:bg-pf-brown/5 transition-colors shadow-sm"
          >
            <Zap size={18} />
            Quick Draft
          </button>
          <Link href="/dashboard/new" className="flex items-center gap-2 px-6 py-3 bg-pf-green text-white font-medium rounded-full hover:bg-pf-green/90 transition-colors shadow-md">
            <Plus size={18} />
            New Post
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5 space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pf-brown/60 text-sm font-medium uppercase tracking-wider">
                  <Calendar size={16} />
                  <span>Scheduled</span>
                </div>
                <div className="text-4xl font-bold text-pf-brown">{upcoming.length}</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-pf-green/10 flex items-center justify-center text-pf-green">
                <Calendar size={24} />
              </div>
            </div>
            <hr className="border-pf-brown/5" />
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pf-brown/60 text-sm font-medium uppercase tracking-wider">
                  <Zap size={16} />
                  <span>Published This Month</span>
                </div>
                <div className="text-4xl font-bold text-pf-brown">{publishedThisMonth.length}</div>
              </div>
            </div>
          </div>

          {/* Drafts count */}
          <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5 space-y-4">
            <div className="flex items-center gap-2 text-pf-brown/60 text-sm font-medium uppercase tracking-wider">
              <Folder size={16} />
              <span>Drafts</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-5xl font-bold text-pf-brown">{drafts.length}</div>
              <Link href="/dashboard/new" className="px-3 py-1 bg-pf-green/20 text-pf-green text-sm font-bold rounded-full flex items-center gap-1 hover:bg-pf-green/30 transition-colors">
                <Plus size={14} /> New
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5">
            <h3 className="text-xl font-bold text-pf-brown mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/new" className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-pf-brown/10 hover:bg-pf-brown/5 transition-colors text-pf-brown">
                <Plus size={24} />
                <span className="font-medium">New Post</span>
              </Link>
              <Link href="/dashboard/settings" className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-pf-brown/10 hover:bg-pf-brown/5 transition-colors text-pf-brown">
                <Users size={24} />
                <span className="font-medium">Accounts</span>
              </Link>
              <button
                onClick={() => setShowQuickDraft(true)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-pf-brown/10 hover:bg-pf-brown/5 transition-colors text-pf-brown"
              >
                <Zap size={24} />
                <span className="font-medium">Quick Draft</span>
              </button>
              <button
                onClick={openReports}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-pf-brown/10 hover:bg-pf-brown/5 transition-colors text-pf-brown"
              >
                <BarChart2 size={24} />
                <span className="font-medium">Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lineup header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-pf-brown" size={24} />
              <h2 className="text-2xl font-bold text-pf-brown">Upcoming Lineup</h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-600"><Clock size={12} /> Pending</span>
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> Posted</span>
              <span className="flex items-center gap-1 text-red-500"><AlertCircle size={12} /> Failed</span>
            </div>
          </div>

          {lineup.length === 0 && drafts.length === 0 ? (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-pf-tan/50 p-12 flex flex-col items-center justify-center text-center space-y-4">
              <p className="text-pf-brown/60 text-lg font-medium">No posts yet.</p>
              <Link href="/dashboard/new" className="flex items-center gap-2 px-6 py-3 bg-pf-green text-white font-medium rounded-full hover:bg-pf-green/90 transition-colors">
                <Plus size={18} /> Create your first post
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lineup.slice(0, 2).map(post => {
                const cfg = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
                const Icon = cfg.icon;
                return (
                  <div key={post.id} className={`bg-white rounded-[2rem] shadow-soft border-t-4 ${cfg.border} border-x border-b border-pf-brown/5 overflow-hidden flex flex-col`}>
                    <div className="p-6 space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pf-tan/20 text-pf-brown text-xs font-bold rounded-md">
                          <Instagram size={14} /> Instagram
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.pill}`}>
                            <Icon size={11} /> {cfg.label}
                          </span>
                          {post.status !== 'published' && (
                            <>
                              <Link href={`/dashboard/new?edit=${post.id}`}
                                className="p-1.5 text-pf-brown/40 hover:text-pf-green hover:bg-pf-green/10 rounded-lg transition-colors">
                                <Pencil size={13} />
                              </Link>
                              <button onClick={() => deletePost(post.id)} disabled={deletingId === post.id}
                                className="p-1.5 text-pf-brown/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-pf-brown/60 font-semibold text-sm">{formatDate(post.scheduled_at)}</p>
                      <p className="text-pf-brown text-base line-clamp-3">{post.caption}</p>
                      {post.status === 'failed' && (
                        <p className="text-xs text-red-400 italic line-clamp-2">{post.error_message || 'Posting failed'}</p>
                      )}
                    </div>
                    {post.image_url && (
                      <div className="h-40 mx-4 mb-4 rounded-xl overflow-hidden">
                        <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}

              {drafts.slice(0, 1).map(draft => (
                <div key={draft.id} className="bg-white/50 border-2 border-dashed border-pf-tan/50 rounded-[2rem] p-6 flex flex-col justify-between min-h-[280px]">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pf-tan/20 text-pf-brown text-xs font-bold rounded-md">
                      <Instagram size={14} /> Instagram
                    </div>
                    <p className="text-pf-brown/60 font-bold text-sm">Draft</p>
                    <p className="text-pf-brown/70 text-sm italic line-clamp-4">
                      {draft.caption || 'No caption yet...'}
                    </p>
                  </div>
                  <Link href={`/dashboard/new?edit=${draft.id}`} className="text-pf-green font-medium hover:underline text-sm mt-4 inline-block">
                    Continue Editing →
                  </Link>
                </div>
              ))}

              {lineup.slice(0, 2).length + Math.min(drafts.length, 1) < 3 && (
                <Link href="/dashboard/new" className="bg-white/50 border-2 border-dashed border-pf-tan/30 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center gap-3 min-h-[280px] hover:bg-pf-tan/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-pf-green/10 flex items-center justify-center text-pf-green">
                    <Plus size={24} />
                  </div>
                  <p className="text-pf-brown/60 font-medium">Schedule a new post</p>
                </Link>
              )}
            </div>
          )}

          {/* All Drafts */}
          {drafts.length > 1 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-pf-brown">All Drafts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {drafts.slice(1).map(draft => (
                  <div key={draft.id} className="bg-white rounded-[2rem] border border-pf-brown/5 shadow-soft p-6 flex flex-col justify-between min-h-[180px]">
                    <p className="text-pf-brown/70 text-sm italic line-clamp-4">
                      {draft.caption || 'No caption yet...'}
                    </p>
                    <Link href={`/dashboard/new?edit=${draft.id}`} className="text-pf-green font-medium hover:underline text-sm mt-4 inline-block">
                      Continue Editing →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
