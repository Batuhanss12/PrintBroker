
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wand2, 
  Download, 
  Copy, 
  Eye, 
  Sparkles,
  Image as ImageIcon,
  Palette,
  Zap,
  Clock,
  Star,
  Grid3X3,
  Settings,
  History,
  Template,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignTemplate {
  id: string;
  name: string;
  prompt: string;
  category: string;
  thumbnail: string;
}

interface GeneratedImage {
  url: string;
  is_image_safe: boolean;
  prompt: string;
  resolution: string;
  seed: number;
}

interface DesignOptions {
  aspectRatio?: string;
  model?: string;
  styleType?: string;
  magicPrompt?: string;
  negativePrompt?: string;
  seed?: number;
}

export default function DesignEngine() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const [designOptions, setDesignOptions] = useState<DesignOptions>({
    aspectRatio: 'ASPECT_1_1',
    model: 'V_2',
    styleType: 'AUTO',
    magicPrompt: 'AUTO'
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchPrompts, setBatchPrompts] = useState<string[]>(['']);

  // Fetch design templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/design/templates'],
    queryFn: () => apiRequest('GET', '/api/design/templates'),
  });

  // Fetch design history
  const { data: history } = useQuery({
    queryKey: ['/api/design/history'],
    queryFn: () => apiRequest('GET', '/api/design/history?page=1&limit=10'),
  });

  // Generate single design
  const generateMutation = useMutation({
    mutationFn: async ({ prompt, options }: { prompt: string; options: DesignOptions }) => {
      const response = await apiRequest('POST', '/api/design/generate', {
        prompt,
        options
      });
      return response.data;
    },
    onSuccess: (images) => {
      setGeneratedImages(images);
      toast({
        title: "Başarılı",
        description: "Tasarım başarıyla oluşturuldu!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/design/history'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Tasarım oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Generate batch designs
  const generateBatchMutation = useMutation({
    mutationFn: async (requests: Array<{ prompt: string; options: DesignOptions }>) => {
      const response = await apiRequest('POST', '/api/design/generate-batch', {
        requests
      });
      return response;
    },
    onSuccess: (results) => {
      const allImages = results.flatMap((result: any) => result.data);
      setGeneratedImages(allImages);
      toast({
        title: "Başarılı",
        description: `${results.length} tasarım başarıyla oluşturuldu!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/design/history'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Toplu tasarım oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen bir tasarım açıklaması girin.",
        variant: "destructive",
      });
      return;
    }

    if (batchMode) {
      const validPrompts = batchPrompts.filter(p => p.trim());
      if (validPrompts.length === 0) {
        toast({
          title: "Hata",
          description: "En az bir geçerli açıklama girin.",
          variant: "destructive",
        });
        return;
      }
      
      const requests = validPrompts.map(prompt => ({ prompt, options: designOptions }));
      generateBatchMutation.mutate(requests);
    } else {
      generateMutation.mutate({ prompt, options: designOptions });
    }
  };

  const useTemplate = (template: DesignTemplate) => {
    setPrompt(template.prompt);
    setSelectedTemplate(template);
    toast({
      title: "Şablon Seçildi",
      description: `${template.name} şablonu yüklendi. İstediğiniz değişiklikleri yapabilirsiniz.`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: "Metin panoya kopyalandı.",
    });
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görsel indirilemedi.",
        variant: "destructive",
      });
    }
  };

  const addBatchPrompt = () => {
    setBatchPrompts([...batchPrompts, '']);
  };

  const updateBatchPrompt = (index: number, value: string) => {
    const newPrompts = [...batchPrompts];
    newPrompts[index] = value;
    setBatchPrompts(newPrompts);
  };

  const removeBatchPrompt = (index: number) => {
    if (batchPrompts.length > 1) {
      setBatchPrompts(batchPrompts.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tasarım Motoru
          </h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Yapay zeka destekli profesyonel tasarım oluşturma platformu. Logo, etiket, kartvizit ve daha fazlası için.
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Tasarım Oluştur
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Template className="h-4 w-4" />
            Şablonlar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        {/* Create Design Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Design Input */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Tasarım Açıklaması
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-4">
                    <Label>Mod:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={!batchMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBatchMode(false)}
                      >
                        Tekli Tasarım
                      </Button>
                      <Button
                        variant={batchMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBatchMode(true)}
                      >
                        Toplu Tasarım
                      </Button>
                    </div>
                  </div>

                  {!batchMode ? (
                    <div>
                      <Label htmlFor="prompt">Tasarım Açıklaması</Label>
                      <Textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Örn: Modern ve minimal logo tasarımı, teknoloji şirketi için mavi ve gri renklerde..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Tasarım Açıklamaları (Toplu)</Label>
                      {batchPrompts.map((prompt, index) => (
                        <div key={index} className="flex gap-2">
                          <Textarea
                            value={prompt}
                            onChange={(e) => updateBatchPrompt(index, e.target.value)}
                            placeholder={`Tasarım ${index + 1} açıklaması...`}
                            rows={2}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBatchPrompt(index)}
                            disabled={batchPrompts.length === 1}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addBatchPrompt}
                        disabled={batchPrompts.length >= 5}
                      >
                        + Yeni Açıklama Ekle
                      </Button>
                    </div>
                  )}

                  {selectedTemplate && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <strong>Seçili Şablon:</strong> {selectedTemplate.name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(null)}
                        className="mt-1 h-auto p-1 text-blue-600"
                      >
                        Şablonu Kaldır
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Oluşturulan Tasarımlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`Generated design ${index + 1}`}
                            className="w-full h-64 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => downloadImage(image.url, `design-${index + 1}.png`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="secondary">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Tasarım Önizleme</DialogTitle>
                                  </DialogHeader>
                                  <img
                                    src={image.url}
                                    alt={`Design preview ${index + 1}`}
                                    className="w-full h-auto rounded-lg"
                                  />
                                  <div className="space-y-2">
                                    <p className="text-sm text-gray-600"><strong>Açıklama:</strong> {image.prompt}</p>
                                    <p className="text-sm text-gray-600"><strong>Çözünürlük:</strong> {image.resolution}</p>
                                    <p className="text-sm text-gray-600"><strong>Seed:</strong> {image.seed}</p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge variant={image.is_image_safe ? "default" : "destructive"}>
                              {image.is_image_safe ? "Güvenli" : "Dikkat"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Tasarım Ayarları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>En-Boy Oranı</Label>
                    <Select
                      value={designOptions.aspectRatio}
                      onValueChange={(value) => setDesignOptions({...designOptions, aspectRatio: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASPECT_1_1">Kare (1:1)</SelectItem>
                        <SelectItem value="ASPECT_16_9">Geniş (16:9)</SelectItem>
                        <SelectItem value="ASPECT_9_16">Dikey (9:16)</SelectItem>
                        <SelectItem value="ASPECT_3_2">Yatay (3:2)</SelectItem>
                        <SelectItem value="ASPECT_2_3">Dikey (2:3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Model</Label>
                    <Select
                      value={designOptions.model}
                      onValueChange={(value) => setDesignOptions({...designOptions, model: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V_2">V2 (En İyi Kalite)</SelectItem>
                        <SelectItem value="V_2_TURBO">V2 Turbo (Hızlı)</SelectItem>
                        <SelectItem value="V_1">V1 (Klasik)</SelectItem>
                        <SelectItem value="V_1_TURBO">V1 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Stil Türü</Label>
                    <Select
                      value={designOptions.styleType}
                      onValueChange={(value) => setDesignOptions({...designOptions, styleType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Otomatik</SelectItem>
                        <SelectItem value="GENERAL">Genel</SelectItem>
                        <SelectItem value="REALISTIC">Gerçekçi</SelectItem>
                        <SelectItem value="DESIGN">Tasarım</SelectItem>
                        <SelectItem value="RENDER_3D">3D Render</SelectItem>
                        <SelectItem value="ANIME">Anime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Negatif Açıklama (İstenmeyen)</Label>
                    <Input
                      value={designOptions.negativePrompt || ''}
                      onChange={(e) => setDesignOptions({...designOptions, negativePrompt: e.target.value})}
                      placeholder="Örn: bulanık, düşük kalite, metin"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || generateBatchMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    size="lg"
                  >
                    {(generateMutation.isPending || generateBatchMutation.isPending) ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Tasarım Oluştur
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: DesignTemplate) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                    <Template className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {template.prompt}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => useTemplate(template)}
                        className="flex-1"
                      >
                        <Wand2 className="h-4 w-4 mr-1" />
                        Kullan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(template.prompt)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {history?.designs?.length > 0 ? (
            <div className="space-y-4">
              {history.designs.map((design: any, index: number) => (
                <Card key={design.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{design.prompt}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {new Date(design.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {design.result?.map((image: any, imgIndex: number) => (
                          <img
                            key={imgIndex}
                            src={image.url}
                            alt={`History ${index}-${imgIndex}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Henüz tasarım geçmişiniz yok
                </h3>
                <p className="text-gray-500">
                  İlk tasarımınızı oluşturun ve burada görün
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
