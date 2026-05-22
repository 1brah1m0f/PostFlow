'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CloudUpload, Smile, Hash, Wand2, Calendar, Clock,
  Check, MoreHorizontal, Heart, MessageCircle, Send, Bookmark, UserCircle2, X,
} from 'lucide-react';

interface Account {
  id: string;
  username: string;
  is_active: boolean;
}

const BAKU_TZ = 'Asia/Baku';

function pad(n: number) { return String(n).padStart(2, '0'); }

// Convert UTC ISO to Baku local date string for <input type="date">
function isoToDateInput(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BAKU_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Convert UTC ISO to Baku local time string for <input type="time">
function isoToTimeInput(iso: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: BAKU_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  return `${pad(Number(get('hour')))}:${get('minute')}`;
}

// Treat user input as Baku time → UTC ISO
function bakuInputToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00+04:00`).toISOString();
}

// Today's date in Baku timezone for the min attribute
function todayBaku(): string {
  return isoToDateInput(new Date().toISOString());
}

function ComposePostInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { router.push('/login'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (editId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${editId}`, { headers: authHeader })
        .then(r => r.json())
        .then(post => {
          setCaption(post.caption || '');
          setSelectedIds([post.account_id]);
          if (post.image_url) {
            setMediaPreview(post.image_url);
            setUploadedUrl(post.image_url);
          }
          if (post.scheduled_at) {
            setDate(isoToDateInput(post.scheduled_at));
            setTime(isoToTimeInput(post.scheduled_at));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingEdit(false));
    }
  }, []);

  function toggleAccount(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    if (!allowed.includes(file.type)) { setError('Unsupported file type. Use JPG, PNG or MP4.'); return; }
    setMediaPreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/upload`, {
        method: 'POST', headers: authHeader, body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUploadedUrl(data.url);
    } catch {
      setError('Media upload failed. Please try again.');
      setMediaPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function generateCaption() {
    setAiGenerating(true);
    setAiError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/caption`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic || null, image_url: uploadedUrl || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Generation failed');
      }
      const data = await res.json();
      setCaption(data.caption);
      setAiModalOpen(false);
      setAiTopic('');
    } catch (e: any) {
      setAiError(e.message || 'Something went wrong. Try again.');
    } finally {
      setAiGenerating(false);
    }
  }

  function removeMedia() {
    setMediaPreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function submitPost(status: 'draft' | 'scheduled') {
    setError('');
    if (selectedIds.length === 0) { setError('Please select at least one account.'); return; }
    if (!caption.trim()) { setError('Please write a caption.'); return; }
    if (!date || !time) { setError('Please set a publishing date and time.'); return; }

    const scheduled_at = bakuInputToISO(date, time);
    if (status === 'draft') setSaving(true); else setScheduling(true);

    try {
      if (editId) {
        // Update existing post
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${editId}`, {
          method: 'PUT',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption, image_url: uploadedUrl ?? null, scheduled_at, status }),
        });
        if (!res.ok) throw new Error();
      } else {
        // Create new post(s)
        const results = await Promise.all(
          selectedIds.map(account_id =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
              method: 'POST',
              headers: { ...authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify({ account_id, caption, image_url: uploadedUrl ?? null, scheduled_at, status }),
            })
          )
        );
        if (results.some(r => !r.ok)) throw new Error();
      }
      router.push('/dashboard');
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setScheduling(false);
    }
  }

  const selectedAccount = accounts.find(a => a.id === selectedIds[0]);

  if (loadingEdit) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-pf-brown/60">Loading post...</p>
    </div>
  );

  return (
    <>
    {aiModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pf-brown font-bold text-lg">
              <Wand2 size={20} className="text-pf-green" />
              Generate Caption with AI
            </div>
            <button onClick={() => { setAiModalOpen(false); setAiError(''); }} className="text-pf-brown/40 hover:text-pf-brown">
              <X size={20} />
            </button>
          </div>

          <p className="text-pf-brown/60 text-sm">
            Describe your post or leave blank — AI will use your uploaded image as context.
          </p>

          <textarea
            className="w-full bg-pf-tan/10 border border-pf-brown/10 rounded-xl px-4 py-3 text-pf-brown placeholder-pf-brown/40 outline-none focus:border-pf-green resize-none min-h-[90px] text-sm"
            placeholder="e.g. Sunset at the beach, feeling relaxed..."
            value={aiTopic}
            onChange={e => setAiTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generateCaption(); }}
          />

          {aiError && <p className="text-sm text-red-500">{aiError}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => { setAiModalOpen(false); setAiError(''); }}
              className="flex-1 py-3 bg-pf-tan/30 text-pf-brown font-semibold rounded-xl hover:bg-pf-tan/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateCaption}
              disabled={aiGenerating}
              className="flex-1 py-3 bg-pf-green text-white font-semibold rounded-xl hover:bg-pf-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {aiGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Generating...
                </>
              ) : (
                <><Wand2 size={14} /> Generate</>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

      {/* Left Column */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-pf-brown tracking-tight">
              {editId ? 'Edit Post' : 'Compose Post'}
            </h1>
            <p className="text-pf-brown/60 text-lg">
              {editId ? 'Update your draft or schedule it.' : 'Craft and schedule your next update.'}
            </p>
          </div>
          <button
            onClick={() => submitPost('draft')}
            disabled={saving}
            className="px-6 py-2 bg-white border border-pf-brown/10 text-pf-brown font-medium rounded-full hover:bg-pf-brown/5 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>

        {/* Select Accounts */}
        <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5 space-y-4">
          <div className="flex items-center gap-2 text-pf-brown font-semibold">
            <UserCircle2 size={18} />
            <span>Select Accounts</span>
          </div>
          {accounts.length === 0 ? (
            <p className="text-sm text-pf-brown/50">
              No accounts added yet.{' '}
              <a href="/dashboard/settings" className="text-pf-green underline">Go to Settings</a> to add one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {accounts.map(account => {
                const selected = selectedIds.includes(account.id);
                return (
                  <button
                    key={account.id}
                    onClick={() => toggleAccount(account.id)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 font-medium rounded-full transition-colors ${
                      selected
                        ? 'bg-pf-green/10 border-pf-green text-pf-brown'
                        : 'bg-pf-tan/20 border-transparent text-pf-brown hover:bg-pf-tan/30'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-pf-brown/20 flex items-center justify-center text-xs font-bold text-pf-brown">
                      {account.username[0].toUpperCase()}
                    </div>
                    @{account.username}
                    {selected && (
                      <div className="w-4 h-4 rounded-full bg-pf-green text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5 space-y-4">
          <div className="flex items-center gap-2 text-pf-brown font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Media</span>
          </div>
          {mediaPreview ? (
            <div className="relative rounded-[1.5rem] overflow-hidden">
              <img src={mediaPreview} alt="Preview" className="w-full object-cover max-h-64 rounded-[1.5rem]" />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[1.5rem]">
                  <span className="text-white font-medium">Uploading...</span>
                </div>
              )}
              <button onClick={removeMedia} className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100">
                <X size={16} className="text-pf-brown" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              className={`bg-pf-tan/10 border-2 border-dashed rounded-[1.5rem] p-10 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-colors ${
                dragging ? 'border-pf-green bg-pf-green/5' : 'border-pf-tan hover:bg-pf-tan/20'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-pf-green/20 text-pf-green flex items-center justify-center">
                <CloudUpload size={24} />
              </div>
              <div>
                <p className="font-bold text-pf-brown">Click to upload or drag and drop</p>
                <p className="text-pf-brown/60 text-sm">JPG, PNG or MP4 (max. 50MB)</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,video/mp4"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Caption */}
        <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5 space-y-4">
          <div className="flex items-center gap-2 text-pf-brown font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="12" y2="18"></line></svg>
            <span>Caption</span>
          </div>
          <div className="bg-pf-tan/10 border border-pf-brown/10 rounded-[1.5rem] p-4 flex flex-col">
            <textarea
              className="bg-transparent border-none outline-none resize-none text-pf-brown placeholder-pf-brown/40 min-h-[120px]"
              placeholder="Write something compelling..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={2200}
            />
            <div className="flex justify-end gap-2 text-pf-brown/40">
              <button className="hover:text-pf-brown transition-colors"><Smile size={18} /></button>
              <button className="hover:text-pf-brown transition-colors"><Hash size={18} /></button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-pf-brown/40">{caption.length} / 2200 characters</span>
            <button
              onClick={() => setAiModalOpen(true)}
              className="flex items-center gap-1.5 text-pf-green font-medium hover:underline"
            >
              <Wand2 size={14} /> Generate with AI
            </button>
          </div>
        </div>

        {/* Publishing Date */}
        <div className="bg-white border-2 border-pf-green rounded-[2rem] p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2 text-pf-brown font-semibold">
            <Clock size={18} />
            <span>Publishing Date</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={todayBaku()}
                className="w-full bg-pf-tan/20 border border-pf-tan/30 rounded-xl px-4 py-3 text-pf-brown outline-none focus:border-pf-green transition-colors"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-pf-brown/60 uppercase tracking-wider">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-pf-tan/20 border border-pf-tan/30 rounded-xl px-4 py-3 text-pf-brown outline-none focus:border-pf-green transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3.5 bg-pf-tan/30 text-pf-brown font-bold rounded-xl hover:bg-pf-tan/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submitPost('scheduled')}
              disabled={scheduling || uploading}
              className="flex-1 py-3.5 bg-pf-green text-white font-bold rounded-xl hover:bg-pf-green/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {scheduling ? 'Scheduling...' : editId ? 'Update & Schedule' : 'Schedule Post'}
              {!scheduling && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:w-[400px] w-full">
        <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-pf-brown/5 sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-pf-brown">Preview</h3>
            <div className="flex bg-pf-tan/20 rounded-lg p-1 text-xs font-bold text-pf-brown/60">
              <button className="px-3 py-1 bg-white text-pf-brown rounded-md shadow-sm flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                IG
              </button>
            </div>
          </div>

          <div className="border border-pf-brown/10 rounded-2xl overflow-hidden bg-white">
            <div className="flex items-center justify-between p-3 border-b border-pf-brown/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pf-brown/20 flex items-center justify-center text-sm font-bold text-pf-brown">
                  {selectedAccount ? selectedAccount.username[0].toUpperCase() : '?'}
                </div>
                <span className="font-semibold text-sm text-pf-brown">
                  {selectedAccount ? `@${selectedAccount.username}` : 'Select an account'}
                </span>
              </div>
              <MoreHorizontal size={20} className="text-pf-brown/60" />
            </div>

            <div className="aspect-square bg-pf-tan/20 flex items-center justify-center text-pf-brown/20 overflow-hidden">
              {mediaPreview ? (
                <img src={mediaPreview} alt="Post media" className="w-full h-full object-cover" />
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              )}
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-pf-brown">
                  <Heart size={24} />
                  <MessageCircle size={24} />
                  <Send size={24} />
                </div>
                <Bookmark size={24} className="text-pf-brown" />
              </div>
              <div className="text-sm text-pf-brown">
                {selectedAccount && <span className="font-semibold mr-2">@{selectedAccount.username}</span>}
                {caption ? (
                  <span>{caption}</span>
                ) : (
                  <span className="text-pf-brown/60">Your caption will appear here once you start typing.</span>
                )}
              </div>
              {date && time && (
                <div className="text-[10px] text-pf-brown/40 uppercase mt-2 font-medium">
                  Scheduled: {new Date(`${date}T${time}`).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  );
}

export default function ComposePost() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-pf-brown/60">Loading...</p></div>}>
      <ComposePostInner />
    </Suspense>
  );
}
