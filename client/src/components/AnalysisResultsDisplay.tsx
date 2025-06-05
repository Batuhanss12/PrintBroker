import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Layers, 
  Image as ImageIcon,
  Edit,
  Save,
  RotateCw,
  Ruler,
  Info
} from 'lucide-react';

interface AnalysisResult {
  success: boolean;
  fileName: string;
  filePath: string;
  dimensions: {
    widthMM: number;
    heightMM: number;
    confidence: number;
    method: string;
    description: string;
  };
  contentAnalysis: {
    hasVectorContent: boolean;
    hasRasterContent: boolean;
    hasText: boolean;
    isEmpty: boolean;
    contentBounds?: any;
  };
  qualityReport: {
    isVectorBased: boolean;
    hasProperBoxes: boolean;
    needsOptimization: boolean;
    warnings: string[];
    recommendations: string[];
  };
  processingNotes: string[];
  thumbnailPath?: string;
  requiresManualInput: boolean;
  alternativeMethods: string[];
  error?: string;
}

interface AnalysisResultsDisplayProps {
  result: AnalysisResult;
  onManualDimensions?: (dimensions: { widthMM: number; heightMM: number; userNote?: string }) => void;
  onRetryAnalysis?: (method: string) => void;
  isLoading?: boolean;
}

