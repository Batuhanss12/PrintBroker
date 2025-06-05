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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Info
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Design {
  id: string;
  name: string;
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
  withMargins?: {
    width: number;
    height: number;
  };
}

interface ArrangementResponse {
  arrangements: Arrangement[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  usedArea: {
    width: number;
    height: number;
  };
}

export default function AutomationPanelNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [isArranging, setIsArranging] = useState(false);
  const [previewMode, setPreviewMode] = useState<'list' | 'grid'>('grid');
  const [plotterSettings, setPlotterSettings] = useState<PlotterSettings>({
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

  // API functions
  const apiRequest = async (method: string, url: string, data?: any) => {
    const options: RequestInit = {
      method,
      credentials: 'include',
      headers: {} as Record<string, string>,
    };

    if (data instanceof FormData) {
      options.body = data;
    } else if (data) {
      (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  // File validation function
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'image/svg+xml',
      'application/postscript',
      'application/eps',
      'image/eps'
    ];

    const allowedExtensions = ['.pdf', '.svg', '.ai', '.eps'];
    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (file.size > maxSize) {
      return { isValid: false, error: 'Dosya boyutu 50MB\'dan büyük olamaz' };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'Dosya boş olamaz' };
    }

    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.includes(`.${fileExtension}`);

    if (!isValidType) {
      return { isValid: false, error: 'Sadece vektörel dosyalar (PDF, SVG, AI, EPS) kabul edilir' };
    }

    return { isValid: true };
  };

  // Fetch designs query
  const { data: designs = [], isLoading: designsLoading, error: designsError, refetch } = useQuery({
    queryKey: ['/api/automation/plotter/designs'],
    queryFn: () => apiRequest('GET', '/api/automation/plotter/designs'),
    staleTime: 30000,
    retry: 2,
  });

  // Upload designs mutation
  const uploadDesignsMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<{ designs: Design[] }> => {
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const result = await apiRequest('POST', '/api/automation/plotter/upload-designs', formData);
        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => setUploadProgress(0), 1000);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.designs && data.designs.length > 0) {
        const newDesignIds = data.designs.map(d => d.id);
        setSelectedDesigns(prev => [...prev, ...newDesignIds]);

        toast({
          title: "Başarılı",
          description: `${data.designs.length} dosya yüklendi ve içeriği korundu.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Yükleme Hatası",
        description: error.message || "Dosyalar yüklenemedi",
        variant: "destructive",
      });
    },
  });

  // Auto arrange mutation
  const autoArrangeMutation = useMutation({
    mutationFn: async ({ designIds, plotterSettings }: { designIds: string[]; plotterSettings: PlotterSettings }): Promise<ArrangementResponse> => {
      setIsArranging(true);
      return apiRequest('POST', '/api/automation/plotter/auto-arrange', { designIds, plotterSettings });
    },
    onSuccess: (data) => {
      setArrangements(data.arrangements);
      setIsArranging(false);
      toast({
        title: "Dizilim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi. Verimlilik: ${data.efficiency}`,
      });
    },
    onError: (error: any) => {
      setIsArranging(false);
      toast({
        title: "Dizilim Hatası",
        description: error.message || "Otomatik dizilim başarısız",
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/automation/plotter/generate-enhanced-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plotterSettings,
          arrangements,
          qualitySettings: {
            dpi: 300,
            colorProfile: 'CMYK',
            preserveVectorData: true
          },
          cuttingMarks: {
            enabled: true,
            length: 5,
            offset: 3,
            lineWidth: 0.25
          },
          bleedSettings: {
            top: 3,
            bottom: 3,
            left: 3,
            right: 3
          }
        }),
      });

