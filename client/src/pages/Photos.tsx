import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PhotoCard from "@/components/PhotoCard";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Photos() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    file: null as File | null,
  });
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: familyPhotos = [], isLoading } = useQuery({
    queryKey: ["/api/family-photos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/family-photos", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload photo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-photos"] });
      setShowUploadForm(false);
      setUploadData({ title: "", description: "", file: null });
      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع الصورة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", uploadData.file);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);

    uploadMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-heritage-beige">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-brown mx-auto mb-4"></div>
            <p className="text-heritage-dark">جاري تحميل الصور...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-heritage-beige">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-heritage-brown mb-2">صور العائلة</h1>
            <p className="text-heritage-dark">احفظ الذكريات الجميلة واللحظات المميزة</p>
          </div>
          <Button 
            onClick={() => setShowUploadForm(true)}
            className="bg-heritage-brown text-white hover:bg-heritage-green"
          >
            <i className="fas fa-plus ml-2"></i>
            إضافة صور جديدة
          </Button>
        </div>

        {familyPhotos.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <i className="fas fa-images text-6xl text-heritage-brown mb-6"></i>
              <h2 className="text-2xl font-bold text-heritage-dark mb-4">لا توجد صور حتى الآن</h2>
              <p className="text-gray-600 mb-6">ابدأ في حفظ الذكريات واللحظات المميزة للعائلة</p>
              <Button 
                onClick={() => setShowUploadForm(true)}
                className="bg-heritage-brown text-white hover:bg-heritage-green"
              >
                إضافة أول صورة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {familyPhotos.map((photo: any) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => setSelectedPhoto(photo)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Upload Form Modal */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heritage-brown">إضافة صور جديدة</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-heritage-dark">عنوان الصورة</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="مثل: احتفال عيد الميلاد"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-heritage-dark">الوصف</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="وصف الصورة أو المناسبة"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="file" className="text-heritage-dark">الصورة *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                accept="image/*"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                الصيغ المدعومة: JPG, PNG, GIF (حد أقصى 10 ميجابايت)
              </p>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowUploadForm(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit"
                className="bg-heritage-brown text-white hover:bg-heritage-green"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin ml-2"></i>
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload ml-2"></i>
                    رفع الصورة
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title || "صورة عائلية"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 left-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setSelectedPhoto(null)}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
            {(selectedPhoto.title || selectedPhoto.description) && (
              <div className="p-4">
                {selectedPhoto.title && (
                  <h3 className="text-lg font-semibold text-heritage-brown mb-2">
                    {selectedPhoto.title}
                  </h3>
                )}
                {selectedPhoto.description && (
                  <p className="text-gray-600">{selectedPhoto.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  تاريخ الإضافة: {new Date(selectedPhoto.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