export default function AnalysisResultsDisplay({ 
  result, 
  onManualDimensions, 
  onRetryAnalysis,
  isLoading = false 
}: AnalysisResultsDisplayProps) {
  const [isManualMode, setIsManualMode] = useState(result.requiresManualInput);
  const [manualWidth, setManualWidth] = useState(result.dimensions.widthMM.toString());
  const [manualHeight, setManualHeight] = useState(result.dimensions.heightMM.toString());
  const [userNote, setUserNote] = useState('');

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Yüksek güven';
    if (confidence >= 0.5) return 'Orta güven';
    return 'Düşük güven';
  };

  const handleManualSubmit = () => {
    const width = parseFloat(manualWidth);
    const height = parseFloat(manualHeight);
    
    if (width > 0 && height > 0 && onManualDimensions) {
      onManualDimensions({
        widthMM: width,
        heightMM: height,
        userNote: userNote || 'Kullanıcı tarafından manuel olarak girildi'
      });
      setIsManualMode(false);
    }
  };

  const renderContentAnalysis = () => {
    const { contentAnalysis } = result;
    const contentTypes = [];
    
    if (contentAnalysis.hasVectorContent) contentTypes.push({ type: 'Vektör', icon: <Layers className="w-4 h-4" /> });
    if (contentAnalysis.hasRasterContent) contentTypes.push({ type: 'Raster', icon: <ImageIcon className="w-4 h-4" /> });
    if (contentAnalysis.hasText) contentTypes.push({ type: 'Metin', icon: <FileText className="w-4 h-4" /> });

    return (
      <div className="space-y-2">
        <h4 className="font-medium">İçerik Analizi</h4>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((content, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {content.icon}
              {content.type}
            </Badge>
          ))}
          {contentAnalysis.isEmpty && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              İçerik Bulunamadı
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const renderQualityReport = () => {
    const { qualityReport } = result;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {qualityReport.isVectorBased ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm">
              {qualityReport.isVectorBased ? 'Vektör Tabanlı' : 'Raster Tabanlı'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {qualityReport.hasProperBoxes ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-orange-500" />
            )}
            <span className="text-sm">
              {qualityReport.hasProperBoxes ? 'PDF Kutuları Mevcut' : 'PDF Kutuları Eksik'}
            </span>
          </div>
        </div>

        {qualityReport.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Uyarılar</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {qualityReport.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {qualityReport.recommendations.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Öneriler</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {qualityReport.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderDimensionAnalysis = () => {
    const { dimensions } = result;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Genişlik</Label>
            <div className="text-2xl font-bold">{dimensions.widthMM} mm</div>
          </div>
          <div>
            <Label className="text-sm font-medium">Yükseklik</Label>
            <div className="text-2xl font-bold">{dimensions.heightMM} mm</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Güven Seviyesi</Label>
            <span className="text-sm text-muted-foreground">
              {getConfidenceText(dimensions.confidence)}
            </span>
          </div>
          <Progress 
            value={dimensions.confidence * 100} 
            className="w-full"
          />
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Analiz Yöntemi</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {dimensions.description}
          </p>
        </div>

        {(dimensions.confidence < 0.5 || isManualMode) && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Edit className="w-4 h-4" />
              <Label className="font-medium">Manuel Boyut Girişi</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="manual-width" className="text-sm">Genişlik (mm)</Label>
                <Input
                  id="manual-width"
                  type="number"
                  value={manualWidth}
                  onChange={(e) => setManualWidth(e.target.value)}
                  min="1"
                  max="1000"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="manual-height" className="text-sm">Yükseklik (mm)</Label>
                <Input
                  id="manual-height"
                  type="number"
                  value={manualHeight}
                  onChange={(e) => setManualHeight(e.target.value)}
                  min="1"
                  max="1000"
                  step="0.1"
                />
              </div>
            </div>

            <div className="mt-3">
              <Label htmlFor="user-note" className="text-sm">Not (İsteğe Bağlı)</Label>
              <Textarea
                id="user-note"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Boyut değişikliği hakkında not..."
                rows={2}
              />
            </div>

            <Button 
              onClick={handleManualSubmit}
              className="w-full mt-3"
              disabled={!manualWidth || !manualHeight || parseFloat(manualWidth) <= 0 || parseFloat(manualHeight) <= 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Boyutları Kaydet
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderProcessingNotes = () => {
    return (
      <div className="space-y-2">
        <h4 className="font-medium">İşleme Notları</h4>
        <div className="space-y-1">
          {result.processingNotes.map((note, index) => (
            <div key={index} className="text-sm text-muted-foreground p-2 bg-muted rounded">
              {note}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlternativeMethods = () => {
    if (result.alternativeMethods.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium">Alternatif Analiz Yöntemleri</h4>
        <div className="flex flex-wrap gap-2">
          {result.alternativeMethods.map((method, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onRetryAnalysis?.(method)}
              disabled={isLoading}
            >
              <RotateCw className="w-4 h-4 mr-1" />
              {method.replace('-', ' ').toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  if (!result.success && result.error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Analiz Başarısız
          </CardTitle>
          <CardDescription>{result.fileName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
          
          {renderAlternativeMethods()}
          
          <div className="border-t pt-4">
            <Button 
              onClick={() => setIsManualMode(true)}
              variant="outline"
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Manuel Boyut Girişi
            </Button>
          </div>
          
          {isManualMode && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="error-width" className="text-sm">Genişlik (mm)</Label>
                  <Input
                    id="error-width"
                    type="number"
                    value={manualWidth}
                    onChange={(e) => setManualWidth(e.target.value)}
                    min="1"
                    max="1000"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="error-height" className="text-sm">Yükseklik (mm)</Label>
                  <Input
                    id="error-height"
                    type="number"
                    value={manualHeight}
                    onChange={(e) => setManualHeight(e.target.value)}
                    min="1"
                    max="1000"
                    step="0.1"
                  />
                </div>
              </div>
              
              <Textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Dosya hakkında not..."
                rows={2}
              />
              
              <Button 
                onClick={handleManualSubmit}
                className="w-full"
                disabled={!manualWidth || !manualHeight}
              >
                <Save className="w-4 h-4 mr-2" />
                Boyutları Kaydet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={result.success ? 'border-green-200' : 'border-yellow-200'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          )}
          Analiz Sonuçları
        </CardTitle>
        <CardDescription>{result.fileName}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="dimensions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dimensions" className="flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              Boyutlar
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              İçerik
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Kalite
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <Info className="w-4 h-4" />
              Notlar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dimensions" className="mt-4">
            {renderDimensionAnalysis()}
          </TabsContent>
          
          <TabsContent value="content" className="mt-4">
            {renderContentAnalysis()}
          </TabsContent>
          
          <TabsContent value="quality" className="mt-4">
            {renderQualityReport()}
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4 space-y-4">
            {renderProcessingNotes()}
            {renderAlternativeMethods()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}