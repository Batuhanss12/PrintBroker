import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Building2, Shield, FileText, BarChart3, Users, Zap, Target, LayoutGrid, Disc, Printer, CreditCard, Settings } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDashboard = () => {
    window.location.href = "/dashboard";
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      const response = await fetch('/api/test/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Role change failed:', error);
    }
  };

  const handleQuoteRequest = (type: string) => {
    window.location.href = `/quote/${type}`;
  };

  const userRole = (user as any)?.role || 'customer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">PrintConnect</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {userRole === 'customer' && 'Müşteri Panel'}
                {userRole === 'printer' && 'Matbaa Panel'}
                {userRole === 'admin' && 'Admin Panel'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {/* Test için role değiştirme butonları */}
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleRoleChange('customer')}
                  size="sm"
                  variant={userRole === 'customer' ? 'default' : 'outline'}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Müşteri
                </Button>
                <Button 
                  onClick={() => handleRoleChange('printer')}
                  size="sm"
                  variant={userRole === 'printer' ? 'default' : 'outline'}
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Matbaa
                </Button>
                <Button 
                  onClick={() => handleRoleChange('admin')}
                  size="sm"
                  variant={userRole === 'admin' ? 'default' : 'outline'}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white"
                >
                  Admin
                </Button>
              </div>
              
              {(user as any)?.profileImageUrl && (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm text-gray-700">
                {(user as any)?.firstName || (user as any)?.email}
              </span>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Hoş Geldiniz, {(user as any)?.firstName || 'Kullanıcı'}!
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            PrintConnect platformuna başarıyla giriş yaptınız
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-600 rounded-full px-6 py-3">
            <Zap className="h-5 w-5 mr-2" />
            <span className="font-medium">Tüm paneller aktif! Test için role değiştirebilirsiniz.</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 cursor-pointer" onClick={() => handleQuoteRequest('sheet_label')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <LayoutGrid className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tabaka Etiket</h3>
              <p className="text-gray-600 mb-4">A3/A4 tabaka etiket baskısı</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Target className="h-4 w-4 mr-2" />
                Teklif Al
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100 cursor-pointer" onClick={() => handleQuoteRequest('roll_label')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Disc className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rulo Etiket</h3>
              <p className="text-gray-600 mb-4">Termal ve yapışkanlı etiketler</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Target className="h-4 w-4 mr-2" />
                Teklif Al
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 cursor-pointer" onClick={() => handleQuoteRequest('general_printing')}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Printer className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Genel Baskı</h3>
              <p className="text-gray-600 mb-4">Katalog, broşür, kartvizit</p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Target className="h-4 w-4 mr-2" />
                Teklif Al
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Role-Based Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userRole === 'customer' && (
            <>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <FileText className="mr-2 h-5 w-5" />
                    Tekliflerim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Gönderdiğiniz teklif taleplerini takip edin
                  </p>
                  <Button 
                    onClick={handleDashboard}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard'a Git
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Kredi Bakiyem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Kredi bakiyenizi görüntüleyin ve yükleyin
                  </p>
                  <Button 
                    onClick={handleDashboard}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    Bakiye Görüntüle
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'printer' && (
            <>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <Building2 className="mr-2 h-5 w-5" />
                    Teklif Yönetimi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Gelen taleplere teklif verin ve yönetin
                  </p>
                  <Button 
                    onClick={handleDashboard}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                  >
                    Dashboard'a Git
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <Users className="mr-2 h-5 w-5" />
                    Müşteri Yönetimi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Müşterilerinizi ve siparişleri yönetin
                  </p>
                  <Button 
                    onClick={handleDashboard}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  >
                    Müşterileri Gör
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700">
                    <Shield className="mr-2 h-5 w-5" />
                    Sistem Yönetimi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Platform ayarlarını ve kullanıcıları yönetin
                  </p>
                  <Button 
                    onClick={handleDashboard}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Admin Panel
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-indigo-700">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Platform Raporları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Detaylı analitik ve platform raporları
                  </p>
                  <Button 
                    onClick={handleDashboard}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    Raporları Gör
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Common Cards */}
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-700">
                <User className="mr-2 h-5 w-5" />
                Profil Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Hesap bilgilerinizi güncelleyin
              </p>
              <Button 
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profili Düzenle
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Direct Panel Access for Testing */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Test Paneli - Direkt Erişim</h3>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => window.location.href = "/customer-dashboard"}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Müşteri Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = "/printer-dashboard"}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Matbaa Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = "/admin-dashboard"}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}