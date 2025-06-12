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
      </div>
    </div>
  );
}
