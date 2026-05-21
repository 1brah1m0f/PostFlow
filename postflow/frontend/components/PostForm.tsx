"use client";

import { createPost, getAccounts } from "@/lib/api";
import { Account, Platform } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  ImageIcon,
  X,
  Calendar,
  Clock,
  Type,
  Instagram,
  Loader2,
  Video,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
  </svg>
);

export function PostForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [platform, setPlatform] = useState<Platform>("instagram");

  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    getAccounts()
      .then((all) => {
        setAccounts(all);
        // Auto-select first account for current platform if available
        const first = all.find((a) => a.platform === platform);
        if (first) setAccountId(String(first.id));
      })
      .catch(console.error)
      .finally(() => setAccountsLoading(false));
  }, []);

  // Reset account selection when platform changes
  useEffect(() => {
    const first = accounts.find((a) => a.platform === platform);
    setAccountId(first ? String(first.id) : null);
  }, [platform, accounts]);

  const platformAccounts = accounts.filter((a) => a.platform === platform);

  const acceptedTypes =
    platform === "tiktok"
      ? "video/mp4,video/quicktime,video/webm"
      : "image/jpeg,image/png,image/jpg,image/webp";

  const handleMediaSelect = useCallback(
    (file: File) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (platform === "tiktok" && !isVideo) {
        setError("TikTok requires a video file (MP4, MOV, WEBM)");
        return;
      }
      if (platform === "instagram" && !isImage) {
        setError("Instagram requires an image file (JPG, PNG, WEBP)");
        return;
      }
      setMedia(file);
      setError("");
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [platform]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleMediaSelect(file);
    },
    [handleMediaSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleMediaSelect(file);
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    removeMedia();
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!caption.trim()) return setError("Caption is required");
    if (!media) return setError("Media file is required");
    if (!scheduleDate) return setError("Schedule date is required");
    if (!scheduleTime) return setError("Schedule time is required");
    if (!accountId) return setError(`No ${platform} account selected. Add one in Settings.`);

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("account_id", String(accountId));
      formData.append("caption", caption);
      formData.append("media", media);
      formData.append("scheduled_at", `${scheduleDate}T${scheduleTime}:00`);

      await createPost(formData);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVideo = media?.type.startsWith("video/");

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-brand-dark">Create New Post</h1>
        <p className="text-sm text-brand-gray mt-0.5">Schedule your next social media post.</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-brand-rust text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Post Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-brand-dark">Post Details</h2>

          <div>
            <label htmlFor="caption-input" className="flex items-center gap-1.5 text-xs font-medium text-brand-gray mb-1.5">
              <Type className="w-3.5 h-3.5" />
              Caption *
            </label>
            <textarea
              id="caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your post caption here..."
              rows={4}
              maxLength={2200}
              className="input-base resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${caption.length > 2000 ? "text-brand-rust" : "text-brand-gray/60"}`}>
                {caption.length}/2200
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-brand-gray mb-1.5">
              {platform === "tiktok" ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
              {platform === "tiktok" ? "Video" : "Image"} *
            </label>

            {mediaPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-100 group">
                {isVideo ? (
                  <video src={mediaPreview} className="w-full max-h-64 object-cover" controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-brand-dark hover:text-brand-rust shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-brand-peach bg-brand-peach/10"
                    : "border-gray-200 hover:border-brand-peach hover:bg-gray-50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-brand-gray" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-brand-dark">Click to select or drag & drop</p>
                  <p className="text-xs text-brand-gray mt-0.5">
                    {platform === "tiktok" ? "MP4, MOV, WEBM · max 50 MB" : "JPG, PNG, WEBP · max 50 MB"}
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-brand-dark flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-rust" />
            Schedule
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="schedule-date" className="block text-xs font-medium text-brand-gray mb-1.5">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <input
                  type="date"
                  id="schedule-date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="schedule-time" className="block text-xs font-medium text-brand-gray mb-1.5">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <input
                  type="time"
                  id="schedule-time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform & Account */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-brand-dark">Platform & Account</h2>

          <div className="grid grid-cols-2 gap-2">
            {(["instagram", "tiktok"] as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePlatformChange(p)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                  platform === p
                    ? "border-brand-rust bg-brand-rust/5 text-brand-rust"
                    : "border-gray-100 text-brand-gray hover:border-brand-peach hover:text-brand-dark"
                }`}
              >
                {p === "instagram" ? <Instagram className="w-4 h-4" /> : <TikTokIcon />}
                {p === "instagram" ? "Instagram" : "TikTok"}
              </button>
            ))}
          </div>

          {accountsLoading ? (
            <div className="flex items-center gap-2 text-sm text-brand-gray">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts...
            </div>
          ) : platformAccounts.length === 0 ? (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-brand-cream/30 border border-brand-cream">
              <AlertTriangle className="w-4 h-4 text-brand-rust flex-shrink-0 mt-0.5" />
              <p className="text-sm text-brand-dark">
                No {platform} accounts saved.{" "}
                <Link href="/dashboard/settings" className="text-brand-rust font-semibold hover:underline">
                  Add one in Settings
                </Link>
                .
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-brand-gray mb-1.5">Account</label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
                <select
                  value={accountId ?? ""}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="input-base pr-10 appearance-none cursor-pointer"
                >
                  {platformAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      @{a.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || platformAccounts.length === 0}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Schedule Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
