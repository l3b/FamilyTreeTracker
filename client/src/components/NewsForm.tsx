import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NewsFormProps {
  onClose: () => void;
}

export default function NewsForm({ onClose }: NewsFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null as File | null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNewsMutation = useMutation({
    mutationFn: async (formDataToSend: FormData) => {
      const response = await fetch("/api/family-news", {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });
      if (!response.ok) throw new Error("Failed to create news");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-news"] });
      onClose();
      toast({
        title: "تم إضافة الخبر بنجاح",
        description: "تم نشر الخبر في صفحة أخبار العائلة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الخبر",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء عنوان الخبر والمحتوى",
        variant: "destructive",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("content", formData.content);
    
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    createNewsMutation.mutate(formDataToSend);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: "يرجى اختيار صورة أصغر من 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار ملف صورة صحيح",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
  };

  const newsTypes = [
    { value: "celebration", label: "احتفال", icon: "fas fa-birthday-cake", color: "text-heritage-gold" },
    { value: "achievement", label: "إنجاز", icon: "fas fa-trophy", color: "text-heritage-green" },
    { value: "announcement", label: "إعلان", icon: "fas fa-bullhorn", color: "text-heritage-brown" },
    { value: "memory", label: "ذكرى", icon: "fas fa-heart", color: "text-red-500" },
    { value: "general", label: "عام", icon: "fas fa-info-circle", color: "text-blue-500" },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-heritage-brown text-xl">
            <i className="fas fa-plus ml-2"></i>
            إضافة خبر جديد
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* News Type Selection */}
          <div>
            <Label className="text-heritage-dark font-medium mb-3 block">
              نوع الخبر
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {newsTypes.map((type) => (
                <div
                  key={type.value}
                  className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg hover:bg-heritage-beige cursor-pointer transition-colors"
                >
                  <i className={`${type.icon} ${type.color}`}></i>
                  <span className="text-sm text-heritage-dark">{type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-heritage-dark font-medium">
              عنوان الخبر *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثل: تخرج سارة من الجامعة"
              required
              className="mt-1"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-heritage-dark font-medium">
              محتوى الخبر *
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="اكتب تفاصيل الخبر هنا..."
              rows={5}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length}/500 حرف
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-heritage-dark font-medium">
              صورة الخبر (اختيارية)
            </Label>
            
            {!formData.image ? (
              <div className="mt-2">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">انقر لتحميل صورة</span> أو اسحب وأفلت
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF حتى 5MB</p>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-2 relative">
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="معاينة الصورة"
                    className="w-full max-w-xs h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {formData.image.name} ({(formData.image.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3 space-x-reverse">
              <i className="fas fa-lightbulb text-blue-500 text-lg mt-0.5"></i>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">نصائح لكتابة خبر جيد</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• اكتب عنواناً واضحاً وجذاباً</li>
                  <li>• أضف التفاصيل المهمة مثل التاريخ والمكان</li>
                  <li>• استخدم صورة توضيحية إن أمكن</li>
                  <li>• اذكر أسماء الأشخاص المعنيين</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createNewsMutation.isPending}
              className="bg-heritage-brown text-white hover:bg-heritage-green"
            >
              {createNewsMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  جاري النشر...
                </>
              ) : (
                <>
                  <i className="fas fa-newspaper ml-2"></i>
                  نشر الخبر
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
