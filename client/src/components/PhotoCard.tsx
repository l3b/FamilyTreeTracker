interface PhotoCardProps {
  photo: any;
  compact?: boolean;
  onClick?: () => void;
}

export default function PhotoCard({ photo, compact = false, onClick }: PhotoCardProps) {
  if (compact) {
    return (
      <div
        className="relative group cursor-pointer"
        onClick={onClick}
      >
        <img
          src={photo.imageUrl}
          alt={photo.title || "صورة عائلية"}
          className="w-full h-24 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <i className="fas fa-eye text-white text-lg"></i>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <img
        src={photo.imageUrl}
        alt={photo.title || "صورة عائلية"}
        className="w-full h-48 object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <i className="fas fa-eye text-white text-2xl"></i>
      </div>
      
      {(photo.title || photo.description) && (
        <div className="p-3">
          {photo.title && (
            <h4 className="font-medium text-heritage-dark text-sm line-clamp-1">
              {photo.title}
            </h4>
          )}
          {photo.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {photo.description}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {new Date(photo.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
      )}
    </div>
  );
}
