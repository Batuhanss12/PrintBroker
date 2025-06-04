
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Eye, FileText, Zap, Trash2, AlertCircle, CheckCircle, Settings, Ruler, RotateCcw, Maximize2 } from "lucide-react";

// Paper size templates
interface PaperTemplate {
  id: string;
  name: string;
  category: 'A-Series' | 'B-Series' | 'C-Series' | 'US-Standard' | 'Custom';
  widthMM: number;
  heightMM: number;
  description?: string;
}

const PAPER_TEMPLATES: PaperTemplate[] = [
  // A Series
  { id: 'a0', name: 'A0', category: 'A-Series', widthMM: 841, heightMM: 1189, description: '841×1189mm' },
  { id: 'a1', name: 'A1', category: 'A-Series', widthMM: 594, heightMM: 841, description: '594×841mm' },
  { id: 'a2', name: 'A2', category: 'A-Series', widthMM: 420, heightMM: 594, description: '420×594mm' },
  { id: 'a3', name: 'A3', category: 'A-Series', widthMM: 297, heightMM: 420, description: '297×420mm' },
  { id: 'a4', name: 'A4', category: 'A-Series', widthMM: 210, heightMM: 297, description: '210×297mm' },
  { id: 'a5', name: 'A5', category: 'A-Series', widthMM: 148, heightMM: 210, description: '148×210mm' },

  // B Series
  { id: 'b0', name: 'B0', category: 'B-Series', widthMM: 1000, heightMM: 1414, description: '1000×1414mm' },
  { id: 'b1', name: 'B1', category: 'B-Series', widthMM: 707, heightMM: 1000, description: '707×1000mm' },
  { id: 'b2', name: 'B2', category: 'B-Series', widthMM: 500, heightMM: 707, description: '500×707mm' },
  { id: 'b3', name: 'B3', category: 'B-Series', widthMM: 353, heightMM: 500, description: '353×500mm' },
  { id: 'b4', name: 'B4', category: 'B-Series', widthMM: 250, heightMM: 353, description: '250×353mm' },
  { id: 'b5', name: 'B5', category: 'B-Series', widthMM: 176, heightMM: 250, description: '176×250mm' },

  // US Standard
  { id: 'letter', name: 'Letter', category: 'US-Standard', widthMM: 216, heightMM: 279, description: '8.5×11 inch' },
  { id: 'legal', name: 'Legal', category: 'US-Standard', widthMM: 216, heightMM: 356, description: '8.5×14 inch' },
  { id: 'tabloid', name: 'Tabloid', category: 'US-Standard', widthMM: 279, heightMM: 432, description: '11×17 inch' },

  // Custom/Popular
  { id: 'matbixx-33x48', name: 'Matbixx 33×48cm', category: 'Custom', widthMM: 330, heightMM: 480, description: 'Standart format' },
];

// Unit conversion
type Unit = 'mm' | 'cm' | 'inch';

interface DimensionWithUnit {
  value: number;
  unit: Unit;
}

interface PageDimensions {
  width: DimensionWithUnit;
  height: DimensionWithUnit;
  widthMM: number;
  heightMM: number;
  orientation: 'portrait' | 'landscape';
}

