import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertFamilyMemberSchema } from "@shared/schema";

interface AddMemberFormProps {
  onClose: () => void;
  existingMembers: any[];
  relationshipContext?: { type: string; relatedTo?: number } | null;
}

export default function AddMemberForm({ onClose, existingMembers, relationshipContext }: AddMemberFormProps) {
  // Auto-determine gender based on relationship
  const getAutoGender = (relationship: string): string => {
    switch (relationship) {
      case 'father':
      case 'son':
      case 'grandfather':
      case 'paternalGrandfather':
      case 'maternalGrandfather':
        return 'male';
      case 'mother':
      case 'daughter':
      case 'grandmother':
      case 'paternalGrandmother':
      case 'maternalGrandmother':
        return 'female';
      default:
        return '';
    }
  };

  // Auto-set relationship fields based on context
  const getRelationshipFields = () => {
    if (!relationshipContext) return {};
    
    const { type, relatedTo } = relationshipContext;
    const fields: any = {};
    
    if (relatedTo) {
      switch (type) {
        case 'father':
          fields.fatherId = relatedTo.toString();
          break;
        case 'mother':
          fields.motherId = relatedTo.toString();
          break;
        case 'spouse':
          fields.spouseId = relatedTo.toString();
          break;
        case 'child':
        case 'son':
        case 'daughter':
          // Set the relatedTo person as parent based on their gender
          const relatedPerson = existingMembers.find(m => m.id === relatedTo);
          if (relatedPerson) {
            if (relatedPerson.gender === 'male' || relatedPerson.gender === 'ذكر') {
              fields.fatherId = relatedTo.toString();
            } else if (relatedPerson.gender === 'female' || relatedPerson.gender === 'أنثى') {
              fields.motherId = relatedTo.toString();
            }
          }
          break;
      }
    }
    
    return fields;
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    arabicName: "",
    birthDate: "",
    deathDate: "",
    gender: relationshipContext ? getAutoGender(relationshipContext.type) : "",
    fatherId: "",
    motherId: "",
    spouseId: "",
    birthPlace: "",
    occupation: "",
    notes: "",
    ...getRelationshipFields(),
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: any) => {
      const response = await fetch("/api/family-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(memberData),
      });
      if (!response.ok) throw new Error("Failed to create family member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      onClose();
      toast({
        title: "تم إضافة الفرد بنجاح",
        description: "تم إضافة الفرد الجديد إلى شجرة العائلة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الفرد",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الاسم الأول والاسم الأخير",
        variant: "destructive",
      });
      return;
    }

    try {
      const memberData = {
        ...formData,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
        deathDate: formData.deathDate ? new Date(formData.deathDate) : null,
        fatherId: formData.fatherId ? parseInt(formData.fatherId) : null,
        motherId: formData.motherId ? parseInt(formData.motherId) : null,
        spouseId: formData.spouseId ? parseInt(formData.spouseId) : null,
      };

      // Remove empty strings and null values
      Object.keys(memberData).forEach(key => {
        if (memberData[key] === "" || memberData[key] === null) {
          delete memberData[key];
        }
      });

      createMemberMutation.mutate(memberData);
    } catch (error) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى التحقق من صحة البيانات المدخلة",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Filter members for parent/spouse selection
  const maleMembers = existingMembers.filter(member => member.gender === "male" || member.gender === "ذكر");
  const femaleMembers = existingMembers.filter(member => member.gender === "female" || member.gender === "أنثى");
  const allMembers = existingMembers;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-heritage-brown text-xl">
            <i className="fas fa-user-plus ml-2"></i>
            إضافة فرد جديد للعائلة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-heritage-dark font-medium">
                الاسم الأول *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="مثل: أحمد"
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-heritage-dark font-medium">
                اسم العائلة *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="مثل: محمد"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="arabicName" className="text-heritage-dark font-medium">
              الاسم بالعربية
            </Label>
            <Input
              id="arabicName"
              value={formData.arabicName}
              onChange={(e) => handleChange("arabicName", e.target.value)}
              placeholder="الاسم الكامل بالعربية"
            />
          </div>

          {/* Gender */}
          <div>
            <Label className="text-heritage-dark font-medium">
              الجنس
              {relationshipContext && formData.gender && (
                <span className="text-sm text-gray-500 mr-2">(محدد تلقائياً)</span>
              )}
            </Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleChange("gender", value)}
              disabled={relationshipContext && formData.gender !== ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate" className="text-heritage-dark font-medium">
                تاريخ الميلاد
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="deathDate" className="text-heritage-dark font-medium">
                تاريخ الوفاة (إن وجد)
              </Label>
              <Input
                id="deathDate"
                type="date"
                value={formData.deathDate}
                onChange={(e) => handleChange("deathDate", e.target.value)}
              />
            </div>
          </div>

          {/* Relationships */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-heritage-brown">العلاقات العائلية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-heritage-dark font-medium">الوالد</Label>
                <Select value={formData.fatherId} onValueChange={(value) => handleChange("fatherId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوالد" />
                  </SelectTrigger>
                  <SelectContent>
                    {maleMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-heritage-dark font-medium">الوالدة</Label>
                <Select value={formData.motherId} onValueChange={(value) => handleChange("motherId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الوالدة" />
                  </SelectTrigger>
                  <SelectContent>
                    {femaleMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-heritage-dark font-medium">الزوج/الزوجة</Label>
              <Select value={formData.spouseId} onValueChange={(value) => handleChange("spouseId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الزوج/الزوجة" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-heritage-brown">معلومات إضافية</h3>
            
            <div>
              <Label htmlFor="birthPlace" className="text-heritage-dark font-medium">
                مكان الميلاد
              </Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace}
                onChange={(e) => handleChange("birthPlace", e.target.value)}
                placeholder="مثل: الرياض، المملكة العربية السعودية"
              />
            </div>

            <div>
              <Label htmlFor="occupation" className="text-heritage-dark font-medium">
                المهنة
              </Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                placeholder="مثل: طبيب، مهندس، معلم"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-heritage-dark font-medium">
                ملاحظات
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="أي معلومات إضافية عن الشخص"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createMemberMutation.isPending}
              className="bg-heritage-brown text-white hover:bg-heritage-green"
            >
              {createMemberMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin ml-2"></i>
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <i className="fas fa-plus ml-2"></i>
                  إضافة الفرد
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
