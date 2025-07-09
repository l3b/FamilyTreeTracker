import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteForm, setInviteForm] = useState({
    email: "",
    username: "",
    familyMemberId: "",
    isAdmin: false,
    message: ""
  });

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.isSuperAdmin;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-heritage-brown mb-4">غير مخول</h1>
        <p className="text-heritage-dark">ليس لديك صلاحيات للوصول إلى لوحة الإدارة</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-heritage-brown">لوحة إدارة العائلة</h1>
          <p className="text-heritage-dark mt-2">إدارة أعضاء العائلة والصلاحيات</p>
        </div>
        {user?.isSuperAdmin && (
          <Badge variant="default" className="bg-heritage-gold text-white">
            مدير رئيسي
          </Badge>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="invites">الدعوات</TabsTrigger>
          <TabsTrigger value="settings">إعدادات العائلة</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاطات</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-heritage-brown">المستخدمون المسجلون</CardTitle>
              <CardDescription>إدارة المستخدمين وصلاحياتهم في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-heritage-dark">
                  <i className="fas fa-info-circle ml-2 text-heritage-brown"></i>
                  سيتم تطوير هذا القسم قريباً لعرض جميع المستخدمين المسجلين
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-heritage-brown">دعوة عضو جديد</CardTitle>
              <CardDescription>دعوة أفراد العائلة للانضمام إلى المنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={inviteForm.username}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="اسم المستخدم"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">رسالة الدعوة (اختيارية)</Label>
                <Textarea
                  id="message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="مرحباً بك في شجرة عائلتنا..."
                  className="min-h-20"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={inviteForm.isAdmin}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isAdmin">منح صلاحيات إدارية</Label>
              </div>

              <Button className="bg-heritage-brown hover:bg-heritage-green text-white">
                <i className="fas fa-paper-plane ml-2"></i>
                إرسال الدعوة
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-heritage-brown">الدعوات المرسلة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-heritage-dark">
                <i className="fas fa-info-circle ml-2 text-heritage-brown"></i>
                سيتم تطوير هذا القسم لعرض الدعوات المرسلة وحالتها
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-heritage-brown">إعدادات العائلة</CardTitle>
              <CardDescription>إدارة الإعدادات العامة للعائلة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="familyName">اسم العائلة</Label>
                <Input
                  id="familyName"
                  placeholder="عائلة آل ثاني"
                />
              </div>
              
              <div>
                <Label htmlFor="familyDescription">وصف العائلة</Label>
                <Textarea
                  id="familyDescription"
                  placeholder="نبذة عن تاريخ العائلة وتراثها..."
                  className="min-h-20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" id="isPublic" className="rounded" />
                  <Label htmlFor="isPublic">عائلة عامة (يمكن للآخرين العثور عليها)</Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" id="allowInvites" className="rounded" defaultChecked />
                  <Label htmlFor="allowInvites">السماح للأعضاء بدعوة آخرين</Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" id="requireApproval" className="rounded" defaultChecked />
                  <Label htmlFor="requireApproval">تتطلب موافقة المدير على المحتوى الجديد</Label>
                </div>
              </div>

              <Button className="bg-heritage-brown hover:bg-heritage-green text-white">
                <i className="fas fa-save ml-2"></i>
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-heritage-brown">سجل نشاطات المستخدمين</CardTitle>
              <CardDescription>متابعة جميع العمليات التي يقوم بها المستخدمون</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-r-4 border-heritage-brown pr-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">إضافة عضو جديد</span>
                    <span className="text-sm text-gray-500">منذ ساعتين</span>
                  </div>
                  <p className="text-sm text-heritage-dark">أضاف المستخدم عبدالله عضو جديد: "أحمد الثاني"</p>
                </div>
                
                <div className="border-r-4 border-heritage-green pr-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">استيراد GEDCOM</span>
                    <span className="text-sm text-gray-500">منذ 3 ساعات</span>
                  </div>
                  <p className="text-sm text-heritage-dark">تم استيراد 330 فرد من ملف GEDCOM</p>
                </div>
                
                <div className="border-r-4 border-heritage-gold pr-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">تسجيل دخول</span>
                    <span className="text-sm text-gray-500">منذ 4 ساعات</span>
                  </div>
                  <p className="text-sm text-heritage-dark">دخل المستخدم l3b@hotmail.com إلى النظام</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}