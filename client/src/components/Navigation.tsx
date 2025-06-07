import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";
import {
  PrinterIcon,
  Home,
  FileText,
  Plus,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  Star,
  BarChart3
} from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      //await logout.mutateAsync(); // Assuming logout is a mutation function from useMutation hook
      window.location.href = "/api/logout"; // temporary solution without mutation func
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if request fails
      window.location.href = '/';
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      {
        href: "/",
        label: "Ana Sayfa",
        icon: <Home className="h-4 w-4" />,
        active: location === "/"
      },
    ];

    switch (user.role) {
      case 'customer':
        return [
          ...baseItems,
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <BarChart3 className="h-4 w-4" />,
            active: location === "/dashboard"
          },
        ];

      case 'printer':
        return [
          ...baseItems,
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <Building2 className="h-4 w-4" />,
            active: location === "/dashboard"
          },
        ];

      case 'admin':
        return [
          ...baseItems,
          {
            href: "/dashboard",
            label: "Admin Panel",
            icon: <Users className="h-4 w-4" />,
            active: location === "/dashboard"
          },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getUserDisplayName = () => {
    if (user.companyName && user.role === 'printer') {
      return user.companyName;
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  const getUserInitials = () => {
    if (user.companyName && user.role === 'printer') {
      return user.companyName.charAt(0).toUpperCase();
    }
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'customer':
        return 'bg-blue-100 text-blue-800';
      case 'printer':
        return 'bg-orange-100 text-orange-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'customer':
        return 'Müşteri';
      case 'printer':
        return 'Matbaa';
      case 'admin':
        return 'Admin';
      default:
        return 'Kullanıcı';
    }
  };

  const DesktopNavigation = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <PrinterIcon className="text-primary text-2xl mr-3" />
              <span className="text-2xl font-bold text-gray-900">Matbixx</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:text-primary hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Quick Actions & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Credit Balance for Customers */}
            {user.role === 'customer' && (
              <div className="hidden sm:flex items-center text-sm">
                <CreditCard className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-gray-600">₺{user.creditBalance}</span>
              </div>
            )}

            {/* Rating for Printers */}
            {user.role === 'printer' && user.rating && (
              <div className="hidden sm:flex items-center text-sm">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-gray-600">{user.rating}</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {getUserDisplayName()}
                    </p>
                    <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                      {getRoleLabel()}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {user.role === 'customer' && (
                  <>
                    <DropdownMenuItem>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Kredi: ₺{user.creditBalance}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {user.role === 'printer' && (
                  <>
                    <DropdownMenuItem>
                      <Star className="h-4 w-4 mr-2" />
                      Puan: {user.rating || '0.0'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Building2 className="h-4 w-4 mr-2" />
                      {user.subscriptionStatus === 'active' ? 'Premium Üye' : 'Temel Üye'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarlar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );

  const MobileNavigation = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 md:hidden">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <PrinterIcon className="text-primary text-xl mr-2" />
              <span className="text-xl font-bold text-gray-900">Matbixx</span>
            </div>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getUserDisplayName()}</p>
                      <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                        {getRoleLabel()}
                      </Badge>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-1">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        item.active
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:text-primary hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  </Link>
                ))}

                <div className="pt-4 space-y-1">
                  {user.role === 'customer' && (
                    <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Kredi: ₺{user.creditBalance}
                    </div>
                  )}

                  {user.role === 'printer' && (
                    <>
                      <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2" />
                        Puan: {user.rating || '0.0'}
                      </div>
                      <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4 mr-2" />
                        {user.subscriptionStatus === 'active' ? 'Premium Üye' : 'Temel Üye'}
                      </div>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Ayarlar
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );

  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
    </>
  );
}