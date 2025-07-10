import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AddMemberForm from "@/components/AddMemberForm";
import FamilyTreeView from "@/components/FamilyTreeView";
import FamilyView from "@/components/FamilyView";
import CompactFamilyView from "@/components/CompactFamilyView";
import GedcomUpload from "@/components/GedcomUpload";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Upload, Trash2, Users, UserCheck } from "lucide-react";

type TreeView = 'compact' | 'family' | 'pedigree' | 'fan';

export default function FamilyTree() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGedcomUpload, setShowGedcomUpload] = useState(false);
  const [currentView, setCurrentView] = useState<TreeView>('compact');
  const [relationshipContext, setRelationshipContext] = useState<{ type: string; relatedTo?: number } | null>(null);
  const [centerPerson, setCenterPerson] = useState<any>(null);
  const [showMalesOnly, setShowMalesOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["/api/family-members"],
  }) as { data: any[], isLoading: boolean };

  // Get linked profile
  const { data: linkedProfile } = useQuery({
    queryKey: ["/api/auth/linked-profile"],
    retry: false,
  });

  // Filter members based on male-only view
  const filteredMembers = showMalesOnly 
    ? members.filter(member => member.gender === 'male' || member.gender === 'ذكر')
    : members;

  // Set center person to linked profile or first member
  useEffect(() => {
    if (members.length > 0 && !centerPerson) {
      if (linkedProfile) {
        // Use linked profile as center
        setCenterPerson(linkedProfile);
      } else {
        // If no linked profile, center on first member
        setCenterPerson(members[0]);
      }
    }
  }, [linkedProfile, members, centerPerson]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/family-members/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف فرد العائلة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف فرد العائلة",
        variant: "destructive",
      });
    },
  });

  const handleAddMember = (relationship: string, relatedTo?: number) => {
    setRelationshipContext({ type: relationship, relatedTo });
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setRelationshipContext(null);
  };

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/cleanup', { method: 'POST', body: {} });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/family-news"] });
      toast({
        title: "تم التنظيف بنجاح",
        description: "تم حذف جميع البيانات بنجاح - قاعدة البيانات نظيفة الآن",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التنظيف",
        description: "فشل في تنظيف قاعدة البيانات",
        variant: "destructive",
      });
    },
  });

  const handleCompleteCleanup = () => {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      cleanupMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-heritage-beige">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-brown mx-auto mb-4"></div>
            <p className="text-heritage-dark">جاري تحميل شجرة العائلة...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'compact':
        return (
          <CompactFamilyView 
            members={filteredMembers} 
            onDeleteMember={(id) => deleteMutation.mutate(id)}
            onAddMember={handleAddMember}
            centerPerson={centerPerson}
            onCenterChange={setCenterPerson}
          />
        );
      case 'family':
        return (
          <FamilyView 
            members={filteredMembers} 
            onDeleteMember={(id) => deleteMutation.mutate(id)}
            onAddMember={handleAddMember}
            centerPerson={centerPerson}
            onCenterChange={setCenterPerson}
          />
        );
      case 'pedigree':
        return (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-heritage-brown mb-4">عرض النسب</h3>
            <p className="text-gray-600 mb-4">قريباً - عرض شجرة النسب التقليدي</p>
            <FamilyTreeView 
              members={filteredMembers} 
              onDeleteMember={(id) => deleteMutation.mutate(id)}
            />
          </div>
        );
      case 'fan':
        return (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-heritage-brown mb-4">العرض المروحي</h3>
            <p className="text-gray-600">قريباً - العرض المروحي للشجرة</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-heritage-beige">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-heritage-brown mb-4">شجرة العائلة</h1>
          <p className="text-lg text-heritage-dark">اكتشف تاريخ عائلتك وروابطها</p>
        </div>

        {/* View Switcher and Filter Controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <div className="flex gap-2">
            <Button 
              onClick={() => setCurrentView('compact')}
              variant={currentView === 'compact' ? 'default' : 'outline'}
              className={currentView === 'compact' 
                ? 'bg-heritage-brown hover:bg-heritage-dark text-white' 
                : 'border-heritage-brown text-heritage-brown hover:bg-heritage-light'
              }
            >
              <i className="fas fa-compress-alt mr-2"></i>
              العرض المبسط
            </Button>
            <Button 
              onClick={() => setCurrentView('family')}
              variant={currentView === 'family' ? 'default' : 'outline'}
              className={currentView === 'family' 
                ? 'bg-heritage-brown hover:bg-heritage-dark text-white' 
                : 'border-heritage-brown text-heritage-brown hover:bg-heritage-light'
              }
            >
              <i className="fas fa-users mr-2"></i>
              عرض العائلة
            </Button>
            <Button 
              onClick={() => setCurrentView('pedigree')}
              variant={currentView === 'pedigree' ? 'default' : 'outline'}
              className={currentView === 'pedigree' 
                ? 'bg-heritage-brown hover:bg-heritage-dark text-white' 
                : 'border-heritage-brown text-heritage-brown hover:bg-heritage-light'
              }
            >
              <i className="fas fa-sitemap mr-2"></i>
              عرض النسب
            </Button>
            <Button 
              onClick={() => setCurrentView('fan')}
              variant={currentView === 'fan' ? 'default' : 'outline'}
              className={currentView === 'fan' 
                ? 'bg-heritage-brown hover:bg-heritage-dark text-white' 
                : 'border-heritage-brown text-heritage-brown hover:bg-heritage-light'
              }
            >
            <i className="fas fa-fan mr-2"></i>
            العرض المروحي
          </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowMalesOnly(!showMalesOnly)}
              variant={showMalesOnly ? 'default' : 'outline'}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              {showMalesOnly ? 'إظهار الكل' : 'الرجال فقط'}
            </Button>
            {showMalesOnly && (
              <Badge variant="secondary" className="self-center">
                {filteredMembers.length} رجل
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button 
            onClick={() => handleAddMember('general')}
            className="bg-heritage-brown hover:bg-heritage-dark text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة فرد جديد
          </Button>
          <Button 
            onClick={() => setShowGedcomUpload(true)}
            variant="outline"
            className="border-heritage-brown text-heritage-brown hover:bg-heritage-light"
          >
            <Upload className="w-4 h-4 mr-2" />
            استيراد GEDCOM
          </Button>
          <Button 
            onClick={handleCompleteCleanup}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {cleanupMutation.isPending ? 'جاري التنظيف...' : 'تنظيف شامل'}
          </Button>
        </div>

        {members.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-heritage-brown">ابدأ شجرة عائلتك</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                لا توجد أفراد في شجرة العائلة حتى الآن. ابدأ بإضافة أول فرد.
              </p>
              <Button 
                onClick={() => handleAddMember('self')}
                className="bg-heritage-brown hover:bg-heritage-dark text-white"
              >
                إنشاء ملفي الشخصي
              </Button>
            </CardContent>
          </Card>
        ) : (
          renderCurrentView()
        )}
      </main>

      <Footer />

      {showAddForm && (
        <AddMemberForm
          onClose={handleCloseAddForm}
          existingMembers={members}
          relationshipContext={relationshipContext}
        />
      )}

      {showGedcomUpload && (
        <GedcomUpload onClose={() => setShowGedcomUpload(false)} />
      )}
    </div>
  );
}