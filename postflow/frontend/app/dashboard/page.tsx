"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState<"all" | "scheduled" | "running" | "published" | "failed">("all");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getPosts();
      setPosts(data);
      setFetchError("");
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Poll every 5s only while posts are running. Clean up when no longer needed.
  useEffect(() => {
    const hasRunning = posts.some((p) => p.status === "running");

    if (hasRunning && !pollingRef.current) {
      pollingRef.current = setInterval(fetchPosts, 5000);
    } else if (!hasRunning && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [posts, fetchPosts]);

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const stats = {
    total: posts.length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    running: posts.filter((p) => p.status === "running").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  const statCards = [
    { label: "Total Posts", value: stats.total, icon: CalendarDays, accent: "bg-brand-dark text-white" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, accent: "bg-brand-peach text-brand-dark" },
    { label: "Published", value: stats.published, icon: CheckCircle2, accent: "bg-[#d4edda] text-[#3a6b3e]" },
    { label: "Failed", value: stats.failed, icon: XCircle, accent: "bg-brand-rust text-white" },
  ];

  const filterTabs = [
    { key: "all" as const, label: "All" },
    { key: "scheduled" as const, label: "Scheduled" },
    { key: "running" as const, label: "Publishing" },
    { key: "published" as const, label: "Published" },
    { key: "failed" as const, label: "Failed" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-brand-rust animate-spin" />
          </div>
          <p className="text-sm text-brand-gray font-medium">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in max-w-5xl">
      {fetchError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-100 text-brand-rust text-sm">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {fetchError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Dashboard</h1>
          <p className="text-sm text-brand-gray mt-0.5">Manage and track your social media schedule.</p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          New Post
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-brand-dark mt-2 tracking-tight">{stat.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${stat.accent} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                filter === tab.key
                  ? "bg-brand-dark text-white shadow-sm"
                  : "text-brand-gray hover:text-brand-dark"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className={`ml-1.5 text-xs ${filter === tab.key ? "text-white/70" : "text-brand-gray/70"}`}>
                  {stats[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <button onClick={fetchPosts} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-brand-cream flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-brand-rust" />
          </div>
          <h3 className="text-base font-semibold text-brand-dark mb-1">
            No posts {filter !== "all" ? filter : "yet"}
          </h3>
          <p className="text-sm text-brand-gray mb-6">
            {filter === "all" ? "Create your first scheduled post to get started." : `No ${filter} posts.`}
          </p>
          {filter === "all" && (
            <Link href="/dashboard/new" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              Create Post
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
