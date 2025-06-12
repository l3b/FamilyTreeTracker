import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-heritage-beige">
      {/* Header */}
      <header className="bg-white shadow-md border-b-2 border-heritage-brown">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 space-x-reverse">
                <i className="fas fa-sitemap text-heritage-brown text-2xl"></i>
                <h1 className="text-xl font-bold text-heritage-brown">عائلتنا</h1>
              </div>
            </div>
            <Button onClick={handleLogin} className="bg-heritage-brown hover:bg-heritage-green text-white">
              تسجيل الدخول
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-heritage-brown mb-6">
            اكتشف تاريخ عائلتك
          </h1>
          <p className="text-xl text-heritage-dark mb-8 max-w-3xl mx-auto">
            منصة شاملة لحفظ تاريخ العائلة وتوثيق الذكريات والتواصل مع أفراد العائلة في جميع أنحاء العالم
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-heritage-brown hover:bg-heritage-green text-white text-lg px-8 py-3"
          >
            ابدأ رحلتك الآن
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-heritage-brown text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-sitemap text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-heritage-dark mb-2">شجرة العائلة</h3>
              <p className="text-gray-600">
                قم ببناء شجرة عائلتك التفاعلية وتتبع الأنساب عبر الأجيال
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-heritage-green text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-upload text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-heritage-dark mb-2">استيراد GEDCOM</h3>
              <p className="text-gray-600">
                استورد بيانات عائلتك من MyHeritage أو مواقع أخرى بسهولة
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-heritage-gold text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-newspaper text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-heritage-dark mb-2">أخبار العائلة</h3>
              <p className="text-gray-600">
                شارك آخر أخبار العائلة والمناسبات المهمة مع جميع الأفراد
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-heritage-dark mb-2">الوثائق والصور</h3>
              <p className="text-gray-600">
                احفظ الوثائق التاريخية والصور العائلية في مكان آمن
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-heritage-brown mb-4">
            ابدأ في توثيق تاريخ عائلتك اليوم
          </h2>
          <p className="text-lg text-heritage-dark mb-6">
            انضم إلى آلاف العائلات التي تستخدم منصتنا لحفظ ذكرياتها
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-heritage-brown hover:bg-heritage-green text-white text-lg px-8 py-3"
          >
            <i className="fas fa-arrow-left ml-2"></i>
            ابدأ مجاناً
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-heritage-brown text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 space-x-reverse mb-4">
              <i className="fas fa-sitemap text-heritage-gold text-2xl"></i>
              <h3 className="text-xl font-bold">عائلتنا</h3>
            </div>
            <p className="text-heritage-beige">
              &copy; 2024 عائلتنا. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
