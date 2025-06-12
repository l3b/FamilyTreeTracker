import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AddMemberForm from "@/components/AddMemberForm";
import FamilyTreeView from "@/components/FamilyTreeView";
import FamilyView from "@/components/FamilyView";
import GedcomUpload from "@/components/GedcomUpload";
import { apiRequest } from "@/lib/queryClient";

type TreeView = 'family' | 'pedigree' | 'fan';

export default function FamilyTree() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGedcomUpload, setShowGedcomUpload] = useState(false);
  const [currentView, setCurrentView] = useState<TreeView>('family');
  const [relationshipContext, setRelationshipContext] = useState<{ type: string; relatedTo?: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["/api/family-members"],
  }) as { data: any[], isLoading: boolean };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/family-members/${id}`, "DELETE");
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
      case 'family':
        return (
          <FamilyView 
            members={members} 
            onDeleteMember={(id) => deleteMutation.mutate(id)}
            onAddMember={handleAddMember}
          />
        );
      case 'pedigree':
        return (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-heritage-brown mb-4">عرض النسب</h3>
            <p className="text-gray-600 mb-4">قريباً - عرض شجرة النسب التقليدي</p>
            <FamilyTreeView 
              members={members} 
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

        {/* View Switcher - MyHeritage Style */}
        <div className="flex justify-center gap-2 mb-6">
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

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button 
            onClick={() => handleAddMember('general')}
            className="bg-heritage-brown hover:bg-heritage-dark text-white"
          >
            <i className="fas fa-user-plus mr-2"></i>
            إضافة فرد جديد
          </Button>
          <Button 
            onClick={() => setShowGedcomUpload(true)}
            variant="outline"
            className="border-heritage-brown text-heritage-brown hover:bg-heritage-light"
          >
            <i className="fas fa-upload mr-2"></i>
            استيراد GEDCOM
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