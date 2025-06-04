import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Download, Eye, FileText, Zap } from "lucide-react";

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

interface Design {
  id: string;
  name: string;
  filename: string;
  type: string;
  thumbnailPath?: string;
  dimensions?: string;
  realDimensionsMM?: string;
  fileSize?: string;
  uploadedAt: string;
}

interface ArrangementResult {
  arrangements: any[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
}

export default function AutomationPanelNew() {
  const { toast } = useToast();
  const [arrangements, setArrangements] = useState<ArrangementResult | null>(null);

  // Fixed 33x48cm settings
  const plotterSettings: PlotterSettings = {
    sheetWidth: 330,
    sheetHeight: 480,
    marginTop: 3,
    marginBottom: 3,
    marginLeft: 3,
    marginRight: 3,
    labelWidth: 50,
    labelHeight: 50,
    horizontalSpacing: 2,
    verticalSpacing: 2,
  };

  // Get designs
  const { data: designs = [], refetch: refetchDesigns } = useQuery<Design[]>({
    queryKey: ['/api/automation/plotter/designs'],
    refetchOnWindowFocus: false,
  });

  // Upload designs mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest('POST', '/api/automation/plotter/upload-designs', formData);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Dosyalar yüklendi ve işlendi.",
      });
      refetchDesigns();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Dosya yükleme başarısız.",
        variant: "destructive",
      });
    },
  });

  // Auto-arrange mutation with auto PDF generation
  const autoArrangeMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      const designIds = designs.map((d: Design) => d.id);
      return await apiRequest('POST', '/api/automation/plotter/auto-arrange', {
        designIds,
        plotterSettings
      });
    },
    onSuccess: (data: ArrangementResult) => {
      setArrangements(data);
      toast({
        title: "Dizim Tamamlandı",
        description: `${data.totalArranged} tasarım dizildi. PDF oluşturuluyor...`,
      });
      
      // Auto-generate PDF after 1 second
      setTimeout(() => {
        generatePdfMutation.mutate({ plotterSettings, arrangements: data });
      }, 1000);
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
    mutationFn: async (data: { plotterSettings: PlotterSettings; arrangements: ArrangementResult }) => {
      const response = await fetch('/api/automation/plotter/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('PDF oluşturulamadı');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dizim-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    },
    onSuccess: () => {
      toast({
        title: "PDF İndirildi",
        description: "Dizim PDF'i başarıyla indirildi.",
      });
    },
    onError: () => {
      toast({
        title: "PDF Hatası",
        description: "PDF oluşturulamadı.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Files selected:', files.length);
    
    const formData = new FormData();
    Array.from(files).forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });
      formData.append('designs', file);
    });

    console.log('Uploading files...');
    uploadMutation.mutate(formData);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Otomatik Vektörel Dizim Sistemi
        </h1>
        <p className="text-gray-600">
          33x48cm Sabit Format | Vektörel Dosyalar (PDF, SVG, AI, EPS)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              1. Vektörel Dosya Yükleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.svg,.ai,.eps"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    Vektörel dosyaları seçin
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, SVG, AI, EPS formatları desteklenir
                  </p>
                </label>
              </div>

              {uploadMutation.isPending && (
                <div className="text-center">
                  <p className="text-blue-600">Dosyalar işleniyor...</p>
                </div>
              )}

              {designs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Yüklenen Dosyalar ({designs.length})</h3>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {designs.map((design: Design) => (
                      <div key={design.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{design.filename}</span>
                        <span className="text-xs text-gray-500">{design.realDimensionsMM}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              2. Dizim Önizlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {arrangements && arrangements.arrangements && arrangements.arrangements.length > 0 ? (
              <div className="space-y-4">
                <div 
                  className="relative border-2 border-dashed border-gray-300 mx-auto bg-gray-50"
                  style={{
                    width: '300px',
                    height: '400px',
                  }}
                >
                  {arrangements.arrangements.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="absolute bg-blue-200 border border-blue-500 rounded flex items-center justify-center text-xs font-bold text-blue-800"
                      style={{
                        left: `${(item.x / 330) * 85}%`,
                        top: `${(item.y / 480) * 85}%`,
                        width: `${Math.max(15, (item.width / 330) * 85)}px`,
                        height: `${Math.max(10, (item.height / 480) * 85)}px`,
                      }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    33cm x 48cm | {arrangements.totalArranged} tasarım dizildi
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    Verimlilik: {arrangements.efficiency}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Eye className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">
                  Önizleme Boş
                </p>
                <p className="text-gray-400 text-sm">
                  Dosya yükleyin ve dizim yapın
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            3. Otomatik İşlem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button
              size="lg"
              onClick={() => autoArrangeMutation.mutate()}
              disabled={designs.length === 0 || autoArrangeMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold"
            >
              {autoArrangeMutation.isPending ? (
                <>
                  <Play className="animate-spin h-6 w-6 mr-3" />
                  DİZİLİYOR...
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-3" />
                  HEMEN DİZİN
                </>
              )}
            </Button>

            {generatePdfMutation.isPending && (
              <div className="text-center">
                <p className="text-green-600 font-medium">PDF oluşturuluyor ve indiriliyor...</p>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center max-w-md">
              Tüm vektörel dosyalarınız otomatik olarak 33x48cm baskı alanına yerleştirilecek 
              ve PDF olarak indirilecek.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}