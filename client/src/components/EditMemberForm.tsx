import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Camera, Mail, Phone, Plus, X } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const editMemberSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().optional(),
  arabicName: z.string().optional(),
  laqab: z.string().optional(),
  kunya: z.string().optional(),
  gender: z.union([
    z.enum(["male", "female", "ذكر", "أنثى"]),
    z.string()
  ]).optional(),
  birthDate: z.date().optional(),
  deathDate: z.date().optional(),
  birthPlace: z.string().optional(),
  deathPlace: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
  marriageDate: z.date().optional(),
  marriagePlace: z.string().optional(),
  notes: z.string().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

interface SocialMediaLink {
  platform: string;
  url: string;
}

interface EditMemberFormProps {
  member: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditMemberForm({ member, isOpen, onClose }: EditMemberFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLink[]>(
    member.socialMedia || []
  );
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      arabicName: member.arabicName || "",
      laqab: member.laqab || "",
      kunya: member.kunya || "",
      gender: member.gender === 'ذكر' ? 'male' : member.gender === 'أنثى' ? 'female' : member.gender || undefined,
      birthDate: member.birthDate ? new Date(member.birthDate) : undefined,
      deathDate: member.deathDate ? new Date(member.deathDate) : undefined,
      birthPlace: member.birthPlace || "",
      deathPlace: member.deathPlace || "",
      occupation: member.occupation || "",
      education: member.education || "",
      phone: member.phone || "",
      email: member.email || "",
      marriageDate: member.marriageDate ? new Date(member.marriageDate) : undefined,
      marriagePlace: member.marriagePlace || "",
      notes: member.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EditMemberFormData) => {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add social media links
      if (socialMediaLinks.length > 0) {
        formData.append('socialMedia', JSON.stringify(socialMediaLinks));
      }

      // Add profile image if selected
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      return apiRequest(`/api/family-members/${member.id}`, {
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-members", member.id] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات العضو بنجاح",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canEdit = user?.isAdmin || user?.isSuperAdmin || member.userId === user?.id;

  if (!canEdit) {
    return null;
  }

  const onSubmit = (data: EditMemberFormData) => {
    mutation.mutate(data);
  };

  const addSocialMediaLink = () => {
    setSocialMediaLinks([...socialMediaLinks, { platform: "", url: "" }]);
  };

  const removeSocialMediaLink = (index: number) => {
    setSocialMediaLinks(socialMediaLinks.filter((_, i) => i !== index));
  };

  const updateSocialMediaLink = (index: number, field: keyof SocialMediaLink, value: string) => {
    const updated = [...socialMediaLinks];
    updated[index][field] = value;
    setSocialMediaLinks(updated);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
    }
  };

  const sendEmailInvitation = async () => {
    if (!member.email) {
      toast({
        title: "لا يوجد بريد إلكتروني",
        description: "يرجى إضافة بريد إلكتروني أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("/api/invitations/send-email", {
        method: "POST",
        body: JSON.stringify({
          email: member.email,
          memberName: member.arabicName || member.firstName,
        }),
      });
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الدعوة بالبريد الإلكتروني",
      });
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال الدعوة",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل معلومات العضو</DialogTitle>
          <DialogDescription>
            قم بتحديث المعلومات الشخصية وبيانات الاتصال للعضو
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  الصورة الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                    <img
                      src={
                        profileImageFile
                          ? URL.createObjectURL(profileImageFile)
                          : member.profileImageUrl || 
                            (member.gender === 'female' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')
                      }
                      alt={member.arabicName || member.firstName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-image">اختر صورة جديدة</Label>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العائلة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arabicName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم العربي الكامل</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="laqab"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اللقب</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: الدكتور، المهندس، الحاج" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kunya"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكنية</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثال: أبو أحمد، أم فاطمة" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجنس</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجنس" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  معلومات الاتصال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف</FormLabel>
                        <FormControl>
                          <Input {...field} dir="ltr" placeholder="+966 50 123 4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          البريد الإلكتروني
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} dir="ltr" placeholder="example@email.com" />
                          </FormControl>
                          {member.email && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={sendEmailInvitation}
                            >
                              دعوة
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Social Media */}
                <div className="space-y-2">
                  <Label>وسائل التواصل الاجتماعي</Label>
                  {socialMediaLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={link.platform}
                        onValueChange={(value) => updateSocialMediaLink(index, 'platform', value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="المنصة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">فيسبوك</SelectItem>
                          <SelectItem value="twitter">تويتر</SelectItem>
                          <SelectItem value="instagram">إنستغرام</SelectItem>
                          <SelectItem value="linkedin">لينكدإن</SelectItem>
                          <SelectItem value="snapchat">سناب شات</SelectItem>
                          <SelectItem value="tiktok">تيك توك</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.url}
                        onChange={(e) => updateSocialMediaLink(index, 'url', e.target.value)}
                        placeholder="الرابط"
                        dir="ltr"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSocialMediaLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialMediaLink}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة حساب
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Birth & Death Information */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الميلاد والوفاة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الميلاد</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مكان الميلاد</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deathDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الوفاة</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deathPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مكان الوفاة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Professional & Education */}
            <Card>
              <CardHeader>
                <CardTitle>المهنة والتعليم</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المهنة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التعليم</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Marriage Information */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الزواج</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marriageDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الزواج</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marriagePlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مكان الزواج</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}