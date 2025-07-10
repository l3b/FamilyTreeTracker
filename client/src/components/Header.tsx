import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
          <div className="hidden md:block mr-10">
            <NavigationMenu>
              <NavigationMenuList>
                {navigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink 
                      className={navigationMenuTriggerStyle()}
                      onClick={() => window.location.href = item.href}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} />
                    <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
