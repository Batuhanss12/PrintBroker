import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Settings } from "lucide-react";
import { Link } from "wouter";

export default function AdminAutomation() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Erişim Reddedildi</CardTitle>
            <CardDescription>Admin paneline erişim için giriş yapmanız gerekiyor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Ana Sayfaya Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin-dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Otomasyonlar</h1>
          <p className="text-gray-600 mt-2">Admin panel otomasyonları ve araçları</p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dosya İşlemleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Dosya İşlemleri
              </CardTitle>
              <CardDescription>PDF ve tasarım dosyalarının yönetimi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Yüklenen dosyaları görüntüleyin ve yönetin
                </p>
                <Button variant="outline" className="w-full">
                  Dosyaları Görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sistem Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Sistem Ayarları
              </CardTitle>
              <CardDescription>Platform yapılandırma seçenekleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Sistem parametrelerini ve ayarlarını düzenleyin
                </p>
                <Button variant="outline" className="w-full">
                  Ayarları Aç
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sistem Durumu */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Durumu</CardTitle>
              <CardDescription>Platform sağlık kontrolü</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database:</span>
                  <span className="text-sm font-medium text-green-600">Aktif</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">API:</span>
                  <span className="text-sm font-medium text-green-600">Çalışıyor</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Storage:</span>
                  <span className="text-sm font-medium text-green-600">Erişilebilir</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}