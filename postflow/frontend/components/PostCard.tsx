"use client";

import { memo, useEffect, useState } from "react";
import { Post } from "@/types";
import { deletePost, getSignedMediaUrl } from "@/lib/api";
import { format } from "date-fns";
import {
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Instagram,
  Loader2,
} from "lucide-react";
import Image from "next/image";

const TikTokIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.84 4.84 0 0 1-1.01-.06z" />
  </svg>
);

const statusConfig: Record<
  string,
  { color: string; bg: string; icon: React.ElementType; label: string; spin?: boolean }
> = {
  scheduled: { color: "text-brand-dark", bg: "bg-brand-peach", icon: Clock, label: "Scheduled" },
  running: { color: "text-brand-dark", bg: "bg-yellow-100", icon: Loader2, label: "Publishing...", spin: true },
  published: { color: "text-[#3a6b3e]", bg: "bg-[#d4edda]", icon: CheckCircle2, label: "Published" },
  failed: { color: "text-white", bg: "bg-brand-rust", icon: XCircle, label: "Failed" },
};

interface PostCardProps {
  post: Post;
  onDelete: () => void;
}

export const PostCard = memo(function PostCard({ post, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string>("");

  useEffect(() => {
    if (!post.media_path) return;
    getSignedMediaUrl(post.media_path)
      .then(setMediaUrl)
      .catch(() => setMediaUrl(""));
  }, [post.media_path]);

  const config = statusConfig[post.status] || statusConfig.scheduled;
  const StatusIcon = config.icon;
  const isVideo = post.media_path?.match(/\.(mp4|mov|webm)$/i);

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDelete();
    } catch {
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
      id={`post-card-${post.id}`}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <Image
              src={mediaUrl}
              alt={post.caption}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-brand-gray animate-spin" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
            <StatusIcon className={`w-3 h-3 ${config.spin ? "animate-spin" : ""}`} />
            {config.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-brand-dark shadow-sm">
            {post.platform === "tiktok" ? <TikTokIcon /> : <Instagram className="w-3 h-3" />}
            {post.platform === "tiktok" ? "TikTok" : "Instagram"}
          </span>
        </div>

        {post.status === "scheduled" && (
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg bg-white/90 border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <p className="text-sm text-brand-dark leading-relaxed line-clamp-2 flex-1">{post.caption}</p>

        <div className="flex items-center gap-3 text-xs text-brand-gray pt-1 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(post.scheduled_at), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(post.scheduled_at), "HH:mm")}
          </span>
        </div>

        {post.status === "failed" && (post.failed_reason || post.error_message) && (
          <button
            onClick={() => setShowError(!showError)}
            className="flex items-center gap-1.5 text-xs text-brand-rust hover:text-[#a94a3b] transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            {showError ? "Hide error" : "View error"}
          </button>
        )}
        {showError && (post.failed_reason || post.error_message) && (
          <p className="text-xs text-brand-rust bg-red-50 p-2 rounded-lg border border-red-100">
            {post.failed_reason || post.error_message}
          </p>
        )}

        {post.status === "published" && post.published_at && (
          <p className="text-xs text-[#5C715E] font-medium">
            Published {format(new Date(post.published_at), "MMM d · HH:mm")}
          </p>
        )}
      </div>
    </div>
  );
});