interface ScalingOptions {
  mode: 'fit' | 'fill' | 'stretch' | 'none';
  maintainAspectRatio: boolean;
  allowUpscaling: boolean;
  maxScaleFactor: number;
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

interface ArrangementItem {
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

interface ArrangementResult {
  arrangements: ArrangementItem[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  usedArea?: {
    width: number;
    height: number;
  };
}

// Vector file processing interfaces
interface VectorDimensions {
  width: number;
  height: number;
  unit: 'mm' | 'px' | 'pt' | 'in';
  dpi?: number;
}

interface ProcessedVectorFile {
  originalDimensions: VectorDimensions;
  printDimensions: VectorDimensions;
  scaledDimensions: VectorDimensions;
  withBleed: VectorDimensions;
  safeArea: VectorDimensions;
  colorProfile: ColorProfileInfo;
  scalingInfo: ScalingInfo;
  cropMarks?: CropMarkSettings;
}

interface ScalingInfo {
  scaleFactor: number;
  fitsInPage: boolean;
  needsScaling: boolean;
  recommendation: string;
  warnings: string[];
}

interface CropMarkSettings {
  enabled: boolean;
  length: number;
  offset: number;
  lineWidth: number;
}

interface UploadResponse {
  message: string;
  designs: Design[];
}

interface ApiError {
  message: string;
  status?: number;
}

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['application/pdf', 'image/svg+xml', 'application/postscript', 'application/illustrator', 'application/eps'];
const ALLOWED_EXTENSIONS = ['pdf', 'svg', 'ai', 'eps'];
const DEFAULT_DPI = 300;
const POINTS_TO_MM = 0.352778;
const INCHES_TO_MM = 25.4;

// Bleed and margin constants
interface BleedSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeAreaSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

type ColorProfile = 'CMYK' | 'RGB' | 'GRAYSCALE' | 'UNKNOWN';

interface ColorProfileInfo {
  profile: ColorProfile;
  isValid: boolean;
  recommendation: string;
}

export default function AutomationPanelNew() {
  const { toast } = useToast();
  const [arrangements, setArrangements] = useState<ArrangementResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Page dimensions state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('matbixx-33x48');
  const [customDimensions, setCustomDimensions] = useState<PageDimensions>({
    width: { value: 33, unit: 'cm' },
    height: { value: 48, unit: 'cm' },
    widthMM: 330,
    heightMM: 480,
    orientation: 'portrait'
  });

  // Vector processing settings
  const [scalingOptions, setScalingOptions] = useState<ScalingOptions>({
    mode: 'fit',
    maintainAspectRatio: true,
    allowUpscaling: false,
    maxScaleFactor: 2.0
  });

  const [bleedSettings, setBleedSettings] = useState<BleedSettings>({
    top: 3,
    bottom: 3,
    left: 3,
    right: 3
  });

  const [safeAreaSettings, setSafeAreaSettings] = useState<SafeAreaSettings>({
    top: 5,
    bottom: 5,
    left: 5,
    right: 5
  });

  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [colorProfileCheck, setColorProfileCheck] = useState<boolean>(true);
  const [dpiWarningLevel, setDpiWarningLevel] = useState<number>(150);

  // Computed current page dimensions
  const currentPageDimensions = useMemo<PageDimensions>(() => {
    if (selectedTemplate === 'custom') {
      return customDimensions;
    }

    const template = PAPER_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return customDimensions;

    const orientation = customDimensions.orientation;
    const [width, height] = orientation === 'landscape' 
      ? [template.heightMM, template.widthMM] 
      : [template.widthMM, template.heightMM];

    return {
      width: { value: width, unit: 'mm' },
      height: { value: height, unit: 'mm' },
      widthMM: width,
      heightMM: height,
      orientation
    };
  }, [selectedTemplate, customDimensions]);

  // Plotter settings based on current dimensions
  const plotterSettings: PlotterSettings = useMemo(() => ({
    sheetWidth: currentPageDimensions.widthMM,
    sheetHeight: currentPageDimensions.heightMM,
    marginTop: bleedSettings.top,
    marginBottom: bleedSettings.bottom,
    marginLeft: bleedSettings.left,
    marginRight: bleedSettings.right,
    labelWidth: 50,
    labelHeight: 50,
    horizontalSpacing: 2,
    verticalSpacing: 2,
  }), [currentPageDimensions, bleedSettings]);

  /**
   * Unit conversion utilities
   */
  const convertToMM = (value: number, unit: Unit): number => {
    switch (unit) {
      case 'mm': return value;
      case 'cm': return value * 10;
      case 'inch': return value * INCHES_TO_MM;
      default: return value;
    }
  };

  const convertFromMM = (valueMM: number, unit: Unit): number => {
    switch (unit) {
      case 'mm': return valueMM;
      case 'cm': return valueMM / 10;
      case 'inch': return valueMM / INCHES_TO_MM;
      default: return valueMM;
    }
  };

  const formatDimension = (valueMM: number, unit: Unit): string => {
    const converted = convertFromMM(valueMM, unit);
    const precision = unit === 'inch' ? 2 : 1;
    return `${converted.toFixed(precision)}${unit}`;
  };

  /**
   * Page template handlers
   */
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId !== 'custom') {
      const template = PAPER_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        const orientation = customDimensions.orientation;
        const [width, height] = orientation === 'landscape' 
          ? [template.heightMM, template.widthMM] 
          : [template.widthMM, template.heightMM];

        setCustomDimensions(prev => ({
          ...prev,
          width: { value: width, unit: 'mm' },
          height: { value: height, unit: 'mm' },
          widthMM: width,
          heightMM: height
        }));
      }
    }
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    setCustomDimensions(prev => {
      const newWidth = orientation === 'landscape' ? prev.heightMM : prev.widthMM;
      const newHeight = orientation === 'landscape' ? prev.widthMM : prev.heightMM;
      
      return {
        ...prev,
        orientation,
        widthMM: newWidth,
        heightMM: newHeight,
        width: { value: convertFromMM(newWidth, prev.width.unit), unit: prev.width.unit },
        height: { value: convertFromMM(newHeight, prev.height.unit), unit: prev.height.unit }
      };
    });
  };

