import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsCard from "@/components/NewsCard";
import DocumentCard from "@/components/DocumentCard";
import PhotoCard from "@/components/PhotoCard";
import GedcomUpload from "@/components/GedcomUpload";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showGedcomUpload, setShowGedcomUpload] = useState(false);

  const { data: familyMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/family-members"],
  });

  const { data: familyNews = [], isLoading: newsLoading } = useQuery({
    queryKey: ["/api/family-news"],
  });

  const { data: familyDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/family-documents"],
  });

  const { data: familyPhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["/api/family-photos"],
  });

  const recentNews = familyNews.slice(0, 3);
  const recentDocuments = familyDocuments.slice(0, 4);
  const recentPhotos = familyPhotos.slice(0, 6);

  const totalMembers = familyMembers.length;
  const totalDocuments = familyDocuments.length;
  const totalPhotos = familyPhotos.length;
  const totalNews = familyNews.length;

  return (
    <div className="min-h-screen bg-heritage-beige">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-heritage-brown mb-2">مرحباً بعائلتك</h2>
              <p className="text-heritage-dark">اكتشف تاريخ عائلتك وشارك الذكريات مع أحبائك</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setShowGedcomUpload(true)}
          >
            <CardContent className="pt-6 text-center">
              <div className="bg-heritage-brown text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-upload text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-heritage-dark mb-2">استيراد GEDCOM</h3>
              <p className="text-sm text-gray-600">استورد بيانات عائلتك من MyHeritage أو مواقع أخرى</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/api/gedcom/export';
              link.download = 'family.ged';
              link.click();
            }}
          >
            <CardContent className="pt-6 text-center">
              <div className="bg-heritage-green text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-download text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-heritage-dark mb-2">تصدير GEDCOM</h3>
              <p className="text-sm text-gray-600">صدّر بيانات عائلتك لاستخدامها في تطبيقات أخرى</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setLocation("/family-tree")}
          >
            <CardContent className="pt-6 text-center">
              <div className="bg-heritage-gold text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-plus text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-heritage-dark mb-2">إضافة فرد</h3>
              <p className="text-sm text-gray-600">أضف أفراد جدد إلى شجرة العائلة</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setLocation("/documents")}
          >
            <CardContent className="pt-6 text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file-upload text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-heritage-dark mb-2">رفع الوثائق</h3>
              <p className="text-sm text-gray-600">احفظ الوثائق والشهادات المهمة</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Family Tree Preview */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-heritage-brown">شجرة العائلة</h3>
              <Button 
                variant="ghost" 
                className="text-heritage-brown hover:text-heritage-gold"
                onClick={() => setLocation("/family-tree")}
              >
                <i className="fas fa-expand-alt ml-2"></i>
                عرض كامل
              </Button>
            </div>
            
            {membersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-heritage-brown mx-auto mb-4"></div>
                <p className="text-heritage-dark">جاري تحميل أفراد العائلة...</p>
              </div>
            ) : familyMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-heritage-dark mb-4">لم يتم إضافة أي أفراد للعائلة بعد</p>
                <Button 
                  onClick={() => setLocation("/family-tree")}
                  className="bg-heritage-brown hover:bg-heritage-green text-white"
                >
                  إضافة أول فرد
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {familyMembers.slice(0, 6).map((member: any) => (
                  <div key={member.id} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-heritage-brown text-white flex items-center justify-center mx-auto mb-2">
                      {member.profileImageUrl ? (
                        <img 
                          src={member.profileImageUrl} 
                          alt={member.firstName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <i className="fas fa-user text-xl"></i>
                      )}
                    </div>
                    <div className="text-sm font-medium text-heritage-dark">
                      {member.firstName} {member.lastName}
                    </div>
                    {member.arabicName && (
                      <div className="text-xs text-gray-500">{member.arabicName}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                إجمالي أفراد العائلة: <span className="font-semibold text-heritage-brown">{totalMembers} فرد</span>
              </p>
              <Button 
                onClick={() => setLocation("/family-tree")}
                className="bg-heritage-brown text-white hover:bg-heritage-green"
              >
                <i className="fas fa-edit ml-2"></i>
                تحرير الشجرة
              </Button>
            </div>
          </div>

          {/* Recent Activity & Stats */}
          <div className="space-y-6">
            {/* Family Stats */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-heritage-brown mb-6">إحصائيات العائلة</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-heritage-brown text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        <i className="fas fa-users"></i>
                      </div>
                      <span className="text-heritage-dark">أفراد العائلة</span>
                    </div>
                    <span className="font-bold text-heritage-brown">{totalMembers}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-heritage-green text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        <i className="fas fa-file-alt"></i>
                      </div>
                      <span className="text-heritage-dark">الوثائق</span>
                    </div>
                    <span className="font-bold text-heritage-green">{totalDocuments}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-heritage-gold text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        <i className="fas fa-images"></i>
                      </div>
                      <span className="text-heritage-dark">الصور</span>
                    </div>
                    <span className="font-bold text-heritage-gold">{totalPhotos}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        <i className="fas fa-newspaper"></i>
                      </div>
                      <span className="text-heritage-dark">الأخبار</span>
                    </div>
                    <span className="font-bold text-blue-600">{totalNews}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent News */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-heritage-brown">أخبار العائلة</h3>
                  <Button 
                    variant="ghost"
                    className="text-heritage-brown hover:text-heritage-gold"
                    onClick={() => setLocation("/news")}
                  >
                    <i className="fas fa-plus ml-2"></i>
                    إضافة خبر
                  </Button>
                </div>

                {newsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-heritage-brown mx-auto"></div>
                  </div>
                ) : recentNews.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">لا توجد أخبار حتى الآن</p>
                ) : (
                  <div className="space-y-4">
                    {recentNews.map((news: any) => (
                      <NewsCard key={news.id} news={news} compact />
                    ))}
                  </div>
                )}

                <div className="mt-4 text-center">
                  <Button 
                    variant="ghost"
                    className="text-heritage-brown hover:text-heritage-gold text-sm"
                    onClick={() => setLocation("/news")}
                  >
                    عرض جميع الأخبار
                    <i className="fas fa-arrow-left mr-1"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Documents & Photos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Recent Documents */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-heritage-brown">الوثائق الحديثة</h3>
                <Button 
                  variant="ghost"
                  className="text-heritage-brown hover:text-heritage-gold"
                  onClick={() => setLocation("/documents")}
                >
                  عرض الكل
                  <i className="fas fa-arrow-left mr-1"></i>
                </Button>
              </div>

              {documentsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-heritage-brown mx-auto"></div>
                </div>
              ) : recentDocuments.length === 0 ? (
                <p className="text-gray-600 text-center py-4">لا توجد وثائق حتى الآن</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recentDocuments.map((document: any) => (
                    <DocumentCard key={document.id} document={document} compact />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Photos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-heritage-brown">الصور الحديثة</h3>
                <Button 
                  variant="ghost"
                  className="text-heritage-brown hover:text-heritage-gold"
                  onClick={() => setLocation("/photos")}
                >
                  عرض الكل
                  <i className="fas fa-arrow-left mr-1"></i>
                </Button>
              </div>

              {photosLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-heritage-brown mx-auto"></div>
                </div>
              ) : recentPhotos.length === 0 ? (
                <p className="text-gray-600 text-center py-4">لا توجد صور حتى الآن</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {recentPhotos.map((photo: any) => (
                    <PhotoCard key={photo.id} photo={photo} compact />
                  ))}
                </div>
              )}

              <div className="mt-4 text-center">
                <Button 
                  onClick={() => setLocation("/photos")}
                  className="bg-heritage-brown text-white hover:bg-heritage-green text-sm px-4 py-2"
                >
                  <i className="fas fa-plus ml-2"></i>
                  إضافة صور
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* GEDCOM Upload Modal */}
      {showGedcomUpload && (
        <GedcomUpload onClose={() => setShowGedcomUpload(false)} />
      )}
    </div>
  );
}