      if (!response.ok) {
        throw new Error('PDF oluşturulamadı');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matbixx-layout-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF İndirildi",
        description: "Professional layout PDF'i başarıyla oluşturuldu.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "PDF Hatası",
        description: error.message || "PDF oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  // Clear designs mutation
  const clearDesignsMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/automation/plotter/designs/clear'),
    onSuccess: () => {
      setSelectedDesigns([]);
      setArrangements([]);
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      toast({
        title: "Temizlendi",
        description: "Tüm tasarım dosyaları temizlendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Temizleme Hatası",
        description: error.message || "Dosyalar temizlenemedi",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Dosya Doğrulama Hatası",
        description: errors.join(', '),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('designs', file);
      });
      uploadDesignsMutation.mutate(formData);
    }

    // Reset input
    event.target.value = '';
  }, [uploadDesignsMutation, toast]);

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesigns(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const handleAutoArrange = () => {
    if (selectedDesigns.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir tasarım seçin.",
        variant: "destructive",
      });
      return;
    }

    autoArrangeMutation.mutate({
      designIds: selectedDesigns,
      plotterSettings
    });
  };

  const selectAllDesigns = () => {
    if (selectedDesigns.length === designs.length) {
      setSelectedDesigns([]);
    } else {
      setSelectedDesigns(designs.map((d: Design) => d.id));
    }
  };

  // Design List Component
  const DesignList = ({ designs }: { designs: Design[] }) => {
    if (!designs || designs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Henüz tasarım dosyası yüklenmedi</p>
          <p className="text-sm">Vektörel dosyalarınızı yükleyin</p>
        </div>
      );
    }

    // Filter out invalid designs
    const validDesigns = designs.filter(design => 
      design && 
      typeof design === 'object' && 
      design.id && 
      design.name
    );

    return (
      <div className={`grid gap-3 ${previewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {validDesigns.map((design: Design) => (
          <div
            key={design.id}
            className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedDesigns.includes(design.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleDesignSelection(design.id)}
          >
            {/* Selection indicator */}
            {selectedDesigns.includes(design.id) && (
              <div className="absolute top-2 right-2 z-10">
                <CheckCircle className="h-5 w-5 text-blue-500 bg-white rounded-full" />
              </div>
            )}

            {/* File preview */}
            <div className="aspect-square mb-2 bg-gray-50 rounded border overflow-hidden">
              {design.mimeType === 'application/pdf' ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50 relative">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <span className="text-xs text-red-600 font-medium">PDF VEKTÖR</span>
                  </div>
                  {design.realDimensionsMM && (
                    <div className="absolute bottom-0 left-0 right-0 text-xs bg-black bg-opacity-75 text-white p-1 text-center">
                      {design.realDimensionsMM}
                    </div>
                  )}
                </div>
              ) : design.thumbnailPath ? (
                <img
                  src={design.thumbnailPath}
                  alt={design.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50">
                  <div className="text-center">
                    <div className="text-lg">🎨</div>
                    <span className="text-xs text-purple-600">
                      {design.name && typeof design.name === 'string' && design.name.includes('.') ? design.name.split('.').pop()?.toUpperCase() : 'DESIGN'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* File info */}
            <div className="space-y-1">
              <h4 className="font-medium text-sm truncate" title={design.name || 'Adsız dosya'}>
                {design.name || 'Adsız dosya'}
              </h4>

              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Boyut:</span>
                  <span className="font-medium text-blue-600">
                    {design.realDimensionsMM || design.dimensions}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Dosya:</span>
                  <span>{design.fileSize}</span>
                </div>

                {design.processingStatus && (
                  <div className="flex justify-between items-center">
                    <span>Durum:</span>
                    <Badge variant={design.processingStatus === 'success' ? 'default' : 'destructive'} className="text-xs">
                      {design.processingStatus === 'success' ? 'Hazır' : 'Hata'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Content preservation indicator */}
            {design.contentPreserved && (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  İçerik Korundu
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Otomatik Dizilim Sistemi
        </h1>
        <p className="text-gray-600">
          Vektörel dosyalarınızı yükleyin ve otomatik dizilim ile PDF oluşturun
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Dosya Yükleme ve İçerik Koruma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.svg,.ai,.eps,application/pdf,image/svg+xml,application/postscript"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Vektörel Dosyalarınızı Yükleyin
                </h3>
                <p className="text-gray-600 mb-4">
                  PDF, SVG, AI, EPS formatları desteklenir. Dosya içeriği korunur.
                </p>

                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadDesignsMutation.isPending}
                  className="mb-4"
                >
                  {uploadDesignsMutation.isPending ? "Yükleniyor..." : "Dosya Seç"}
                </Button>

                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-600 mt-2">
                      Yükleniyor: %{uploadProgress.toFixed(0)}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4 space-y-1">
                  <div>✓ Maksimum dosya boyutu: 50MB</div>
                  <div>✓ İçerik analizi ve boyut tespiti</div>
                  <div>✓ Otomatik önizleme oluşturma</div>
                  <div>✓ Vektör kalitesi korunur</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Tasarım Dosyaları ({designs.length})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(previewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {previewMode === 'grid' ? <Eye className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllDesigns}
                    disabled={designs.length === 0}
                  >
                    {selectedDesigns.length === designs.length ? "Hiçbirini Seçme" : "Tümünü Seç"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={designsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${designsLoading ? 'animate-spin' : ''}`} />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearDesignsMutation.mutate()}
                    disabled={designs.length === 0 || clearDesignsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
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
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {selectedDesigns.length} tasarım seçildi
                      </p>
                    </div>
                  )}

                  <DesignList designs={designs} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Auto Arrangement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Otomatik Dizilim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleAutoArrange}
                  disabled={selectedDesigns.length === 0 || isArranging}
                  className="w-full"
                  size="lg"
                >
                  {isArranging ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Diziliyor...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Otomatik Dizilim Başlat
                    </>
                  )}
                </Button>

                {arrangements.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Dizilen: {arrangements.length}</div>
                      <div>Seçilen: {selectedDesigns.length}</div>
                    </div>

                    <Button
                      onClick={() => generatePDFMutation.mutate()}
                      disabled={generatePDFMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {generatePDFMutation.isPending ? "PDF Oluşturuluyor..." : "Professional PDF İndir"}
                    </Button>
                  </div>
                )}
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
                  <Label htmlFor="sheetWidth" className="text-xs">Sayfa Genişlik (mm)</Label>
                  <Input
                    id="sheetWidth"
                    type="number"
                    value={plotterSettings.sheetWidth}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      sheetWidth: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="sheetHeight" className="text-xs">Sayfa Yükseklik (mm)</Label>
                  <Input
                    id="sheetHeight"
                    type="number"
                    value={plotterSettings.sheetHeight}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      sheetHeight: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="marginTop" className="text-xs">Üst Margin (mm)</Label>
                  <Input
                    id="marginTop"
                    type="number"
                    value={plotterSettings.marginTop}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      marginTop: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="marginBottom" className="text-xs">Alt Margin (mm)</Label>
                  <Input
                    id="marginBottom"
                    type="number"
                    value={plotterSettings.marginBottom}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      marginBottom: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="horizontalSpacing" className="text-xs">Yatay Aralık (mm)</Label>
                  <Input
                    id="horizontalSpacing"
                    type="number"
                    value={plotterSettings.horizontalSpacing}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      horizontalSpacing: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="verticalSpacing" className="text-xs">Dikey Aralık (mm)</Label>
                  <Input
                    id="verticalSpacing"
                    type="number"
                    value={plotterSettings.verticalSpacing}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      verticalSpacing: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Dosya Analizi:</span>
                  <Badge variant="outline" className="text-green-600">
                    Aktif
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>İçerik Koruma:</span>
                  <Badge variant="outline" className="text-green-600">
                    Aktif
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>PDF Üretimi:</span>
                  <Badge variant="outline" className="text-green-600">
                    Hazır
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Yüklenen Dosya:</span>
                  <span className="font-medium">{designs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seçili Dosya:</span>
                  <span className="font-medium">{selectedDesigns.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}