  const handleCustomDimensionChange = (dimension: 'width' | 'height', value: number, unit: Unit) => {
    const valueMM = convertToMM(value, unit);
    
    setCustomDimensions(prev => ({
      ...prev,
      [dimension]: { value, unit },
      [`${dimension}MM`]: valueMM
    }));

    // Switch to custom template when dimensions are manually changed
    if (selectedTemplate !== 'custom') {
      setSelectedTemplate('custom');
    }
  };

  /**
   * Enhanced vector file processing with scaling
   */
  const calculateScaledDimensions = (
    originalDimensions: VectorDimensions,
    targetPageDimensions: PageDimensions,
    scalingOptions: ScalingOptions
  ): { scaledDimensions: VectorDimensions; scalingInfo: ScalingInfo } => {
    const originalWidthMM = originalDimensions.width;
    const originalHeightMM = originalDimensions.height;
    
    const pageWidthMM = targetPageDimensions.widthMM - bleedSettings.left - bleedSettings.right;
    const pageHeightMM = targetPageDimensions.heightMM - bleedSettings.top - bleedSettings.bottom;

    let scaleFactor = 1;
    let needsScaling = false;
    let fitsInPage = true;
    const warnings: string[] = [];
    let recommendation = '';

    // Calculate scale factor based on mode
    switch (scalingOptions.mode) {
      case 'fit':
        const scaleX = pageWidthMM / originalWidthMM;
        const scaleY = pageHeightMM / originalHeightMM;
        scaleFactor = Math.min(scaleX, scaleY);
        
        if (scaleFactor > 1 && !scalingOptions.allowUpscaling) {
          scaleFactor = 1;
          recommendation = 'Dosya sayfaya sığıyor, ölçeklendirme yapılmadı';
        } else if (scaleFactor > scalingOptions.maxScaleFactor) {
          scaleFactor = scalingOptions.maxScaleFactor;
          warnings.push(`Maksimum ölçek faktörü (${scalingOptions.maxScaleFactor}x) uygulandı`);
        }
        break;

      case 'fill':
        const fillScaleX = pageWidthMM / originalWidthMM;
        const fillScaleY = pageHeightMM / originalHeightMM;
        scaleFactor = Math.max(fillScaleX, fillScaleY);
        warnings.push('Doldur modu: Bazı kısımlar kesilebilir');
        break;

      case 'stretch':
        // Non-uniform scaling - would need separate X/Y factors
        scaleFactor = Math.min(pageWidthMM / originalWidthMM, pageHeightMM / originalHeightMM);
        warnings.push('Esnet modu: Orantılar değişebilir');
        break;

      case 'none':
        scaleFactor = 1;
        if (originalWidthMM > pageWidthMM || originalHeightMM > pageHeightMM) {
          fitsInPage = false;
          warnings.push('Dosya sayfa boyutunu aşıyor');
        }
        break;
    }

    needsScaling = Math.abs(scaleFactor - 1) > 0.01;

    if (needsScaling) {
      if (scaleFactor < 1) {
        recommendation = `Dosya ${(scaleFactor * 100).toFixed(1)}% küçültülecek`;
      } else {
        recommendation = `Dosya ${(scaleFactor * 100).toFixed(1)}% büyütülecek`;
      }
    }

    // Check quality implications
    if (scaleFactor > 1.5) {
      warnings.push('Büyük ölçeklendirme kaliteyi etkileyebilir');
    }

    return {
      scaledDimensions: {
        width: originalWidthMM * scaleFactor,
        height: originalHeightMM * scaleFactor,
        unit: 'mm'
      },
      scalingInfo: {
        scaleFactor,
        fitsInPage,
        needsScaling,
        recommendation,
        warnings
      }
    };
  };

  const processVectorFileEnhanced = (
    design: Design,
    targetPageDimensions: PageDimensions,
    bleedSettings: BleedSettings,
    safeAreaSettings: SafeAreaSettings,
    scalingOptions: ScalingOptions
  ): ProcessedVectorFile => {
    // Extract original dimensions
    let originalDimensions: VectorDimensions;

    try {
      if (design.realDimensionsMM && design.realDimensionsMM !== 'Unknown' && design.realDimensionsMM !== 'Bilinmiyor') {
        const match = design.realDimensionsMM.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
        if (match) {
          originalDimensions = {
            width: parseFloat(match[1]),
            height: parseFloat(match[2]),
            unit: 'mm'
          };
        } else {
          throw new Error('Boyut bilgisi ayrıştırılamadı');
        }
      } else {
        originalDimensions = {
          width: 50,
          height: 30,
          unit: 'mm'
        };
      }
    } catch (error) {
      console.warn('Boyut bilgisi çıkarılırken hata:', error);
      originalDimensions = {
        width: 50,
        height: 30,
        unit: 'mm'
      };
    }

    // Calculate scaling
    const { scaledDimensions, scalingInfo } = calculateScaledDimensions(
      originalDimensions,
      targetPageDimensions,
      scalingOptions
    );

    // Calculate bleed and safe area based on scaled dimensions
    const withBleed = calculateBleedDimensions(scaledDimensions, bleedSettings);
    const safeArea = calculateSafeArea(scaledDimensions, safeAreaSettings);
    const colorProfile = analyzeColorProfile(design.filename, design.type);
    const cropMarks = calculateCropMarks(scaledDimensions, bleedSettings);

    return {
      originalDimensions,
      printDimensions: originalDimensions,
      scaledDimensions,
      withBleed,
      safeArea,
      colorProfile,
      scalingInfo,
      cropMarks
    };
  };

