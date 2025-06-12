import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewsCard from "@/components/NewsCard";
import NewsForm from "@/components/NewsForm";

export default function News() {
  const [showNewsForm, setShowNewsForm] = useState(false);

  const { data: familyNews = [], isLoading } = useQuery({
    queryKey: ["/api/family-news"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-heritage-beige">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-brown mx-auto mb-4"></div>
            <p className="text-heritage-dark">جاري تحميل الأخبار...</p>
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
            <h1 className="text-3xl font-bold text-heritage-brown mb-2">أخبار العائلة</h1>
            <p className="text-heritage-dark">شارك آخر أخبار العائلة والمناسبات المهمة</p>
          </div>
          <Button 
            onClick={() => setShowNewsForm(true)}
            className="bg-heritage-brown text-white hover:bg-heritage-green"
          >
            <i className="fas fa-plus ml-2"></i>
            إضافة خبر جديد
          </Button>
        </div>

        {familyNews.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <i className="fas fa-newspaper text-6xl text-heritage-brown mb-6"></i>
              <h2 className="text-2xl font-bold text-heritage-dark mb-4">لا توجد أخبار حتى الآن</h2>
              <p className="text-gray-600 mb-6">ابدأ في مشاركة أخبار وأحداث العائلة المهمة</p>
              <Button 
                onClick={() => setShowNewsForm(true)}
                className="bg-heritage-brown text-white hover:bg-heritage-green"
              >
                إضافة أول خبر
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {familyNews.map((news: any) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* News Form Modal */}
      {showNewsForm && (
        <NewsForm onClose={() => setShowNewsForm(false)} />
      )}
    </div>
  );
}
