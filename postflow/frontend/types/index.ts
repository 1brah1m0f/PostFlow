export type PostStatus = "scheduled" | "published" | "failed";

export interface Post {
  id: number;
  caption: string;
  image_path: string;
  scheduled_at: string;
  status: PostStatus;
  error_message: string | null;
  created_at: string;
  published_at: string | null;
}
