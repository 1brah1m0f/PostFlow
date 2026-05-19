export type PostStatus = "scheduled" | "published" | "failed";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface InstagramAccount {
  id: string;
  user_id: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  account_id: string;
  caption: string;
  image_url: string | null;
  scheduled_at: string;
  status: PostStatus;
  error_message: string | null;
  created_at: string;
  published_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface CreatePostPayload {
  account_id: string;
  caption: string;
  image_url?: string;
  scheduled_at: string;
}

export interface CreateAccountPayload {
  username: string;
  password: string;
}
