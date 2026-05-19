"use client";

import { Post } from "@/types";
import { deletePost, getImageUrl } from "@/lib/api";
import { format } from "date-fns";
import {
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const statusConfig: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ElementType; label: string }
> = {
  scheduled: {
    color: "text-brand-dark",
    bg: "bg-brand-peach",
    border: "border-brand-peach",
    icon: Clock,
    label: "Scheduled",
  },
  published: {
    color: "text-brand-dark",
    bg: "bg-brand-cream",
    border: "border-brand-cream",
    icon: CheckCircle2,
    label: "Published",
  },
  failed: {
    color: "text-white",
    bg: "bg-brand-rust",
    border: "border-brand-rust",
    icon: XCircle,
    label: "Failed",
  },
};

interface PostCardProps {
  post: Post;
  onDelete: () => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showError, setShowError] = useState(false);
  const config = statusConfig[post.status] || statusConfig.scheduled;
  const StatusIcon = config.icon;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
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

  const truncatedCaption =
    post.caption.length > 100
      ? post.caption.substring(0, 100) + "..."
      : post.caption;

  return (
    <div
      className="glass-card-hover group overflow-hidden animate-slide-up flex flex-col"
      id={`post-card-${post.id}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-brand-cream/30 overflow-hidden">
        <Image
          src={getImageUrl(post.image_path)}
          alt={post.caption}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />

        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <div
            className={`status-badge ${config.bg} ${config.color} ${config.border} border backdrop-blur-sm shadow-sm`}
          >
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </div>
        </div>

        {/* Delete button overlay */}
        {post.status === "scheduled" && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              id={`delete-post-${post.id}`}
              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm border border-red-200
                         text-red-500 hover:bg-red-50 hover:text-red-600
                         transition-all duration-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Caption */}
        <p className="text-sm text-brand-dark leading-relaxed font-medium line-clamp-2 flex-1">
          {truncatedCaption}
        </p>

        {/* Schedule info */}
        <div className="flex items-center gap-4 text-xs text-brand-gray mt-auto pt-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(post.scheduled_at), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(post.scheduled_at), "HH:mm")}</span>
          </div>
        </div>

        {/* Error message */}
        {post.status === "failed" && post.error_message && (
          <button
            onClick={() => setShowError(!showError)}
            className="flex items-center gap-1.5 text-xs text-brand-rust hover:text-[#a94a3b] transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{showError ? "Hide error" : "View error"}</span>
          </button>
        )}
        {showError && post.error_message && (
          <p className="text-xs text-brand-rust bg-red-50 p-2 rounded-lg border border-red-100">
            {post.error_message}
          </p>
        )}

        {/* Published at */}
        {post.status === "published" && post.published_at && (
          <p className="text-xs text-[#5C715E] font-medium">
            Published {format(new Date(post.published_at), "MMM d, yyyy · HH:mm")}
          </p>
        )}
      </div>
    </div>
  );
}
