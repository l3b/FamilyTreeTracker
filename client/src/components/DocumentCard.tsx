interface DocumentCardProps {
  document: any;
  compact?: boolean;
}

export default function DocumentCard({ document, compact = false }: DocumentCardProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'fas fa-file-word text-blue-500';
    if (mimeType?.includes('image')) return 'fas fa-file-image text-green-500';
    return 'fas fa-file text-gray-500';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.click();
  };

  if (compact) {
    return (
      <div
        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleDownload}
      >
        <div className="text-center">
          <i className={`${getFileIcon(document.mimeType)} text-2xl mb-2`}></i>
          <h4 className="text-sm font-medium text-heritage-dark line-clamp-2">{document.title}</h4>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(document.createdAt).getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <div className="flex-shrink-0">
            <i className={`${getFileIcon(document.mimeType)} text-3xl`}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-heritage-dark">{document.title}</h3>
            {document.description && (
              <p className="text-sm text-gray-600 mt-1">{document.description}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <i className="fas fa-file"></i>
            <span>{document.fileName}</span>
          </div>
          {document.fileSize && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-weight"></i>
              <span>{formatFileSize(document.fileSize)}</span>
            </div>
          )}
          {document.category && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-tag"></i>
              <span>{document.category}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 space-x-reverse">
            <i className="fas fa-calendar"></i>
            <span>{new Date(document.createdAt).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-heritage-brown text-white py-2 rounded-lg hover:bg-heritage-green transition-colors"
        >
          <i className="fas fa-download ml-2"></i>
          تحميل
        </button>
      </div>
    </div>
  );
}
