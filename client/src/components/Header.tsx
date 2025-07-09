import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: "الرئيسية", href: "/", icon: "fas fa-home" },
    { name: "شجرة العائلة", href: "/family-tree", icon: "fas fa-sitemap" },
    { name: "الأخبار", href: "/news", icon: "fas fa-newspaper" },
    { name: "الوثائق", href: "/documents", icon: "fas fa-file-alt" },
    { name: "الصور", href: "/photos", icon: "fas fa-images" },
    ...(user?.isAdmin || user?.isSuperAdmin ? [{ name: "لوحة الإدارة", href: "/admin", icon: "fas fa-cog" }] : []),
  ];

  return (
    <header className="bg-white shadow-md border-b-2 border-heritage-brown">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 space-x-reverse">
              <i className="fas fa-sitemap text-heritage-brown text-2xl"></i>
              <h1 className="text-xl font-bold text-heritage-brown">عائلتنا</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="mr-10 flex items-baseline space-x-4 space-x-reverse">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === item.href
                      ? "text-heritage-brown border-b-2 border-heritage-brown"
                      : "text-heritage-dark hover:text-heritage-brown"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="صورة الملف الشخصي"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-heritage-brown text-white flex items-center justify-center">
                  <i className="fas fa-user text-sm"></i>
                </div>
              )}
              <span className="text-heritage-dark font-medium hidden sm:block">
                {user?.firstName || user?.email || "المستخدم"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="text-heritage-dark hover:text-heritage-brown"
              >
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-heritage-brown hover:text-heritage-gold"
              >
                <i className="fas fa-bars text-xl"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 mt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location === item.href
                      ? "text-heritage-brown bg-heritage-beige"
                      : "text-heritage-dark hover:text-heritage-brown hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
