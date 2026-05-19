// TODO: implement post card component
import { Post } from "@/types";
import { Badge } from "./ui/Badge";

export function PostCard({ post }: { post: Post }) {
  return (
    <div className="border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-700 line-clamp-2">{post.caption}</p>
        <Badge status={post.status} />
      </div>
      <p className="text-xs text-gray-400">{new Date(post.scheduled_at).toLocaleString()}</p>
    </div>
  );
}
