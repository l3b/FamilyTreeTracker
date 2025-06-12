import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DocumentCard from "@/components/DocumentCard";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Documents() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    category: "",
    file: null as File | null,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: familyDocuments = [], isLoading } = useQuery({
    queryKey: ["/api/family-documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/family-documents", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-documents"] });
      setShowUploadForm(false);
      setUploadData({ title: "", description: "", category: "", file: null });
      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع الوثيقة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في رفع الوثيقة",
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("document", uploadData.file);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);
    formData.append("category", uploadData.category);

    uploadMutation.mutate(formData);
  };

  const categories = [
    "شهادات الميلاد",
    "عقود الزواج",
    "الشهادات الجامعية",
    "سندات الملكية",
    "وثائق تاريخية",
    "أخرى",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-heritage-beige">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-brown mx-auto mb-4"></div>
            <p className="text-heritage-dark">جاري تحميل الوثائق...</p>
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
            <h1 className="text-3xl font-bold text-heritage-brown mb-2">وثائق العائلة</h1>
            <p className="text-heritage-dark">احفظ الوثائق والشهادات المهمة للعائلة</p>
          </div>
          <Button 
            onClick={() => setShowUploadForm(true)}
            className="bg-heritage-brown text-white hover:bg-heritage-green"
          >
            <i className="fas fa-plus ml-2"></i>
            رفع وثيقة جديدة
          </Button>
        </div>

        {/* Filter by Category */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-heritage-brown border-heritage-brown">
                جميع الوثائق
              </Button>
              {categories.map((category) => (
                <Button key={category} variant="ghost" size="sm" className="text-heritage-dark">
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {familyDocuments.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <i className="fas fa-file-alt text-6xl text-heritage-brown mb-6"></i>
              <h2 className="text-2xl font-bold text-heritage-dark mb-4">لا توجد وثائق حتى الآن</h2>
              <p className="text-gray-600 mb-6">ابدأ في حفظ الوثائق والشهادات المهمة للعائلة</p>
              <Button 
                onClick={() => setShowUploadForm(true)}
                className="bg-heritage-brown text-white hover:bg-heritage-green"
              >
                رفع أول وثيقة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {familyDocuments.map((document: any) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Upload Form Modal */}
      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heritage-brown">رفع وثيقة جديدة</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-heritage-dark">عنوان الوثيقة *</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="مثل: شهادة ميلاد أحمد"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-heritage-dark">الوصف</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="وصف مختصر للوثيقة"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-heritage-dark">الفئة</Label>
              <Select
                value={uploadData.category}
                onValueChange={(value) => setUploadData({ ...uploadData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file" className="text-heritage-dark">الملف *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                الصيغ المدعومة: PDF, DOC, DOCX, JPG, PNG (حد أقصى 10 ميجابايت)
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
                    رفع الوثيقة
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
