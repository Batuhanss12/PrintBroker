import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import QuoteCard from "@/components/QuoteCard";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Plus, 
  FileText, 
  Upload, 
  Palette, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function CustomerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/quotes"],
    enabled: isAuthenticated && user?.role === 'customer',
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && user?.role === 'customer',
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingQuotes = quotes?.filter((q: any) => q.status === 'pending') || [];
  const receivedQuotes = quotes?.filter((q: any) => q.status === 'received_quotes') || [];
  const completedOrders = orders?.filter((o: any) => o.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 rounded-2xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <FileText className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
                <p className="text-blue-100">Müşteri Hesabı</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100">Mevcut Kredi</p>
              <p className="text-2xl font-bold">₺{user.creditBalance}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-900">Hızlı İşlemler</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/quote/sheet_label">
              <Button variant="outline" className="flex items-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200 w-full justify-start">
                <Plus className="text-primary text-2xl mr-3" />
                <div className="text-left">
                  <h5 className="font-semibold text-gray-900">Yeni Teklif</h5>
                  <p className="text-sm text-gray-600">Teklif talebi oluştur</p>
                </div>
              </Button>
            </Link>
            
            <Button variant="outline" className="flex items-center p-4 h-auto bg-orange-50 hover:bg-orange-100 border-orange-200 w-full justify-start">
              <Palette className="text-orange-500 text-2xl mr-3" />
              <div className="text-left">
                <h5 className="font-semibold text-gray-900">Tasarım Yap</h5>
                <p className="text-sm text-gray-600">Otomatik tasarım</p>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200 w-full justify-start">
              <Upload className="text-green-500 text-2xl mr-3" />
              <div className="text-left">
                <h5 className="font-semibold text-gray-900">Dosya Yükle</h5>
                <p className="text-sm text-gray-600">Hazır dosyalarım</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Bekleyen Teklifler"
            value={pendingQuotes.length}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatsCard
            title="Alınan Teklifler"
            value={receivedQuotes.length}
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatsCard
            title="Tamamlanan"
            value={completedOrders.length}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatsCard
            title="Toplam Teklif"
            value={quotes?.length || 0}
            icon={<FileText className="h-5 w-5 text-gray-600" />}
            color="bg-gray-50"
          />
        </div>

        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Son Teklifler</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                Tümünü Gör
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : quotes && quotes.length > 0 ? (
              <div className="space-y-3">
                {quotes.slice(0, 5).map((quote: any) => (
                  <QuoteCard key={quote.id} quote={quote} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz teklif talebiniz bulunmuyor.</p>
                <Link href="/quote/sheet_label">
                  <Button className="mt-4">
                    İlk Teklifinizi Oluşturun
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
