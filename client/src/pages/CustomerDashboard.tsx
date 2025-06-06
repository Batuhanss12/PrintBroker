import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PrinterLoader, RollingPaperLoader } from "@/components/PrintingLoaders";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import QuoteCard from "@/components/QuoteCard";
import StatsCard from "@/components/StatsCard";
import Chat from "@/components/Chat";
import DesignEngine from "@/components/DesignEngine";
import FileManager from "@/components/FileManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { 
  Plus, 
  FileText, 
  Upload, 
  Palette, 
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  LayoutGrid,
  Disc,
  Printer,
  Eye,
  Download,
  Trash2,
  Image as ImageIcon
} from "lucide-react";

export default function CustomerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDesignDialogOpen, setIsDesignDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
    if (!isLoading && user && user.role !== 'customer') {
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

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/quotes"],
    enabled: isAuthenticated,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/chat/unread-count"],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && user?.role === 'customer',
  });

  const { data: designHistory, isLoading: designsLoading } = useQuery({
    queryKey: ["/api/designs/history"],
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

  const pendingQuotes = Array.isArray(quotes) ? quotes.filter((q: any) => q.status === 'pending') : [];
  const receivedQuotes = Array.isArray(quotes) ? quotes.filter((q: any) => q.status === 'received_quotes') : [];
  const completedOrders = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'completed') : [];

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

        {/* Tabs for Dashboard Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="designs">Tasarımlarım</TabsTrigger>
            <TabsTrigger value="files">Dosyalarım</TabsTrigger>
            <TabsTrigger value="quotes">Tekliflerim</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Teklif Türleri */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Teklif Talep Et</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/quote/sheet_label">
                  <Button variant="outline" className="flex items-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200 w-full justify-start">
                    <LayoutGrid className="text-blue-500 text-2xl mr-3" />
                    <div className="text-left">
                      <h5 className="font-semibold text-gray-900">Tabaka Etiket</h5>
                      <p className="text-sm text-gray-600">A3/A4 profesyonel etiket</p>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/quote/roll_label">
                  <Button variant="outline" className="flex items-center p-4 h-auto bg-orange-50 hover:bg-orange-100 border-orange-200 w-full justify-start">
                    <Disc className="text-orange-500 text-2xl mr-3" />
                    <div className="text-left">
                      <h5 className="font-semibold text-gray-900">Rulo Etiket</h5>
                      <p className="text-sm text-gray-600">Termal & yapışkanlı</p>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/quote/general_printing">
                  <Button variant="outline" className="flex items-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200 w-full justify-start">
                    <Printer className="text-green-500 text-2xl mr-3" />
                    <div className="text-left">
                      <h5 className="font-semibold text-gray-900">Genel Baskı</h5>
                      <p className="text-sm text-gray-600">Katalog, broşür, kartvizit</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hızlı İşlemler */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Hızlı İşlemler</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/payment">
                  <Button variant="outline" className="flex items-center p-4 h-auto bg-green-50 hover:bg-green-100 border-green-200 w-full justify-start">
                    <Plus className="text-green-500 text-2xl mr-3" />
                    <div className="text-left">
                      <h5 className="font-semibold text-gray-900">Kredi Yükle</h5>
                      <p className="text-sm text-gray-600">Bakiye yükle</p>
                    </div>
                  </Button>
                </Link>
                
                <Dialog open={isDesignDialogOpen} onOpenChange={setIsDesignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center p-4 h-auto bg-purple-50 hover:bg-purple-100 border-purple-200 w-full justify-start">
                      <Palette className="text-purple-500 text-2xl mr-3" />
                      <div className="text-left">
                        <h5 className="font-semibold text-gray-900">Tasarım Yap</h5>
                        <p className="text-sm text-gray-600">Otomatik tasarım</p>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>AI Tasarım Motoru</DialogTitle>
                    </DialogHeader>
                    <div className="h-full overflow-y-auto">
                      <DesignEngine />
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline" className="flex items-center p-4 h-auto bg-blue-50 hover:bg-blue-100 border-blue-200 w-full justify-start">
                  <Upload className="text-blue-500 text-2xl mr-3" />
                  <div className="text-left">
                    <h5 className="font-semibold text-gray-900">Dosya Yükle</h5>
                    <p className="text-sm text-gray-600">Hazır dosyalarım</p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                title="Tamamlanan İşler"
                value={completedOrders.length}
                icon={<CheckCircle className="h-5 w-5 text-green-600" />}
                color="bg-green-50"
              />
              <StatsCard
                title="Toplam Tasarım"
                value={designHistory && typeof designHistory === 'object' && 'total' in designHistory ? designHistory.total : 0}
                icon={<Palette className="h-5 w-5 text-purple-600" />}
                color="bg-purple-50"
              />
            </div>

            {/* Son Teklifler */}
            <Card>
              <CardHeader>
                <CardTitle>Son Tekliflerim</CardTitle>
              </CardHeader>
              <CardContent>
                {quotesLoading ? (
                  <div className="flex justify-center py-8">
                    <PrinterLoader size={100} color="#3B82F6" />
                  </div>
                ) : Array.isArray(quotes) && quotes.length > 0 ? (
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
          </TabsContent>

          <TabsContent value="designs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Tasarım Geçmişim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {designsLoading ? (
                  <div className="flex justify-center py-8">
                    <RollingPaperLoader size={100} color="#8B5CF6" />
                  </div>
                ) : designHistory && typeof designHistory === 'object' && 'designs' in designHistory && Array.isArray(designHistory.designs) && designHistory.designs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {designHistory.designs.map((design: any, index: number) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="aspect-square relative">
                          {design.result && design.result.data && design.result.data[0] ? (
                            <img 
                              src={design.result.data[0].url} 
                              alt={design.prompt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {design.prompt}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {new Date(design.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz tasarımınız yok</h3>
                    <p className="text-gray-600 mb-6">AI ile ilk tasarımınızı oluşturun</p>
                    <Dialog open={isDesignDialogOpen} onOpenChange={setIsDesignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Palette className="h-4 w-4 mr-2" />
                          Tasarım Yap
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>AI Tasarım Motoru</DialogTitle>
                        </DialogHeader>
                        <div className="h-full overflow-y-auto">
                          <DesignEngine />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tüm Tekliflerim
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quotesLoading ? (
                  <div className="flex justify-center py-8">
                    <PrinterLoader size={100} color="#3B82F6" />
                  </div>
                ) : Array.isArray(quotes) && quotes.length > 0 ? (
                  <div className="space-y-4">
                    {quotes.map((quote: any) => (
                      <QuoteCard key={quote.id} quote={quote} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz teklif talebiniz yok</h3>
                    <p className="text-gray-600 mb-6">İlk teklif talebinizi oluşturun</p>
                    <Link href="/quote/sheet_label">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Teklif Talep Et
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <FileManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="sm"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      {/* Chat Component */}
      {isChatOpen && (
        <Chat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          customerId={user.id}
        />
      )}
    </div>
  );
}