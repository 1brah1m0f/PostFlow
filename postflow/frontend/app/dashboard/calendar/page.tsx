'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MoreHorizontal, Heart, MessageCircle, RefreshCw, Search, Instagram, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  account_id: string | null;
  caption: string;
  image_url: string | null;
  scheduled_at: string;
  published_at: string | null;
  status: string;
  error_message: string | null;
}

const BAKU_TZ = 'Asia/Baku';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: BAKU_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: BAKU_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: BAKU_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow);
  const time = new Intl.DateTimeFormat('en', { timeZone: BAKU_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  if (dStr === todayStr) return `Today, ${time}`;
  if (dStr === tomorrowStr) return `Tomorrow, ${time}`;
  return new Intl.DateTimeFormat('en', { timeZone: BAKU_TZ, month: 'short', day: 'numeric', year: 'numeric' }).format(d) + ` • ${time}`;
}

type Filter = 'all' | 'scheduled' | 'published' | 'failed';

const STATUS_STYLES: Record<string, { pill: string; border: string; label: string }> = {
  scheduled: { pill: 'bg-[#5C4A1E]/10 text-[#5C4A1E]', border: '', label: 'Scheduled' },
  published: { pill: 'bg-green-100 text-green-700', border: '', label: 'Published' },
  failed:    { pill: 'bg-red-100 text-red-600',   border: 'border-l-4 border-l-red-400', label: 'Failed' },
  draft:     { pill: 'bg-pf-tan/30 text-pf-brown/60', border: 'border border-dashed', label: 'Draft' },
};

export default function AllPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const auth = { Authorization: `Bearer ${token}` };

  async function loadPosts() {
    if (!token) { router.push('/login'); return; }
    const res = await fetch('http://localhost:8000/posts', { headers: auth });
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, []);

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return;
    await fetch(`http://localhost:8000/posts/${id}`, { method: 'DELETE', headers: auth });
    setMenuOpen(null);
    loadPosts();
  }

  async function retryPost(id: string) {
    setRetrying(id);
    await fetch(`http://localhost:8000/posts/${id}`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'scheduled' }),
    });
    setRetrying(null);
    loadPosts();
  }

  const visible = posts
    .filter(p => filter === 'all' ? p.status !== 'draft' : p.status === filter)
    .filter(p => search === '' || p.caption.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All Posts' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'published', label: 'Published' },
    { key: 'failed', label: 'Failed' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-pf-brown/60">Loading...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-pf-brown">All Posts</h1>
          <p className="text-pf-brown/60 mt-1">Manage and track your content pipeline.</p>
        </div>
        {/* Search */}
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pf-brown/40" />
          <input
            type="text"
            placeholder="Search captions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-pf-brown/10 rounded-xl text-sm text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filter === f.key
                ? 'bg-pf-brown text-white'
                : 'bg-white text-pf-brown/60 border border-pf-brown/10 hover:bg-pf-brown/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-pf-tan/50 p-16 flex flex-col items-center gap-4 text-center">
          <p className="text-pf-brown/60 font-medium">No posts found.</p>
          <Link href="/dashboard/new" className="px-6 py-3 bg-pf-green text-white font-medium rounded-full hover:bg-pf-green/90 transition-colors text-sm">
            Create a post
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {visible.map(post => {
            const s = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
            return (
              <div
                key={post.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm break-inside-avoid ${s.border}`}
              >
                {/* Image */}
                {post.image_url && post.status !== 'failed' && (
                  <div className="w-full aspect-[4/3] overflow-hidden">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Top row: platform + status + menu */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.pill}`}>
                        {post.status === 'failed' && <AlertCircle size={10} />}
                        {s.label}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pf-tan/20 text-pf-brown/70 rounded-full text-xs font-semibold">
                        <Instagram size={10} /> Instagram
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        className="p-1 text-pf-brown/40 hover:text-pf-brown rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === post.id && (
                        <div className="absolute right-0 top-7 bg-white border border-pf-brown/10 rounded-xl shadow-lg py-1 z-10 w-36">
                          <Link
                            href={`/dashboard/new?edit=${post.id}`}
                            className="block px-4 py-2 text-sm text-pf-brown hover:bg-pf-tan/20 transition-colors"
                            onClick={() => setMenuOpen(null)}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deletePost(post.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Failed: thumbnail + caption side by side */}
                  {post.status === 'failed' && post.image_url ? (
                    <div className="flex gap-3">
                      <img src={post.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      <p className="text-pf-brown text-sm line-clamp-3">{post.caption}</p>
                    </div>
                  ) : (
                    /* Caption */
                    post.status === 'published' ? (
                      <p className="text-pf-brown text-sm italic leading-relaxed line-clamp-4">
                        "{post.caption}"
                      </p>
                    ) : (
                      <p className="text-pf-brown text-sm leading-relaxed line-clamp-3">{post.caption}</p>
                    )
                  )}

                  {/* Published: likes/comments (placeholder) */}
                  {post.status === 'published' && (
                    <div className="flex items-center gap-4 text-pf-brown/50 text-sm">
                      <span className="flex items-center gap-1"><Heart size={14} /> —</span>
                      <span className="flex items-center gap-1"><MessageCircle size={14} /> —</span>
                    </div>
                  )}

                  {/* Error message */}
                  {post.status === 'failed' && post.error_message && (
                    <div className="flex items-start gap-1.5 px-3 py-2 bg-red-50 rounded-lg">
                      <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-500 line-clamp-2">{post.error_message}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-pf-brown/5">
                    <div className="flex items-center gap-1.5 text-xs text-pf-brown/50">
                      <Calendar size={12} />
                      <span>{formatDate(post.scheduled_at)}</span>
                    </div>
                    {post.status === 'failed' && (
                      <button
                        onClick={() => retryPost(post.id)}
                        disabled={retrying === post.id}
                        className="flex items-center gap-1 text-xs font-semibold text-pf-green hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={retrying === post.id ? 'animate-spin' : ''} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
