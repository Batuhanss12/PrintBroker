import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  Settings, 
  FileImage, 
  Trash2, 
  Download, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Info,
  Layout,
  Target,
  Sparkles,
  Clock
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Design {
  id: string;
  name: string;
  originalName: string;
  filename: string;
  dimensions: string;
  realDimensionsMM: string;
  thumbnailPath?: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  size: number;
  fileSize: string;
  uploadedAt: string;
  colorProfile?: string;
  hasTransparency?: boolean;
  resolution?: number;
  contentPreserved?: boolean;
  processingStatus?: 'pending' | 'success' | 'error';
  processingNotes?: string;
}

interface PlotterSettings {
  sheetWidth: number;
  sheetHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelWidth: number;
  labelHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

interface Arrangement {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  designName?: string;
  isFullPage?: boolean;
}

interface ArrangementResponse {
  arrangements: Arrangement[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  sheetDimensions: { width: number; height: number };
  wasteArea: number;
}

interface ArrangementItem {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  withMargins: {
    width: number;
    height: number;
  };
}

interface ArrangementResult {
  arrangements: ArrangementItem[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  usedArea: {
    width: number;
    height: number;
  };
}

interface FileUploadResponse {
  success: boolean;
  message: string;
  file?: Design;
}

export default function AutomationPanelFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [arrangements, setArrangements] = useState<ArrangementItem[]>([]);
  const [isArranging, setIsArranging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [plotterSettingsState, setPlotterSettings] = useState<PlotterSettings>({
    sheetWidth: 330,
    sheetHeight: 480,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    labelWidth: 50,
    labelHeight: 30,
    horizontalSpacing: 2,
    verticalSpacing: 2,
  });

  // API request helper
  const apiRequest = async (method: string, url: string, data?: any) => {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    if (data) {
      if (data instanceof FormData) {
        delete options.headers;
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`${response.status}: ${errorData.message || 'Request failed'}`);
    }
    return response.json();
  };

  // Fetch designs
  const { data: designs = [], isLoading: designsLoading, error: designsError, refetch } = useQuery({
    queryKey: ['automation-designs'],
    queryFn: () => apiRequest('GET', '/api/automation/plotter/designs'),
  });

  // Handle errors
  const handleError = (error: unknown, context: string) => {
    console.error(`${context}:`, error);
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
    toast({
      title: context,
      description: message,
      variant: "destructive",
    });
  };

  // Tek tuş otomatik dizim mutation
  const oneClickLayoutMutation = useMutation({
    mutationFn: async () => {
      if (!designs || designs.length === 0) {
        throw new Error("Dizim için en az bir tasarım gerekli");
      }

      setIsArranging(true);
      const designIds = designs.map((d: Design) => d.id);

      const result = await apiRequest('POST', '/api/automation/plotter/one-click-layout', {
        designIds,
        sheetSettings: {
          width: plotterSettingsState.sheetWidth,
          height: plotterSettingsState.sheetHeight,
          margin: plotterSettingsState.marginTop,
          bleedMargin: 3
        },
        cuttingSettings: {
          enabled: true,
          markLength: 5,
          markWidth: 0.25
        }
      });

      return result;
    },
    onSuccess: (data) => {
      console.log('Tek tuş dizim tamamlandı:', data);
      setArrangements(data.arrangements);
      setIsArranging(false);

      toast({
        title: "Tek Tuş Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım profesyonel olarak dizildi (${data.efficiency} verimlilik)`,
      });

      if (data.pdfPath) {
        console.log('PDF otomatik oluşturuldu, indiriliyor...');
        const link = document.createElement('a');
        link.href = `/uploads/${data.pdfPath.split('/').pop()}`;
        link.download = `matbixx-tek-tus-dizim-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        
        toast({
          title: "PDF Hazır",
          description: "Profesyonel dizim PDF'i otomatik olarak indiriliyor...",
        });
      }
    },
    onError: (error: unknown) => {
      setIsArranging(false);
      handleError(error, "Tek tuş dizim başarısız");
    },
  });

  // File upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('designs', file);
    });

    uploadMutation.mutate(formData);
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('POST', '/api/automation/plotter/upload-designs', formData);
    },
    onSuccess: (data) => {
      toast({
        title: "Yükleme Başarılı",
        description: `${data.files?.length || 0} dosya başarıyla yüklendi`,
      });
      queryClient.invalidateQueries({ queryKey: ['automation-designs'] });
      setSelectedDesigns(data.files?.map((f: any) => f.id) || []);
    },
    onError: (error: unknown) => {
      handleError(error, "Dosya yükleme başarısız");
    },
  });

  // Select all designs when they load
  useEffect(() => {
    if (designs && designs.length > 0) {
      setSelectedDesigns(designs.map((d: Design) => d.id));
    }
  }, [designs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
          <Layout className="h-10 w-10 text-blue-600" />
          Profesyonel Otomatik Dizilim Sistemi
        </h1>
        <p className="text-lg text-gray-600">
          Vektörel dosyalarınızı yükleyin, akıllı algoritma ile otomatik yerleştirin ve profesyonel PDF çıktısı alın
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* File Upload Section */}
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Upload className="h-6 w-6" />
                Profesyonel Dosya Yükleme Sistemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.svg,.ai,.eps,application/pdf,image/svg+xml,application/postscript"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="mb-4">
                  <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Vektörel Dosyalarınızı Yükleyin
                  </h3>
                  <p className="text-gray-600 mb-6">
                    PDF, SVG, AI, EPS formatları desteklenir. Dosya içeriği analiz edilir ve korunur.
                  </p>
                </div>

                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  size="lg"
                  className="mb-6"
                >
                  {uploadMutation.isPending ? "Analiz Ediliyor..." : "Dosya Seç ve Yükle"}
                </Button>

                {uploadMutation.isPending && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2">
                      Dosyalar analiz ediliyor ve işleniyor...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Designs List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Yüklenen Tasarımlar ({designs.length})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={designsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${designsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tasarım dosyaları yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {selectedDesigns.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-blue-800 font-medium">
                          {selectedDesigns.length} tasarım seçildi ve dizilim için hazır
                        </p>
                      </div>
                    </div>
                  )}

                  {designs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Henüz dosya yüklenmedi
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {designs.map((design: Design) => (
                        <div key={design.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm truncate">{design.originalName}</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Boyut: {design.realDimensionsMM || 'Tespit edilemiyor'}</div>
                            <div>Dosya: {design.fileSize}</div>
                            {design.colorProfile && <div>Renk: {design.colorProfile}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tek Tuş Otomatik Dizim - Premium Feature */}
          <Card className="border-2 border-gradient-to-r from-purple-500 to-blue-600 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Sparkles className="h-6 w-6" />
                Tek Tuş Profesyonel Dizim Sistemi
              </CardTitle>
              <p className="text-sm text-purple-600 mt-2">
                Yapay zeka destekli tam otomatik dizim: dosya analizi + yerleştirme + PDF üretimi
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => oneClickLayoutMutation.mutate()}
                  disabled={selectedDesigns.length === 0 || isArranging}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  size="lg"
                >
                  {isArranging ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Profesyonel sistem çalışıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Tek Tuş Otomatik Dizim
                    </>
                  )}
                </Button>

                <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded-lg">
                  <div className="font-medium mb-1">Bu sistem otomatik olarak:</div>
                  <div className="space-y-1">
                    <div>• Dosya içeriğini analiz eder ve boyutları tespit eder</div>
                    <div>• 3mm kesim payı ile optimal yerleştirme yapar</div>
                    <div>• Profesyonel PDF çıktısını otomatik oluşturur</div>
                    <div>• Maksimum verimlilik için rotation algoritması kullanır</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Plotter Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sheetWidth" className="text-xs font-medium">Sayfa Genişlik (mm)</Label>
                  <Input
                    id="sheetWidth"
                    type="number"
                    value={plotterSettingsState.sheetWidth}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      sheetWidth: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="sheetHeight" className="text-xs font-medium">Sayfa Yükseklik (mm)</Label>
                  <Input
                    id="sheetHeight"
                    type="number"
                    value={plotterSettingsState.sheetHeight}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      sheetHeight: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Dosya Analizi:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Aktif
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>PDF Üretimi:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Hazır
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Yüklenen Dosya:</span>
                  <span className="text-blue-600">{designs.length}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Seçili Dosya:</span>
                  <span className="text-green-600">{selectedDesigns.length}</span>
                </div>
                {arrangements.length > 0 && (
                  <div className="flex justify-between items-center font-medium">
                    <span>Yerleştirilen:</span>
                    <span className="text-purple-600">{arrangements.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}