  // File validation and processing functions (existing ones)
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: `Dosya boyutu ${MAX_FILE_SIZE / 1024 / 1024}MB'yi aşamaz` };
    }

    const fileExt = file.name.toLowerCase().split('.').pop();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExt || '')) {
      return { isValid: false, error: 'Sadece PDF, SVG, AI ve EPS dosyaları desteklenir' };
    }

    return { isValid: true };
  };

  const calculateVectorDimensions = (
    width: number,
    height: number,
    unit: 'mm' | 'px' | 'pt' | 'in',
    dpi: number = DEFAULT_DPI
  ): VectorDimensions => {
    let widthMM: number;
    let heightMM: number;

    switch (unit) {
      case 'mm':
        widthMM = width;
        heightMM = height;
        break;
      case 'px':
        widthMM = (width / dpi) * INCHES_TO_MM;
        heightMM = (height / dpi) * INCHES_TO_MM;
        break;
      case 'pt':
        widthMM = width * POINTS_TO_MM;
        heightMM = height * POINTS_TO_MM;
        break;
      case 'in':
        widthMM = width * INCHES_TO_MM;
        heightMM = height * INCHES_TO_MM;
        break;
      default:
        throw new Error(`Desteklenmeyen birim: ${unit}`);
    }

    return {
      width: Math.round(widthMM * 100) / 100,
      height: Math.round(heightMM * 100) / 100,
      unit: 'mm',
      dpi: unit === 'px' ? dpi : undefined
    };
  };

  const calculateBleedDimensions = (
    dimensions: VectorDimensions,
    bleedSettings: BleedSettings
  ): VectorDimensions => {
    const widthWithBleed = dimensions.width + bleedSettings.left + bleedSettings.right;
    const heightWithBleed = dimensions.height + bleedSettings.top + bleedSettings.bottom;

    return {
      width: Math.round(widthWithBleed * 100) / 100,
      height: Math.round(heightWithBleed * 100) / 100,
      unit: 'mm'
    };
  };

  const calculateSafeArea = (
    dimensions: VectorDimensions,
    safeAreaSettings: SafeAreaSettings
  ): VectorDimensions => {
    const safeWidth = dimensions.width - safeAreaSettings.left - safeAreaSettings.right;
    const safeHeight = dimensions.height - safeAreaSettings.top - safeAreaSettings.bottom;

    return {
      width: Math.max(0, Math.round(safeWidth * 100) / 100),
      height: Math.max(0, Math.round(safeHeight * 100) / 100),
      unit: 'mm'
    };
  };

  const calculateCropMarks = (
    dimensions: VectorDimensions,
    bleedSettings: BleedSettings
  ): CropMarkSettings => {
    const averageBleed = (bleedSettings.top + bleedSettings.bottom + bleedSettings.left + bleedSettings.right) / 4;

    return {
      enabled: true,
      length: 5,
      offset: Math.max(2, averageBleed / 2 + 2),
      lineWidth: 0.25
    };
  };

  const analyzeColorProfile = (filename: string, fileType: string): ColorProfileInfo => {
    let profile: ColorProfile = 'UNKNOWN';
    let isValid = true;
    let recommendation = '';

    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'pdf':
        profile = 'CMYK';
        recommendation = 'PDF dosyası tespit edildi. Baskı için CMYK profili önerilir.';
        break;
      case 'ai':
        profile = 'CMYK';
        recommendation = 'Adobe Illustrator dosyası. Baskı için ideal formattır.';
        break;
      case 'eps':
        profile = 'CMYK';
        recommendation = 'EPS dosyası. Profesyonel baskı için uygundur.';
        break;
      case 'svg':
        profile = 'RGB';
        isValid = false;
        recommendation = 'SVG dosyası RGB renk uzayında. Baskı için CMYK\'ya çevrilmesi önerilir.';
        break;
      default:
        profile = 'UNKNOWN';
        isValid = false;
        recommendation = 'Renk profili belirlenemedi. Manuel kontrol gerekli.';
    }

    return {
      profile,
      isValid,
      recommendation
    };
  };

  const evaluateDPIQuality = (dpi: number): { level: string; recommendation: string; color: string } => {
    if (dpi >= 300) {
      return {
        level: 'Yüksek Kalite',
        recommendation: 'Profesyonel baskı için ideal',
        color: 'text-green-600'
      };
    } else if (dpi >= 150) {
      return {
        level: 'Orta Kalite',
        recommendation: 'Günlük baskılar için uygun',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'Düşük Kalite',
        recommendation: 'Baskı kalitesi düşük olabilir',
        color: 'text-red-600'
      };
    }
  };

  // Error handler
  const handleError = (error: unknown, defaultMessage: string) => {
    console.error('Error:', error);

    let errorMessage = defaultMessage;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as ApiError).message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    toast({
      title: "Hata",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Get designs
  const { 
    data: designs = [], 
    refetch: refetchDesigns, 
    isLoading: designsLoading, 
    error: designsError 
  } = useQuery<Design[]>({
    queryKey: ['/api/automation/plotter/designs'],
    queryFn: async () => {
      try {
        const response = await apiRequest<Design[]>('GET', '/api/automation/plotter/designs');
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Failed to fetch designs:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<UploadResponse> => {
      setUploadProgress(0);
      setIsProcessing(true);

      try {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 90);
              setUploadProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadProgress(100);
                const response = JSON.parse(xhr.responseText) as UploadResponse;
                resolve(response);
              } catch (parseError) {
                reject(new Error('Sunucu yanıtı işlenemedi'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText) as ApiError;
                reject(new Error(errorResponse.message || `HTTP ${xhr.status}: Yükleme başarısız`));
              } catch {
                reject(new Error(`HTTP ${xhr.status}: Yükleme başarısız`));
              }
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Ağ hatası: Dosya yüklenemedi'));
          });

          xhr.addEventListener('timeout', () => {
            reject(new Error('Zaman aşımı: Dosya yükleme işlemi çok uzun sürdü'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Yükleme iptal edildi'));
          });

          xhr.open('POST', '/api/automation/plotter/upload-designs');
          xhr.timeout = 300000;
          xhr.send(formData);
        });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    onSuccess: (data: UploadResponse) => {
      const uploadedCount = data.designs?.length || 0;
      toast({
        title: "Başarılı",
        description: `${uploadedCount} dosya yüklendi ve işlendi.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      refetchDesigns();
    },
    onError: (error: unknown) => {
      handleError(error, "Dosya yükleme başarısız");
    },
  });

  // Auto-arrange mutation
  const autoArrangeMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!Array.isArray(designs) || designs.length === 0) {
        throw new Error('Dizim yapılacak tasarım bulunamadı');
      }

      const designIds = designs.map((d: Design) => d.id);
      console.log('Starting auto-arrange with designs:', designIds);

      try {
        const result = await apiRequest<ArrangementResult>('POST', '/api/automation/plotter/auto-arrange', {
          designIds,
          plotterSettings
        });

        if (!result || typeof result !== 'object') {
          throw new Error('Geçersiz dizim sonucu alındı');
        }

        if (!Array.isArray(result.arrangements)) {
          console.warn('Arrangements is not an array:', result.arrangements);
          result.arrangements = [];
        }

        return result;
      } catch (error) {
        console.error('Auto-arrange API error:', error);
        throw error;
      }
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('Arrangement response received:', data);
      setArrangements(data);

      if (!data.arrangements || data.arrangements.length === 0 || data.totalArranged === 0) {
        toast({
          title: "Uyarı",
          description: "Hiçbir tasarım baskı alanına sığmadı. Tasarım boyutlarını kontrol edin.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi (${data.efficiency} verimlilik)`,
      });

      if (data.arrangements.length > 0) {
        setTimeout(() => {
          const pdfData = {
            plotterSettings: plotterSettings,
            arrangements: data.arrangements
          };
          console.log('Sending to PDF generation:', pdfData);
          generatePdfMutation.mutate(pdfData);
        }, 1000);
      }
    },
    onError: (error: unknown) => {
      handleError(error, "Otomatik dizim başarısız");
    },
  });

  // PDF generation mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (data: { plotterSettings: PlotterSettings; arrangements: ArrangementItem[] }): Promise<Blob> => {
      if (!data.arrangements || !Array.isArray(data.arrangements) || data.arrangements.length === 0) {
        throw new Error('PDF oluşturmak için dizim verisi bulunamadı');
      }

      console.log('Generating PDF with data:', data);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch('/api/automation/plotter/generate-pdf', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/pdf'
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json() as ApiError;
            throw new Error(errorData.message || `PDF oluşturulamadı: ${response.status}`);
          } else {
            const errorText = await response.text();
            throw new Error(`PDF oluşturulamadı: ${response.status} - ${errorText}`);
          }
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Boş PDF dosyası oluşturuldu');
        }

        try {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `matbixx-dizim-${new Date().toISOString().slice(0, 10)}.pdf`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
        } catch (downloadError) {
          console.error('Download error:', downloadError);
        }

        return blob;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('PDF oluşturma işlemi zaman aşımına uğradı');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "PDF İndirildi",
        description: "Dizim PDF'i başarıyla oluşturuldu ve indirildi.",
      });
    },
    onError: (error: unknown) => {
      handleError(error, "PDF oluşturulamadı");
    },
  });

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Files selected:', files.length);

    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const validation = validateFile(file);
      if (!validation.isValid) {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Geçersiz Dosyalar",
        description: invalidFiles.join(', '),
        variant: "destructive",
      });

      if (validFiles.length === 0) {
        event.target.value = '';
        return;
      }
    }

    if (validFiles.length === 0) {
      toast({
        title: "Hata",
        description: "Yüklenecek geçerli dosya bulunamadı",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => {
      console.log(`Adding file to FormData:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });
      formData.append('designs', file);
    });

    console.log('Uploading files...');
    uploadMutation.mutate(formData);

    event.target.value = '';
  };

  // Clear designs function
  const clearAllDesigns = async () => {
    try {
      const response = await fetch('/api/automation/plotter/designs/clear', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || 'Dosyalar temizlenemedi');
      }

      await refetchDesigns();
      setArrangements(null);
      toast({
        title: "Temizlendi",
        description: "Tüm dosyalar temizlendi.",
      });
    } catch (error) {
      handleError(error, "Dosyalar temizlenemedi");
    }
  };

  // Loading state component
  const LoadingState = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  // Error state component
  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="text-center py-8">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
      <p className="text-red-600 mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Tekrar Dene
      </Button>
    </div>
  );

  // Check if system is busy
  const isBusy = uploadMutation.isPending || autoArrangeMutation.isPending || generatePdfMutation.isPending || isProcessing;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dinamik Vektörel Dizim Sistemi
        </h1>
        <p className="text-gray-600">
          Özelleştirilebilir Sayfa Boyutları | Gelişmiş Vektörel Dosya İşleme
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page Size Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Sayfa Boyutu Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTemplate === 'custom' ? 'custom' : 'templates'} 
                  onValueChange={(value) => value === 'custom' && setSelectedTemplate('custom')} 
                  className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Şablonlar</TabsTrigger>
                <TabsTrigger value="custom">Özel Boyut</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="template-select" className="text-sm font-medium">Kağıt Şablonu</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şablon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(
                        PAPER_TEMPLATES.reduce((groups, template) => {
                          if (!groups[template.category]) groups[template.category] = [];
                          groups[template.category].push(template);
                          return groups;
                        }, {} as Record<string, PaperTemplate[]>)
                      ).map(([category, templates]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                            {category}
                          </div>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{template.name}</span>
                                <span className="text-xs text-gray-500 ml-2">{template.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="custom-width" className="text-xs">Genişlik</Label>
                    <div className="flex gap-1">
                      <input
                        id="custom-width"
                        type="number"
                        min="1"
                        step="0.1"
                        value={customDimensions.width.value}
                        onChange={(e) => handleCustomDimensionChange('width', parseFloat(e.target.value) || 0, customDimensions.width.unit)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                      <Select value={customDimensions.width.unit} 
                              onValueChange={(unit: Unit) => handleCustomDimensionChange('width', customDimensions.width.value, unit)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="inch">inch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="custom-height" className="text-xs">Yükseklik</Label>
                    <div className="flex gap-1">
                      <input
                        id="custom-height"
                        type="number"
                        min="1"
                        step="0.1"
                        value={customDimensions.height.value}
                        onChange={(e) => handleCustomDimensionChange('height', parseFloat(e.target.value) || 0, customDimensions.height.unit)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                      <Select value={customDimensions.height.unit} 
                              onValueChange={(unit: Unit) => handleCustomDimensionChange('height', customDimensions.height.value, unit)}>
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="inch">inch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Orientation Controls */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">Yönlendirme</Label>
              <div className="flex gap-2">
                <Button
                  variant={currentPageDimensions.orientation === 'portrait' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleOrientationChange('portrait')}
                  className="flex-1"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-4 border border-current"></div>
                    Dikey
                  </div>
                </Button>
                <Button
                  variant={currentPageDimensions.orientation === 'landscape' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleOrientationChange('landscape')}
                  className="flex-1"
                >
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 border border-current"></div>
                    Yatay
                  </div>
                </Button>
              </div>
            </div>

            {/* Current Dimensions Display */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Mevcut Sayfa Boyutu</div>
              <div className="text-lg font-bold text-blue-800">
                {formatDimension(currentPageDimensions.widthMM, 'mm')} × {formatDimension(currentPageDimensions.heightMM, 'mm')}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Kullanılabilir Alan: {formatDimension(currentPageDimensions.widthMM - bleedSettings.left - bleedSettings.right, 'mm')} × {formatDimension(currentPageDimensions.heightMM - bleedSettings.top - bleedSettings.bottom, 'mm')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload and Files */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Vektörel Dosya Yükleme ve İşleme
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
                  disabled={isBusy}
                />
                <Label htmlFor="file-upload" className={`cursor-pointer ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    Vektörel dosyaları seçin
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, SVG, AI, EPS formatları desteklenir (Max: 100MB)
                  </p>
                </Label>
              </div>

              {/* Upload Progress */}
              {(uploadMutation.isPending || uploadProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">
                      {isProcessing ? 'Dosyalar işleniyor...' : 'Dosyalar yükleniyor...'}
                    </span>
                    <span className="text-blue-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Designs List */}
              {designsLoading && <LoadingState message="Tasarımlar yükleniyor..." />}

              {designsError && (
                <ErrorState 
                  message="Tasarımlar yüklenemedi" 
                  onRetry={() => refetchDesigns()} 
                />
              )}

              {!designsLoading && !designsError && designs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Yüklenen Dosyalar ({designs.length})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllDesigns}
                      disabled={isBusy}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Tümünü Temizle
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {designs.map((design: Design) => {
                      const processedFile = processVectorFileEnhanced(
                        design, 
                        currentPageDimensions, 
                        bleedSettings, 
                        safeAreaSettings, 
                        scalingOptions
                      );
                      return (
                        <div key={design.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium truncate flex-1 mr-2">{design.filename}</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="font-medium text-gray-600">Orijinal Boyut:</span>
                              <p className="text-gray-800">
                                {processedFile.originalDimensions.width}×{processedFile.originalDimensions.height}mm
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Ölçekli Boyut:</span>
                              <p className={`${processedFile.scalingInfo.needsScaling ? 'text-blue-600 font-medium' : 'text-gray-800'}`}>
                                {processedFile.scaledDimensions.width.toFixed(1)}×{processedFile.scaledDimensions.height.toFixed(1)}mm
                                {processedFile.scalingInfo.needsScaling && (
                                  <span className="ml-1">({(processedFile.scalingInfo.scaleFactor * 100).toFixed(0)}%)</span>
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Kesim Payı ile:</span>
                              <p className="text-purple-600">
                                {processedFile.withBleed.width.toFixed(1)}×{processedFile.withBleed.height.toFixed(1)}mm
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Renk Profili:</span>
                              <Badge 
                                variant={processedFile.colorProfile.isValid ? "default" : "destructive"} 
                                className="text-xs"
                              >
                                {processedFile.colorProfile.profile}
                              </Badge>
                            </div>
                          </div>

                          {/* Scaling Info */}
                          {processedFile.scalingInfo.needsScaling && (
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <p className="text-blue-800 font-medium">📏 {processedFile.scalingInfo.recommendation}</p>
                              {processedFile.scalingInfo.warnings.map((warning, index) => (
                                <p key={index} className="text-blue-700 mt-1">⚠️ {warning}</p>
                              ))}
                            </div>
                          )}

                          {/* Fit Status */}
                          <div className="mt-2 flex items-center justify-between">
                            <Badge 
                              variant={processedFile.scalingInfo.fitsInPage ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {processedFile.scalingInfo.fitsInPage ? '✓ Sayfaya Sığıyor' : '✗ Sayfa Taşıyor'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Güvenli Alan: {processedFile.safeArea.width.toFixed(1)}×{processedFile.safeArea.height.toFixed(1)}mm
                            </span>
                          </div>

                          {!processedFile.colorProfile.isValid && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <p className="text-yellow-800">⚠️ {processedFile.colorProfile.recommendation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!designsLoading && !designsError && designs.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz dosya yüklenmedi</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gelişmiş Ayarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scaling Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Ölçeklendirme Seçenekleri</Label>
              
              <div>
                <Label htmlFor="scaling-mode" className="text-xs">Ölçekleme Modu</Label>
                <Select value={scalingOptions.mode} 
                        onValueChange={(mode: 'fit' | 'fill' | 'stretch' | 'none') => 
                          setScalingOptions(prev => ({ ...prev, mode }))}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Sığdır (Fit)</SelectItem>
                    <SelectItem value="fill">Doldur (Fill)</SelectItem>
                    <SelectItem value="stretch">Esnet (Stretch)</SelectItem>
                    <SelectItem value="none">Ölçekleme (None)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintain-aspect"
                  checked={scalingOptions.maintainAspectRatio}
                  onCheckedChange={(checked) => 
                    setScalingOptions(prev => ({ ...prev, maintainAspectRatio: checked }))}
                />
                <Label htmlFor="maintain-aspect" className="text-xs cursor-pointer">
                  Oranları koru
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-upscaling"
                  checked={scalingOptions.allowUpscaling}
                  onCheckedChange={(checked) => 
                    setScalingOptions(prev => ({ ...prev, allowUpscaling: checked }))}
                />
                <Label htmlFor="allow-upscaling" className="text-xs cursor-pointer">
                  Büyütmeye izin ver
                </Label>
              </div>

              <div>
                <Label htmlFor="max-scale" className="text-xs">Maksimum Ölçek (x{scalingOptions.maxScaleFactor})</Label>
                <input
                  id="max-scale"
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={scalingOptions.maxScaleFactor}
                  onChange={(e) => setScalingOptions(prev => ({ ...prev, maxScaleFactor: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Bleed Settings */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Kesim Payları (mm)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBleedSettings({ top: 3, bottom: 3, left: 3, right: 3 })}
                  className="text-xs h-6 px-2"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="bleed-top" className="text-xs">Üst</Label>
                  <input
                    id="bleed-top"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.top}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, top: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="bleed-bottom" className="text-xs">Alt</Label>
                  <input
                    id="bleed-bottom"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.bottom}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, bottom: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="bleed-left" className="text-xs">Sol</Label>
                  <input
                    id="bleed-left"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.left}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, left: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="bleed-right" className="text-xs">Sağ</Label>
                  <input
                    id="bleed-right"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.right}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, right: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">Kalite Kontrolleri</Label>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="crop-marks"
                  checked={showCropMarks}
                  onCheckedChange={setShowCropMarks}
                />
                <Label htmlFor="crop-marks" className="text-xs cursor-pointer">
                  Kesim işaretleri ekle
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="color-profile"
                  checked={colorProfileCheck}
                  onCheckedChange={setColorProfileCheck}
                />
                <Label htmlFor="color-profile" className="text-xs cursor-pointer">
                  Renk profili kontrolü
                </Label>
              </div>

              <div>
                <Label htmlFor="dpi-warning" className="text-xs">DPI Uyarı Seviyesi: {dpiWarningLevel}</Label>
                <input
                  id="dpi-warning"
                  type="range"
                  min="72"
                  max="300"
                  step="25"
                  value={dpiWarningLevel}
                  onChange={(e) => setDpiWarningLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>72 DPI</span>
                  <span>300 DPI</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Dizim Önizlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {arrangements && arrangements.arrangements && arrangements.arrangements.length > 0 ? (
              <div className="space-y-4">
                <div 
                  className="relative border-2 border-dashed border-gray-300 mx-auto bg-gray-50"
                  style={{
                    width: '300px',
                    height: `${(300 * currentPageDimensions.heightMM) / currentPageDimensions.widthMM}px`,
                    maxHeight: '400px'
                  }}
                >
                  {arrangements.arrangements.map((item: ArrangementItem, index: number) => (
                    <div
                      key={`${item.designId}-${index}`}
                      className="absolute bg-blue-200 border border-blue-500 rounded flex items-center justify-center text-xs font-bold text-blue-800"
                      style={{
                        left: `${(item.x / currentPageDimensions.widthMM) * 85}%`,
                        top: `${(item.y / currentPageDimensions.heightMM) * 85}%`,
                        width: `${Math.max(15, (item.width / currentPageDimensions.widthMM) * 85)}px`,
                        height: `${Math.max(10, (item.height / currentPageDimensions.heightMM) * 85)}px`,
                      }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    {formatDimension(currentPageDimensions.widthMM, 'mm')} × {formatDimension(currentPageDimensions.heightMM, 'mm')} | {arrangements.totalArranged} tasarım dizildi
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
            Otomatik İşlem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button
              size="lg"
              onClick={() => autoArrangeMutation.mutate()}
              disabled={designs.length === 0 || isBusy}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold disabled:opacity-50"
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
                <div className="animate-pulse text-green-600 font-medium">PDF oluşturuluyor ve indiriliyor...</div>
                <div className="mt-2">
                  <Progress value={75} className="w-48" />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center max-w-md">
              Tüm vektörel dosyalarınız {formatDimension(currentPageDimensions.widthMM, 'mm')} × {formatDimension(currentPageDimensions.heightMM, 'mm')} 
              boyutundaki sayfaya otomatik olarak yerleştirilecek ve PDF olarak indirilecek.
            </p>

            {/* Status indicators */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${designs.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Dosyalar Yüklendi</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${arrangements ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Dizim Tamamlandı</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${generatePdfMutation.isSuccess ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>PDF İndirildi</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
