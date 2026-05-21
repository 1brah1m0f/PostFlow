import { supabase } from "./supabase";
import { Account, Post } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Not authenticated");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> || {}) },
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `Request failed (${res.status})` }));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Accounts ---

export async function getAccounts(): Promise<Account[]> {
  return request<Account[]>("/accounts");
}

export async function createAccount(
  platform: string,
  username: string,
  password: string
): Promise<Account> {
  return request<Account>("/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, username, password }),
  });
}

export async function updateAccount(
  id: string,
  data: { username?: string; password?: string }
): Promise<Account> {
  return request<Account>(`/accounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  return request<void>(`/accounts/${id}`, { method: "DELETE" });
}

// --- Posts ---

export async function getPosts(): Promise<Post[]> {
  return request<Post[]>("/posts");
}

export async function createPost(formData: FormData): Promise<Post> {
  // Do NOT set Content-Type — browser sets multipart boundary automatically
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (res.status === 401) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create post" }));
    throw new Error(err.detail || "Failed to create post");
  }
  return res.json();
}

export async function deletePost(id: string): Promise<void> {
  return request<void>(`/posts/${id}`, { method: "DELETE" });
}

// --- Profile ---

export async function getProfile(accountId: string): Promise<{
  full_name: string;
  username: string;
  profile_pic_url: string;
  follower_count: number;
  following_count: number;
  post_count: number;
}> {
  return request("/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId }),
  });
}

// --- Media signed URL (Supabase Storage) ---

export async function getSignedMediaUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("post-media")
    .createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error("Failed to get media URL");
  return data.signedUrl;
}
