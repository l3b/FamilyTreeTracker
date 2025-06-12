import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-heritage-brown text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 space-x-reverse mb-4">
              <i className="fas fa-sitemap text-heritage-gold text-2xl"></i>
              <h3 className="text-xl font-bold">عائلتنا</h3>
            </div>
            <p className="text-heritage-beige mb-4">
              منصة شاملة لحفظ تاريخ العائلة وتوثيق الذكريات والتواصل مع أفراد العائلة في جميع أنحاء العالم.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/family-tree" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  شجرة العائلة
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  الأخبار
                </Link>
              </li>
              <li>
                <Link href="/documents" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  الوثائق
                </Link>
              </li>
              <li>
                <Link href="/photos" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  الصور
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">الدعم</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  مركز المساعدة
                </a>
              </li>
              <li>
                <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  اتصل بنا
                </a>
              </li>
              <li>
                <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  الخصوصية
                </a>
              </li>
              <li>
                <a href="#" className="text-heritage-beige hover:text-heritage-gold transition-colors">
                  الشروط
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-heritage-green mt-8 pt-8 text-center">
          <p className="text-heritage-beige">&copy; 2024 عائلتنا. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
