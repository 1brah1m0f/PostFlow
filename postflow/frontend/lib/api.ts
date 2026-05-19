const BASE = "http://localhost:8000";

export async function getPosts() {
  const res = await fetch(`${BASE}/posts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function createPost(formData: FormData) {
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create post" }));
    throw new Error(err.detail || "Failed to create post");
  }
  return res.json();
}

export async function deletePost(id: number) {
  const res = await fetch(`${BASE}/posts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to delete post" }));
    throw new Error(err.detail || "Failed to delete post");
  }
  return res.json();
}

export function getImageUrl(imagePath: string) {
  return `${BASE}/${imagePath}`;
}
