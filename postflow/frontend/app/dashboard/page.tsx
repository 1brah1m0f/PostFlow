"use client";

import { useEffect, useState, useCallback } from "react";
import { getPosts } from "@/lib/api";
import { Post } from "@/types";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";
import {
  PlusCircle,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scheduled" | "published" | "failed">("all");

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch {
      console.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const stats = {
    total: posts.length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  const statCards = [
    {
      label: "Total Posts",
      value: stats.total,
      icon: CalendarDays,
      bg: "bg-brand-dark",
      text: "text-white",
    },
    {
      label: "Scheduled",
      value: stats.scheduled,
      icon: Clock,
      bg: "bg-brand-peach",
      text: "text-brand-dark",
    },
    {
      label: "Published",
      value: stats.published,
      icon: CheckCircle2,
      bg: "bg-brand-cream",
      text: "text-brand-dark",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: XCircle,
      bg: "bg-brand-rust",
      text: "text-white",
    },
  ];

  const filterTabs = [
    { key: "all" as const, label: "All" },
    { key: "scheduled" as const, label: "Scheduled" },
    { key: "published" as const, label: "Published" },
    { key: "failed" as const, label: "Failed" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <div className="w-12 h-12 rounded-2xl bg-brand-peach flex items-center justify-center shadow-lg shadow-brand-peach/30">
            <RefreshCw className="w-6 h-6 text-brand-rust animate-spin" />
          </div>
          <p className="text-sm text-brand-gray font-medium">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Dashboard</h1>
        <p className="text-brand-gray mt-1">Manage and track your social media schedule.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {statCards.map((stat) => (
          <div key={stat.label} className="glass-card p-5 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-brand-dark mt-2 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.text}
                  flex items-center justify-center shadow-sm
                  group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center bg-white rounded-xl border border-brand-cream p-1 shadow-sm overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              id={`filter-${tab.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                filter === tab.key
                  ? "bg-brand-rust text-white shadow-md shadow-brand-rust/20"
                  : "text-brand-gray hover:text-brand-dark hover:bg-brand-cream/50"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span
                  className={`ml-1.5 text-xs ${
                    filter === tab.key ? "text-white/80" : "text-brand-gray"
                  }`}
                >
                  {stats[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchPosts}
            className="btn-secondary w-full sm:w-auto"
            id="refresh-posts"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link href="/dashboard/new" className="btn-primary w-full sm:w-auto sm:hidden" id="new-post-btn-mobile">
            <PlusCircle className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-cream flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-brand-rust" />
          </div>
          <h3 className="text-lg font-semibold text-brand-dark mb-1">
            No posts {filter !== "all" ? filter : "yet"}
          </h3>
          <p className="text-sm text-brand-gray mb-6">
            {filter === "all"
              ? "Create your first scheduled post to get started."
              : `You don't have any ${filter} posts.`}
          </p>
          {filter === "all" && (
            <Link href="/dashboard/new" className="btn-primary" id="empty-new-post">
              <PlusCircle className="w-4 h-4" />
              Create Post
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
