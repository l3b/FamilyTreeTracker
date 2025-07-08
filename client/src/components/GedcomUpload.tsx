import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { parseGedcom } from "@/lib/gedcom";

interface GedcomUploadProps {
  onClose: () => void;
}

export default function GedcomUpload({ onClose }: GedcomUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/gedcom/import", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to import GEDCOM file");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-documents"] });
      onClose();
      
      const stats = [];
      if (data.clearedCount > 0) stats.push(`${data.clearedCount} محذوف`);
      if (data.importedCount > 0) stats.push(`${data.importedCount} جديد`);
      if (data.updatedCount > 0) stats.push(`${data.updatedCount} محدث`);
      if (data.skippedCount > 0) stats.push(`${data.skippedCount} موجود مسبقاً`);
      
      toast({
        title: "تم الاستيراد بنجاح",
        description: `${stats.join('، ')} من أصل ${data.totalIndividuals} فرد في ملف GEDCOM`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الاستيراد",
        description: "فشل في استيراد ملف GEDCOM",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.ged')) {
      toast({
        title: "نوع ملف غير صحيح",
        description: "يرجى اختيار ملف GEDCOM بامتداد .ged",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const parsedData = parseGedcom(text);
      setPreviewData(parsedData);
    } catch (error) {
      toast({
        title: "خطأ في قراءة الملف",
        description: "لا يمكن قراءة ملف GEDCOM المحدد",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("gedcom", file);
    formData.append("clearExisting", clearExisting.toString());
    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-heritage-brown text-xl">
            <i className="fas fa-upload ml-2"></i>
            استيراد ملف GEDCOM
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <Label htmlFor="gedcom-file" className="text-heritage-dark font-medium">
              اختر ملف GEDCOM
            </Label>
            <div className="mt-2">
              <Input
                id="gedcom-file"
                type="file"
                accept=".ged,.gedcom"
                onChange={handleFileChange}
                className="file:bg-heritage-brown file:text-white file:border-0 file:px-4 file:py-2 file:rounded-md file:hover:bg-heritage-green"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              الصيغ المدعومة: .ged, .gedcom (من MyHeritage, FamilySearch, وغيرها)
            </p>
          </div>

          {/* Clear Existing Data Option */}
          <div className="flex items-center space-x-2 space-x-reverse p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="clear-existing"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="h-4 w-4 text-heritage-brown bg-gray-100 border-gray-300 rounded focus:ring-heritage-green focus:ring-2"
            />
            <label htmlFor="clear-existing" className="text-sm text-amber-800 cursor-pointer">
              <span className="font-medium">حذف البيانات الموجودة:</span> امسح جميع أفراد العائلة الحاليين قبل الاستيراد (بداية جديدة)
            </label>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="bg-heritage-beige p-4 rounded-lg border border-heritage-brown">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-heritage-brown"></div>
                <span className="text-heritage-dark">جاري معالجة الملف...</span>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {previewData && !isProcessing && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-heritage-brown mb-4">
                معاينة البيانات
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-heritage-beige rounded-lg">
                  <div className="text-2xl font-bold text-heritage-brown">
                    {previewData.individuals?.length || 0}
                  </div>
                  <div className="text-sm text-heritage-dark">أفراد العائلة</div>
                </div>
                <div className="text-center p-3 bg-heritage-beige rounded-lg">
                  <div className="text-2xl font-bold text-heritage-green">
                    {previewData.families?.length || 0}
                  </div>
                  <div className="text-sm text-heritage-dark">العائلات</div>
                </div>
                <div className="text-center p-3 bg-heritage-beige rounded-lg">
                  <div className="text-2xl font-bold text-heritage-gold">
                    {previewData.sources?.length || 0}
                  </div>
                  <div className="text-sm text-heritage-dark">المصادر</div>
                </div>
              </div>

              {/* Sample individuals */}
              {previewData.individuals && previewData.individuals.length > 0 && (
                <div>
                  <h4 className="font-medium text-heritage-dark mb-2">
                    عينة من الأفراد:
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {previewData.individuals.slice(0, 5).map((individual: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center space-x-2 space-x-reverse">
                        <i className="fas fa-user text-heritage-brown"></i>
                        <span>
                          {individual.name || "اسم غير محدد"}
                          {individual.birth && ` (${individual.birth})`}
                        </span>
                      </div>
                    ))}
                    {previewData.individuals.length > 5 && (
                      <div className="text-sm text-gray-500">
                        ... و {previewData.individuals.length - 5} آخرين
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3 space-x-reverse">
              <i className="fas fa-exclamation-triangle text-amber-500 text-lg mt-0.5"></i>
              <div>
                <h4 className="font-medium text-amber-800 mb-2">تنبيه مهم</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• سيتم دمج البيانات المستوردة مع بيانات العائلة الحالية</li>
                  <li>• قد تحتاج إلى مراجعة وتحرير البيانات بعد الاستيراد</li>
                  <li>• تأكد من صحة ملف GEDCOM قبل الاستيراد</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing || uploadMutation.isPending}
              className="bg-heritage-brown text-white hover:bg-heritage-green"
            >
              {uploadMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <i className="fas fa-upload ml-2"></i>
                  استيراد الملف
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
