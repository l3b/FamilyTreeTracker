import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FamilyTreeView from "@/components/FamilyTreeView";
import AddMemberForm from "@/components/AddMemberForm";
import { useToast } from "@/hooks/use-toast";

export default function FamilyTree() {
  const [showAddMember, setShowAddMember] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ["/api/family-members"],
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`/api/family-members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الفرد من شجرة العائلة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الفرد",
        variant: "destructive",
      });
    },
  });

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

  return (
    <div className="min-h-screen bg-heritage-beige">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-heritage-brown mb-2">شجرة العائلة</h1>
            <p className="text-heritage-dark">اكتشف وأدر أفراد عائلتك</p>
          </div>
          <Button 
            onClick={() => setShowAddMember(true)}
            className="bg-heritage-brown text-white hover:bg-heritage-green"
          >
            <i className="fas fa-plus ml-2"></i>
            إضافة فرد جديد
          </Button>
        </div>

        {familyMembers.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <i className="fas fa-sitemap text-6xl text-heritage-brown mb-6"></i>
              <h2 className="text-2xl font-bold text-heritage-dark mb-4">ابدأ في بناء شجرة عائلتك</h2>
              <p className="text-gray-600 mb-6">أضف أول فرد لبدء رحلة توثيق تاريخ عائلتك</p>
              <Button 
                onClick={() => setShowAddMember(true)}
                className="bg-heritage-brown text-white hover:bg-heritage-green"
              >
                إضافة أول فرد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Family Tree Visualization */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <FamilyTreeView 
                  members={familyMembers} 
                  onDeleteMember={(id) => deleteMemberMutation.mutate(id)}
                />
              </CardContent>
            </Card>

            {/* Family Members List */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-heritage-brown mb-6">جميع أفراد العائلة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {familyMembers.map((member: any) => (
                    <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 space-x-reverse mb-4">
                        <div className="w-12 h-12 rounded-full bg-heritage-brown text-white flex items-center justify-center">
                          {member.profileImageUrl ? (
                            <img 
                              src={member.profileImageUrl} 
                              alt={member.firstName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <i className="fas fa-user"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-heritage-dark">
                            {member.firstName} {member.lastName}
                          </h4>
                          {member.arabicName && (
                            <p className="text-sm text-gray-600">{member.arabicName}</p>
                          )}
                        </div>
                      </div>
                      
                      {(member.birthDate || member.birthPlace || member.occupation) && (
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          {member.birthDate && (
                            <p><i className="fas fa-birthday-cake ml-2"></i>{new Date(member.birthDate).toLocaleDateString('ar-SA')}</p>
                          )}
                          {member.birthPlace && (
                            <p><i className="fas fa-map-marker-alt ml-2"></i>{member.birthPlace}</p>
                          )}
                          {member.occupation && (
                            <p><i className="fas fa-briefcase ml-2"></i>{member.occupation}</p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteMemberMutation.mutate(member.id)}
                          disabled={deleteMemberMutation.isPending}
                        >
                          <i className="fas fa-trash text-red-500"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberForm 
          onClose={() => setShowAddMember(false)}
          existingMembers={familyMembers}
        />
      )}
    </div>
  );
}
