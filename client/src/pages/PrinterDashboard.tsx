import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InkDropletsLoader, StackedPapersLoader } from "@/components/PrintingLoaders";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import ContractManager from "@/components/ContractManager";
import ReportsAndAnalytics from "@/components/ReportsAndAnalytics";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Clock, 
  CheckCircle, 
  Star, 
  TrendingUp,
  FileText,
  AlertCircle,
  Eye,
  X,
  Check
} from "lucide-react";
import { useState } from "react";

export default function PrinterDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    estimatedDays: '',
    notes: ''
  });

  // Enhanced authentication handling
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Oturum Sonlandı",
        description: "Lütfen tekrar giriş yapın",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/?login=required";
      }, 1500);
      return;
    }
    
    // Additional role check
    if (!isLoading && user && user.role !== 'printer') {
      toast({
        title: "Erişim Hatası",
        description: "Bu sayfaya erişim yetkiniz bulunmuyor",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: availableQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/quotes"],
    enabled: isAuthenticated && user?.role === 'printer',
  });

  const { data: myQuotes, isLoading: myQuotesLoading } = useQuery({
    queryKey: ["/api/printer-quotes"],
    enabled: isAuthenticated && user?.role === 'printer',
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && user?.role === 'printer',
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (data: { quoteId: string; price: string; estimatedDays: string; notes: string }) => {
      await apiRequest('POST', `/api/quotes/${data.quoteId}/printer-quotes`, {
        price: parseFloat(data.price),
        estimatedDays: parseInt(data.estimatedDays),
        notes: data.notes
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Teklifiniz başarıyla gönderildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/printer-quotes"] });
      setSelectedQuote(null);
      setQuoteForm({ price: '', estimatedDays: '', notes: '' });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Hata",
        description: "Teklif gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'printer') {
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

  const handleSubmitQuote = () => {
    if (!selectedQuote || !quoteForm.price || !quoteForm.estimatedDays) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    submitQuoteMutation.mutate({
      quoteId: selectedQuote.id,
      ...quoteForm
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Beklemede", variant: "secondary" },
      received_quotes: { label: "Teklifler Alındı", variant: "outline" },
      approved: { label: "Onaylandı", variant: "default" },
      in_progress: { label: "Üretimde", variant: "outline" },
      completed: { label: "Tamamlandı", variant: "default" },
      cancelled: { label: "İptal", variant: "destructive" }
    };

    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingQuotes = availableQuotes?.filter((q: any) => q.status === 'pending') || [];
  const activeOrders = orders?.filter((o: any) => ['in_production', 'shipped'].includes(o.status)) || [];
  const completedOrders = orders?.filter((o: any) => o.status === 'delivered') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <Building2 className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user.companyName || `${user.firstName} ${user.lastName}`}</h3>
                <p className="text-orange-100">
                  {user.subscriptionStatus === 'active' ? 'Premium Üyelik' : 'Temel Üyelik'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-100">Puanınız</p>
              <p className="text-2xl font-bold">{user.rating || '0.0'}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Bekleyen Teklifler"
            value={pendingQuotes.length}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatsCard
            title="Tamamlanan"
            value={completedOrders.length}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatsCard
            title="Değerlendirme"
            value={user.rating || '0.0'}
            icon={<Star className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatsCard
            title="Aktif Projeler"
            value={activeOrders.length}
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="contracts">Sözleşmeler</TabsTrigger>
            <TabsTrigger value="reports">Raporlar</TabsTrigger>
            <TabsTrigger value="orders">Siparişler</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* New Quote Requests */}
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Yeni Teklif Talepleri</CardTitle>
              <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-700">
                Tümünü Gör
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : pendingQuotes.length > 0 ? (
              <div className="space-y-4">
                {pendingQuotes.map((quote: any) => (
                  <div key={quote.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="text-gray-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{quote.title}</h5>
                          <p className="text-sm text-gray-600">{quote.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(quote.status)}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>

                    {quote.specifications && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        {Object.entries(quote.specifications as Record<string, any>).slice(0, 4).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-gray-600 capitalize">{key}</p>
                            <p className="font-medium">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQuote(quote)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detayları Gör
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reddet
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedQuote(quote)}
                          className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                          Teklif Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Şu anda bekleyen teklif talebi bulunmuyor.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Submission Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Teklif Ver - {selectedQuote.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuote(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price">Fiyat (₺)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Teklif fiyatınızı girin"
                    value={quoteForm.price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedDays">Tahmini Süre (Gün)</Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    placeholder="Teslim süresi"
                    value={quoteForm.estimatedDays}
                    onChange={(e) => setQuoteForm({ ...quoteForm, estimatedDays: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ek bilgiler ve özel notlar"
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedQuote(null)}
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleSubmitQuote}
                    disabled={submitQuoteMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {submitQuoteMutation.isPending ? (
                      "Gönderiliyor..."
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Teklifi Gönder
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
          </TabsContent>

          <TabsContent value="contracts">
            <ContractManager userRole="printer" />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsAndAnalytics />
          </TabsContent>



          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Yönetimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş Takip Sistemi</h3>
                  <p className="text-gray-600">Sipariş durumu, teslimat takibi ve müşteri bildirimleri.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}