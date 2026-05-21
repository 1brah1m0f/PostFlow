export type PostStatus = "scheduled" | "published" | "failed" | "running";
export type Platform = "instagram" | "tiktok";

export interface Post {
  id: string;         // UUID
  user_id: string;    // UUID
  account_id: string; // UUID
  platform: Platform;
  caption: string;
  media_path: string | null;
  scheduled_at: string;
  status: PostStatus;
  error_message: string | null;
  failed_reason: string | null;
  created_at: string;
  published_at: string | null;
  retry_count: number;
}

export interface User {
  id: string;   // Supabase UUID
  email: string;
}

export interface Account {
  id: string;   // UUID
  platform: Platform;
  username: string;
  created_at: string;
  updated_at: string;
}
