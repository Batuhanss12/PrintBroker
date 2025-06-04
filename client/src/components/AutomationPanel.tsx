import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Scissors, 
  Grid, 
  Download, 
  Play, 
  FileText,
  Layers,
  Ruler,
  RotateCcw,
  Save,
  Eye,
  Calculator,
  Zap,
  Upload,
  Image,
  Trash2,
  ArrowUpDown
} from "lucide-react";

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

interface LabelLayout {
  id: string;
  name: string;
  settings: PlotterSettings;
  labelsPerRow: number;
  labelsPerColumn: number;
  totalLabels: number;
  wastePercentage: number;
  createdAt: string;
}

export default function AutomationPanel() {
  const [activeTab, setActiveTab] = useState('plotter');
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
  const [previewMode, setPreviewMode] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const [uploadedDesigns, setUploadedDesigns] = useState<any[]>([]);
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [arrangements, setArrangements] = useState<any>(null);
  const [showCropMarks, setShowCropMarks] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved layouts
  const { data: savedLayouts = [] } = useQuery({
    queryKey: ['/api/automation/plotter/layouts'],
    queryFn: () => apiRequest('GET', '/api/automation/plotter/layouts'),
  });

  // Fetch uploaded designs
  const { data: designs = [] } = useQuery({
    queryKey: ['/api/automation/plotter/designs'],
    queryFn: () => apiRequest('GET', '/api/automation/plotter/designs'),
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: { name: string; settings: PlotterSettings }) => {
      return await apiRequest('POST', '/api/automation/plotter/save-layout', layout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/layouts'] });
      toast({
        title: "Başarılı",
        description: "Etiket düzeni kaydedildi.",
      });
      setLayoutName("");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Düzen kaydedilemedi.",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadDesignsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/automation/plotter/upload-designs', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Refresh designs list to get new uploads
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      
      // Auto-select uploaded designs for arrangement if data.designs exists
      if (data.designs && data.designs.length > 0) {
        const newDesignIds = data.designs.map((design: any) => design.id);
        setSelectedDesigns(prev => {
          const combined = [...prev, ...newDesignIds];
          return Array.from(new Set(combined));
        });
        
        toast({
          title: "Başarılı",
          description: `${data.designs.length} tasarım dosyası yüklendi ve seçildi.`,
        });

        // Auto-trigger arrangement after upload
        setTimeout(() => {
          autoArrangeMutation.mutate({
            designIds: newDesignIds,
            plotterSettings
          });
        }, 500);
      } else {
        toast({
          title: "Başarılı",
          description: "Dosyalar yüklendi.",
        });
      }
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Hata",
        description: error.message || "Dosya yüklenemedi.",
        variant: "destructive",
      });
    },
  });

  // Auto-arrange mutation
  const autoArrangeMutation = useMutation({
    mutationFn: async (data: { designIds: string[]; plotterSettings: PlotterSettings }) => {
      return await apiRequest('POST', '/api/automation/plotter/auto-arrange', data);
    },
    onSuccess: (data: any) => {
      setArrangements(data);
      toast({
        title: "Başarılı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi (${data.efficiency} verimlilik).`,
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Otomatik dizim başarısız.",
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (data: { plotterSettings: PlotterSettings; arrangements?: any[] }) => {
      const response = await fetch('/api/automation/plotter/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('PDF generation failed');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `etiket-dizimi-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Başarılı",
        description: "PDF oluşturuldu ve indiriliyor.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "PDF oluşturulamadı.",
        variant: "destructive",
      });
    },
  });

  const calculateLayout = () => {
    const usableWidth = plotterSettings.sheetWidth - plotterSettings.marginLeft - plotterSettings.marginRight;
    const usableHeight = plotterSettings.sheetHeight - plotterSettings.marginTop - plotterSettings.marginBottom;
    
    const labelsPerRow = Math.floor((usableWidth + plotterSettings.horizontalSpacing) / (plotterSettings.labelWidth + plotterSettings.horizontalSpacing));
    const labelsPerColumn = Math.floor((usableHeight + plotterSettings.verticalSpacing) / (plotterSettings.labelHeight + plotterSettings.verticalSpacing));
    
    const totalLabels = labelsPerRow * labelsPerColumn;
    const usedArea = totalLabels * plotterSettings.labelWidth * plotterSettings.labelHeight;
    const totalArea = usableWidth * usableHeight;
    const wastePercentage = ((totalArea - usedArea) / totalArea) * 100;

    return {
      labelsPerRow,
      labelsPerColumn,
      totalLabels,
      wastePercentage: Math.round(wastePercentage * 100) / 100,
      usableWidth,
      usableHeight
    };
  };

  const layout = calculateLayout();

  const updateSetting = (key: keyof PlotterSettings, value: number) => {
    setPlotterSettings(prev => ({ ...prev, [key]: value }));
  };

  const loadLayout = (savedLayout: LabelLayout) => {
    setPlotterSettings(savedLayout.settings);
    setLayoutName(savedLayout.name);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    
    // Add all selected files to FormData
    Array.from(files).forEach(file => {
      formData.append('designs', file);
    });

    uploadDesignsMutation.mutate(formData);
    
    // Reset file input
    event.target.value = '';
  };

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

  const PlotterPreview = () => {
    const { usableWidth, usableHeight } = layout;
    const scale = Math.min(600 / plotterSettings.sheetWidth, 400 / plotterSettings.sheetHeight);
    
    // Get arranged designs if available
    const arrangedDesigns = arrangements && arrangements.arrangements ? arrangements.arrangements : [];
    
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Tasarım Dizimi Önizlemesi</h3>
          <div className="flex gap-2">
            <div className="text-xs text-gray-600">
              Ölçek: 1:{Math.round(1/scale)}
            </div>
            {showCropMarks && (
              <div className="text-xs text-green-600">
                ✓ Kesim İşaretleri
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center overflow-auto">
          <div 
            className="border-2 border-gray-800 bg-white relative shadow-lg"
            style={{
              width: plotterSettings.sheetWidth * scale,
              height: plotterSettings.sheetHeight * scale,
              minWidth: plotterSettings.sheetWidth * scale,
              minHeight: plotterSettings.sheetHeight * scale,
            }}
          >
            {/* Crop marks if enabled */}
            {showCropMarks && (
              <>
                {/* Corner crop marks */}
                {[
                  { x: 0, y: 0 }, // Top-left
                  { x: plotterSettings.sheetWidth * scale - 10, y: 0 }, // Top-right
                  { x: 0, y: plotterSettings.sheetHeight * scale - 10 }, // Bottom-left
                  { x: plotterSettings.sheetWidth * scale - 10, y: plotterSettings.sheetHeight * scale - 10 } // Bottom-right
                ].map((mark, index) => (
                  <div
                    key={`crop-${index}`}
                    className="absolute"
                    style={{
                      left: mark.x,
                      top: mark.y,
                    }}
                  >
                    <div className="w-2 h-0.5 bg-black absolute"></div>
                    <div className="w-0.5 h-2 bg-black absolute"></div>
                  </div>
                ))}
              </>
            )}
            
            {/* Margins visualization */}
            <div 
              className="absolute border border-red-300 bg-red-50 opacity-30"
              style={{
                top: plotterSettings.marginTop * scale,
                left: plotterSettings.marginLeft * scale,
                width: usableWidth * scale,
                height: usableHeight * scale,
              }}
            />
            
            {/* Grid lines for better visualization */}
            <svg 
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
              style={{ opacity: 0.1 }}
            >
              {/* Vertical grid lines */}
              {Array.from({ length: layout.labelsPerRow + 1 }).map((_, col) => (
                <line
                  key={`v-grid-${col}`}
                  x1={(plotterSettings.marginLeft + col * (plotterSettings.labelWidth + plotterSettings.horizontalSpacing)) * scale}
                  y1={plotterSettings.marginTop * scale}
                  x2={(plotterSettings.marginLeft + col * (plotterSettings.labelWidth + plotterSettings.horizontalSpacing)) * scale}
                  y2={(plotterSettings.sheetHeight - plotterSettings.marginBottom) * scale}
                  stroke="#666"
                  strokeWidth="0.5"
                />
              ))}
              {/* Horizontal grid lines */}
              {Array.from({ length: layout.labelsPerColumn + 1 }).map((_, row) => (
                <line
                  key={`h-grid-${row}`}
                  x1={plotterSettings.marginLeft * scale}
                  y1={(plotterSettings.marginTop + row * (plotterSettings.labelHeight + plotterSettings.verticalSpacing)) * scale}
                  x2={(plotterSettings.sheetWidth - plotterSettings.marginRight) * scale}
                  y2={(plotterSettings.marginTop + row * (plotterSettings.labelHeight + plotterSettings.verticalSpacing)) * scale}
                  stroke="#666"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
            
            {/* Arranged designs with actual content */}
            {arrangedDesigns.length > 0 ? (
              arrangedDesigns.map((arrangement, index) => {
                const designData = selectedDesigns[index] ? designs.find(d => d.id === selectedDesigns[index]) : null;
                
                return (
                  <div
                    key={`arranged-${index}`}
                    className="absolute border-2 border-green-500 bg-white overflow-hidden shadow-sm"
                    style={{
                      left: arrangement.x * scale,
                      top: arrangement.y * scale,
                      width: arrangement.width * scale,
                      height: arrangement.height * scale,
                    }}
                  >
                    {designData && designData.thumbnailPath ? (
                      <div className="w-full h-full relative">
                        <img
                          src={designData.thumbnailPath}
                          alt={designData.name}
                          className="w-full h-full object-contain"
                          style={{
                            imageRendering: 'crisp-edges',
                          }}
                        />
                        <div className="absolute inset-0 bg-green-500 bg-opacity-10"></div>
                        <div className="absolute top-0.5 left-0.5 text-xs font-bold text-green-700 bg-white px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-100">
                        <div className="text-center">
                          <div className="text-xs font-bold text-green-700">
                            {index + 1}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Tasarım
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Empty label positions */
              Array.from({ length: layout.labelsPerColumn }).map((_, row) =>
                Array.from({ length: layout.labelsPerRow }).map((_, col) => {
                  const index = row * layout.labelsPerRow + col;
                  const isSelected = index < selectedDesigns.length;
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`absolute border-2 transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-gray-300 bg-gray-50'
                      } opacity-75`}
                      style={{
                        top: (plotterSettings.marginTop + row * (plotterSettings.labelHeight + plotterSettings.verticalSpacing)) * scale,
                        left: (plotterSettings.marginLeft + col * (plotterSettings.labelWidth + plotterSettings.horizontalSpacing)) * scale,
                        width: plotterSettings.labelWidth * scale,
                        height: plotterSettings.labelHeight * scale,
                      }}
                    >
                      {isSelected && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs font-bold text-blue-700">
                              {index + 1}
                            </div>
                            <div className="text-xs text-gray-600">
                              Seçili
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <strong>Kağıt Boyutu:</strong> {plotterSettings.sheetWidth}×{plotterSettings.sheetHeight}mm
            </p>
            <p className="text-gray-600">
              <strong>Kullanılabilir Alan:</strong> {usableWidth.toFixed(1)}×{usableHeight.toFixed(1)}mm
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <strong>Toplam Pozisyon:</strong> {layout.totalLabels}
            </p>
            <p className="text-gray-600">
              <strong>Yerleştirilen:</strong> {arrangedDesigns.length} / {selectedDesigns.length}
            </p>
          </div>
        </div>
        
        {arrangedDesigns.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Otomatik Dizim Tamamlandı
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              {arrangements.efficiency} verimlilik ile {arrangedDesigns.length} tasarım yerleştirildi
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Otomasyonlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="plotter">Plotter Kesim</TabsTrigger>
              <TabsTrigger value="pricing">Fiyat Hesaplama</TabsTrigger>
              <TabsTrigger value="workflows">İş Akışları</TabsTrigger>
            </TabsList>

            <TabsContent value="plotter" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Settings Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Plotter Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">


                    {/* Crop Marks Setting */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cropMarks"
                        checked={showCropMarks}
                        onChange={(e) => setShowCropMarks(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="cropMarks">Kesim işaretlerini göster</Label>
                    </div>

                    {/* Sheet Size */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Kağıt Genişliği (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.sheetWidth}
                          onChange={(e) => updateSetting('sheetWidth', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Kağıt Yüksekliği (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.sheetHeight}
                          onChange={(e) => updateSetting('sheetHeight', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Label Size */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Etiket Genişliği (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.labelWidth}
                          onChange={(e) => updateSetting('labelWidth', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Etiket Yüksekliği (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.labelHeight}
                          onChange={(e) => updateSetting('labelHeight', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Margins */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Üst Kenar Boşluğu (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.marginTop}
                          onChange={(e) => updateSetting('marginTop', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Alt Kenar Boşluğu (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.marginBottom}
                          onChange={(e) => updateSetting('marginBottom', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Sol Kenar Boşluğu (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.marginLeft}
                          onChange={(e) => updateSetting('marginLeft', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Sağ Kenar Boşluğu (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.marginRight}
                          onChange={(e) => updateSetting('marginRight', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Spacing */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Yatay Boşluk (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.horizontalSpacing}
                          onChange={(e) => updateSetting('horizontalSpacing', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Dikey Boşluk (mm)</Label>
                        <Input
                          type="number"
                          value={plotterSettings.verticalSpacing}
                          onChange={(e) => updateSetting('verticalSpacing', Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <Label>Hızlı Ayarlar</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPlotterSettings({
                              ...plotterSettings,
                              sheetWidth: 330,
                              sheetHeight: 480,
                              labelWidth: 50,
                              labelHeight: 30,
                            });
                          }}
                        >
                          33x48 / 5x3
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPlotterSettings({
                              ...plotterSettings,
                              sheetWidth: 297,
                              sheetHeight: 420,
                              labelWidth: 40,
                              labelHeight: 25,
                            });
                          }}
                        >
                          A3 / 4x2.5
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview and Results */}
                <div className="space-y-4">
                  <PlotterPreview />
                  
                  {/* Layout Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Düzen İstatistikleri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="text-2xl font-bold text-blue-600">{layout.labelsPerRow}</p>
                          <p className="text-sm text-gray-600">Satır Başına</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <p className="text-2xl font-bold text-green-600">{layout.labelsPerColumn}</p>
                          <p className="text-sm text-gray-600">Sütun Başına</p>
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded">
                        <p className="text-3xl font-bold text-purple-600">{layout.totalLabels}</p>
                        <p className="text-sm text-gray-600">Toplam Etiket</p>
                      </div>
                      
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <p className="text-xl font-bold text-orange-600">%{layout.wastePercentage}</p>
                        <p className="text-sm text-gray-600">Fire Oranı</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Düzen adı..."
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    onClick={() => {
                      if (layoutName.trim()) {
                        saveLayoutMutation.mutate({
                          name: layoutName.trim(),
                          settings: plotterSettings
                        });
                      }
                    }}
                    disabled={!layoutName.trim() || saveLayoutMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Düzeni Kaydet
                  </Button>
                </div>
                
                <Button
                  onClick={() => generatePdfMutation.mutate({ 
                    plotterSettings, 
                    arrangements: arrangements.length > 0 ? arrangements : undefined 
                  })}
                  disabled={generatePdfMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generatePdfMutation.isPending ? "Oluşturuluyor..." : "PDF İndir"}
                </Button>
              </div>

              {/* Design Upload & Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Tasarım Dosyaları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="design-upload"
                      multiple
                      accept=".pdf,.svg,.ai,.eps"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Tasarım Dosyalarını Yükleyin
                      </p>
                      <p className="text-gray-600 mb-4">
                        Vektörel dosyalar: PDF, SVG, AI, EPS formatları desteklenir
                      </p>
                      <Button 
                        type="button"
                        onClick={() => document.getElementById('design-upload')?.click()}
                        disabled={uploadDesignsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadDesignsMutation.isPending ? "Yükleniyor..." : "Dosya Seç"}
                      </Button>
                    </div>
                  </div>

                  {/* Design Gallery */}
                  {Array.isArray(designs) && designs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Yüklenen Tasarımlar ({designs.length})</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDesigns(designs.map((d: any) => d.id))}
                          >
                            Tümünü Seç
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDesigns([])}
                          >
                            Seçimi Temizle
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                        {designs.map((design: any, index: number) => (
                          <div
                            key={design.id}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              selectedDesigns.includes(design.id)
                                ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                            }`}
                            onClick={() => toggleDesignSelection(design.id)}
                          >
                            <div className="aspect-square bg-white rounded border mb-2 flex items-center justify-center overflow-hidden relative">
                              {design.thumbnailPath ? (
                                <img
                                  src={design.thumbnailPath}
                                  alt={design.name}
                                  className="max-w-full max-h-full object-contain"
                                  style={{
                                    imageRendering: design.fileType === 'image' ? 'crisp-edges' : 'auto'
                                  }}
                                />
                              ) : (
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                  <span className="text-xs text-gray-500">
                                    {design.fileType?.toUpperCase() || 'FILE'}
                                  </span>
                                </div>
                              )}
                              
                              {/* Selection indicator */}
                              {selectedDesigns.includes(design.id) && (
                                <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {selectedDesigns.indexOf(design.id) + 1}
                                </div>
                              )}
                              
                              {/* File type indicator */}
                              <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black bg-opacity-70 text-white text-xs rounded">
                                {design.name.split('.').pop()?.toUpperCase() || 'FILE'}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm font-medium truncate" title={design.name}>
                                {design.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {design.dimensions || 'Boyut bilinmiyor'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(design.uploadedAt).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Auto Arrange Controls */}
                      {selectedDesigns.length > 0 && (
                        <div className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">
                              {selectedDesigns.length} tasarım seçildi
                            </p>
                            <p className="text-xs text-blue-700">
                              Otomatik dizim ile tasarımları kağıt üzerine yerleştirin
                            </p>
                          </div>
                          <Button
                            onClick={handleAutoArrange}
                            disabled={autoArrangeMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            {autoArrangeMutation.isPending ? "Diziliyor..." : "Otomatik Dizim"}
                          </Button>
                        </div>
                      )}

                      {/* Arrangement Results */}
                      {arrangements && arrangements.arrangements && arrangements.arrangements.length > 0 && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-900 mb-2">
                            Dizim Tamamlandı
                          </p>
                          <p className="text-xs text-green-700">
                            {arrangements.totalArranged}/{arrangements.totalRequested} tasarım başarıyla dizildi ({arrangements.efficiency} verimlilik)
                          </p>
                        </div>
                      )}

                      {/* Preview Panel */}
                      {arrangements && arrangements.arrangements && arrangements.arrangements.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Dizim Önizlemesi</h3>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setPreviewMode(!previewMode)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {previewMode ? "Normal Görünüm" : "Önizleme"}
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => generatePdfMutation.mutate({ plotterSettings, arrangements })}
                                disabled={generatePdfMutation.isPending}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {generatePdfMutation.isPending ? "Oluşturuluyor..." : "PDF İndir"}
                              </Button>
                            </div>
                          </div>

                          {/* Preview Canvas */}
                          <div className="border rounded-lg p-4 bg-white">
                            <div 
                              className="relative border-2 border-dashed border-gray-300 mx-auto"
                              style={{
                                width: `${Math.min(400, plotterSettings.sheetWidth * 0.5)}px`,
                                height: `${Math.min(300, plotterSettings.sheetHeight * 0.5)}px`,
                                backgroundColor: '#fafafa'
                              }}
                            >


                              {/* Margins */}
                              <div 
                                className="absolute border border-blue-200 bg-blue-50 bg-opacity-30"
                                style={{
                                  left: `${(plotterSettings.marginLeft / plotterSettings.sheetWidth) * 100}%`,
                                  top: `${(plotterSettings.marginTop / plotterSettings.sheetHeight) * 100}%`,
                                  right: `${(plotterSettings.marginRight / plotterSettings.sheetWidth) * 100}%`,
                                  bottom: `${(plotterSettings.marginBottom / plotterSettings.sheetHeight) * 100}%`,
                                }}
                              />

                              {/* Arranged items */}
                              {arrangements.arrangements.map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="absolute bg-green-200 border border-green-400 rounded flex items-center justify-center text-xs font-medium"
                                  style={{
                                    left: `${(item.x / plotterSettings.sheetWidth) * 100}%`,
                                    top: `${(item.y / plotterSettings.sheetHeight) * 100}%`,
                                    width: `${(item.width / plotterSettings.sheetWidth) * 100}%`,
                                    height: `${(item.height / plotterSettings.sheetHeight) * 100}%`,
                                  }}
                                >
                                  {index + 1}
                                </div>
                              ))}
                            </div>
                            
                            {/* Design List */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Dizilen Tasarımlar: {arrangements.totalArranged || 0}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {selectedDesigns.slice(0, arrangements.totalArranged || 0).map((designId, index) => (
                                  <div key={designId} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                                    <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                                      {index + 1}
                                    </span>
                                    <span className="truncate">Tasarım {index + 1}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Saved Layouts */}
              {Array.isArray(savedLayouts) && savedLayouts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kaydedilmiş Düzenler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {savedLayouts.map((layout: LabelLayout) => (
                        <div key={layout.id} className="border rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{layout.name}</h4>
                            <Badge variant="outline">{layout.totalLabels} etiket</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {layout.settings.sheetWidth}x{layout.settings.sheetHeight}mm - 
                            Fire: %{layout.wastePercentage}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadLayout(layout)}
                            className="w-full"
                          >
                            Yükle
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Otomatik Fiyat Hesaplama</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Fiyat Hesaplama Otomasyonu</h3>
                    <p className="text-gray-600 mb-4">
                      Malzeme, işçilik ve kar marjı hesaplamaları için otomatik fiyatlandırma sistemi geliştirme aşamasında.
                    </p>
                    <Badge variant="secondary">Yakında Gelecek</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>İş Akışı Otomasyonları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Layers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">İş Akışı Yönetimi</h3>
                    <p className="text-gray-600 mb-4">
                      Sipariş takibi, stok yönetimi ve kalite kontrol süreçleri için akıllı otomasyon sistemi geliştirme aşamasında.
                    </p>
                    <Badge variant="secondary">Yakında Gelecek</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}