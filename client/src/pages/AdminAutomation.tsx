import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, FileText, Download, Play, Users, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  completedContracts: number;
  lastGenerated: string;
}

interface AutomationSettings {
  autoGenerateContracts: boolean;
  requireApproval: boolean;
  emailNotifications: boolean;
  pdfGeneration: boolean;
}

export default function AdminAutomation() {
  const { toast } = useToast();
  
  const [contractStats, setContractStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    lastGenerated: new Date().toISOString()
  });
  
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    autoGenerateContracts: true,
    requireApproval: false,
    emailNotifications: true,
    pdfGeneration: true
  });
  
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [testOrderId, setTestOrderId] = useState('');
  const [testCustomerId, setTestCustomerId] = useState('');
  const [testPrinterId, setTestPrinterId] = useState('');

  useEffect(() => {
    loadContractStats();
    loadAutomationSettings();
  }, []);

  const loadContractStats = async () => {
    try {
      const response = await fetch('/api/admin/contracts');
      if (response.ok) {
        const contracts = await response.json();
        
        const stats = {
          totalContracts: contracts.length,
          activeContracts: contracts.filter((c: any) => c.status === 'active').length,
          pendingContracts: contracts.filter((c: any) => c.status === 'pending' || c.status === 'draft').length,
          completedContracts: contracts.filter((c: any) => c.status === 'fully_approved').length,
          lastGenerated: contracts[0]?.createdAt || new Date().toISOString()
        };
        
        setContractStats(stats);
      }
    } catch (error) {
      console.error('Sözleşme istatistikleri yüklenemedi:', error);
    }
  };

  const loadAutomationSettings = () => {
    // Local storage'dan ayarları yükle
    const saved = localStorage.getItem('contractAutomationSettings');
    if (saved) {
      setAutomationSettings(JSON.parse(saved));
    }
  };

  const updateAutomationSetting = (key: keyof AutomationSettings, value: boolean) => {
    const newSettings = { ...automationSettings, [key]: value };
    setAutomationSettings(newSettings);
    localStorage.setItem('contractAutomationSettings', JSON.stringify(newSettings));
    
    toast({
      title: "Ayar Güncellendi",
      description: `${key} ${value ? 'aktifleştirildi' : 'deaktifleştirildi'}`,
    });
  };

  const generateTestContract = async () => {
    if (!testOrderId || !testCustomerId || !testPrinterId) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingContract(true);
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: testOrderId,
          customerId: testCustomerId,
          printerId: testPrinterId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Sözleşme Oluşturuldu",
          description: `Sözleşme ID: ${data.contractId}`,
        });
        
        // İstatistikleri yenile
        await loadContractStats();
        
        // Formu temizle
        setTestOrderId('');
        setTestCustomerId('');
        setTestPrinterId('');
      } else {
        toast({
          title: "Sözleşme Oluşturulamadı",
          description: data.message || "Bilinmeyen hata",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bağlantı Hatası",
        description: "Sözleşme servisi erişilemez durumda",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContract(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Otomatik Sözleşme Oluşturma</h1>
          <p className="text-muted-foreground">
            Sipariş tamamlandığında otomatik sözleşme oluşturma sistemini yönetin
          </p>
        </div>
        <Badge variant={automationSettings.autoGenerateContracts ? "default" : "secondary"}>
          {automationSettings.autoGenerateContracts ? "Aktif" : "Pasif"}
        </Badge>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sözleşme</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractStats.totalContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Sözleşmeler</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{contractStats.activeContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{contractStats.pendingContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{contractStats.completedContracts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Otomasyon Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle>Otomasyon Ayarları</CardTitle>
          <CardDescription>
            Otomatik sözleşme oluşturma sisteminin davranışını yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-generate">Otomatik Sözleşme Oluşturma</Label>
              <p className="text-sm text-muted-foreground">
                Sipariş tamamlandığında otomatik olarak sözleşme oluştur
              </p>
            </div>
            <Switch
              id="auto-generate"
              checked={automationSettings.autoGenerateContracts}
              onCheckedChange={(checked) => updateAutomationSetting('autoGenerateContracts', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-approval">Admin Onayı Gerekli</Label>
              <p className="text-sm text-muted-foreground">
                Sözleşmeler oluşturulmadan önce admin onayı iste
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={automationSettings.requireApproval}
              onCheckedChange={(checked) => updateAutomationSetting('requireApproval', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Sözleşme oluşturulduğunda taraflara e-posta gönder
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={automationSettings.emailNotifications}
              onCheckedChange={(checked) => updateAutomationSetting('emailNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pdf-generation">PDF Oluşturma</Label>
              <p className="text-sm text-muted-foreground">
                Sözleşmeleri otomatik PDF formatında oluştur
              </p>
            </div>
            <Switch
              id="pdf-generation"
              checked={automationSettings.pdfGeneration}
              onCheckedChange={(checked) => updateAutomationSetting('pdfGeneration', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Sözleşme Oluşturma */}
      <Card>
        <CardHeader>
          <CardTitle>Test Sözleşme Oluşturma</CardTitle>
          <CardDescription>
            Sistem testleri için manuel sözleşme oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order-id">Sipariş ID</Label>
              <Input
                id="order-id"
                placeholder="Örn: order_123"
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-id">Müşteri ID</Label>
              <Input
                id="customer-id"
                placeholder="Örn: customer_456"
                value={testCustomerId}
                onChange={(e) => setTestCustomerId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="printer-id">Matbaacı ID</Label>
              <Input
                id="printer-id"
                placeholder="Örn: printer_789"
                value={testPrinterId}
                onChange={(e) => setTestPrinterId(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={generateTestContract}
            disabled={isGeneratingContract}
            className="w-full md:w-auto"
          >
            {isGeneratingContract ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sözleşme Oluşturuluyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test Sözleşmesi Oluştur
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sistem Durumu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Sistem Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Sözleşme Servisi:</span>
              <Badge variant="default">Aktif</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>PDF Oluşturma:</span>
              <Badge variant="default">Çalışıyor</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Veritabanı:</span>
              <Badge variant="default">Bağlı</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Son Sözleşme:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(contractStats.lastGenerated).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-center text-sm text-muted-foreground">
        Otomatik sözleşme oluşturma sistemi aktif ve çalışır durumda
      </div>
    </div>
  );
}