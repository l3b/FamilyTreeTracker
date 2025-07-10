import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewsCardProps {
  news: any;
  compact?: boolean;
}

export default function NewsCard({ news, compact = false }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "منذ يوم واحد";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.ceil(diffDays / 7)} أسابيع`;
    return date.toLocaleDateString('ar-SA');
  };

  const [likes, setLikes] = useState<number>(news.likesCount || 0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    fetch(`/api/family-news/${news.id}/comments`, { credentials: "include" })
      .then((res) => res.json())
      .then(setComments)
      .catch(() => {});
  }, [news.id]);

  const handleLike = async () => {
    const res = await fetch(`/api/family-news/${news.id}/like`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/family-news/${news.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments([data, ...comments]);
      setCommentText("");
      setShowComments(true);
    }
  };

  if (compact) {
    return (
      <div className="border-r-4 border-heritage-gold pr-4">
        <div className="flex items-start space-x-3 space-x-reverse">
          {news.imageUrl && (
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-heritage-dark text-sm">{news.title}</h4>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{news.content}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>{formatDate(news.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {news.imageUrl && (
        <img
          src={news.imageUrl}
          alt={news.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-heritage-brown mb-2">{news.title}</h3>
        <p className="text-gray-600 mb-4">{news.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatDate(news.createdAt)}</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <i className="fas fa-user"></i>
            <span>أضافه مدير العائلة</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse mt-4">
          <Button variant="ghost" size="sm" onClick={handleLike}>
            <i className="fas fa-heart ml-2"></i>
            {likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <i className="fas fa-comment ml-2"></i>
            {comments.length}
          </Button>
        </div>
        {showComments && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب تعليقك"
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddComment}>
                إرسال
              </Button>
            </div>
            {comments.map((c) => (
              <div key={c.id} className="border rounded p-2 text-sm">
                {c.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
