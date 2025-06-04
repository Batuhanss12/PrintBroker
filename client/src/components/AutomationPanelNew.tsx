import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import ValidationPanel from "./ValidationPanel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Eye, FileText, Zap, Trash2, AlertCircle, CheckCircle, Settings, Ruler, RotateCcw, Maximize2 } from "lucide-react";

// Lazy Image Component with Intersection Observer
const LazyImage = memo(({ src, alt, className, onLoad, ...props }: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  [key: string]: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  return (
    <div ref={imgRef} className={className} {...props}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
        />
      )}
      {!isLoaded && isInView && (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Yükleniyor...</div>
        </div>
      )}
    </div>
  );
});

// Enhanced Preview Renderer with proper scaling and visual feedback
const EnhancedPreviewRenderer = memo(({ 
  arrangements, 
  pageWidth, 
  pageHeight, 
  designs,
  bleedSettings,
  isLoading = false,
  error = null 
}: {
  arrangements: ArrangementItem[];
  pageWidth: number;
  pageHeight: number;
  designs: Design[];
  bleedSettings: BleedSettings;
  isLoading?: boolean;
  error?: string | null;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [renderStats, setRenderStats] = useState({ efficiency: 0, itemCount: 0 });

  // Calculate optimal canvas dimensions maintaining aspect ratio
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current || !pageWidth || !pageHeight) return { width: 400, height: 300 };

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40; // Account for padding
    const containerHeight = 350; // Fixed height for consistency

    // Calculate scale to fit page in container while maintaining aspect ratio
    const scaleX = containerWidth / pageWidth;
    const scaleY = containerHeight / pageHeight;
    const scale = Math.min(scaleX, scaleY, 2); // Max 2x scale

    const canvasWidth = pageWidth * scale;
    const canvasHeight = pageHeight * scale;

    return {
      width: Math.max(300, canvasWidth),
      height: Math.max(200, canvasHeight)
    };
  }, [pageWidth, pageHeight]);

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      const newSize = calculateCanvasSize();
      setCanvasSize(newSize);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [calculateCanvasSize]);

  // Enhanced render function with proper scaling
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    // Set high DPI for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvasSize.width * zoom;
    const displayHeight = canvasSize.height * zoom;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Calculate scale factor from mm to canvas pixels
    const scaleX = canvasSize.width / pageWidth;
    const scaleY = canvasSize.height / pageHeight;

    // Draw page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw page border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid for better visual reference
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    const gridSize = 50; // 50mm grid
    const gridPixelsX = gridSize * scaleX;
    const gridPixelsY = gridSize * scaleY;

    for (let x = gridPixelsX; x < canvasSize.width; x += gridPixelsX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }

    for (let y = gridPixelsY; y < canvasSize.height; y += gridPixelsY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Draw bleed margins
    if (bleedSettings) {
      const marginLeft = bleedSettings.left * scaleX;
      const marginTop = bleedSettings.top * scaleY;
      const marginRight = bleedSettings.right * scaleX;
      const marginBottom = bleedSettings.bottom * scaleY;

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        marginLeft,
        marginTop,
        canvasSize.width - marginLeft - marginRight,
        canvasSize.height - marginTop - marginBottom
      );
      ctx.setLineDash([]);
    }

    // Render arrangements with proper positioning
    let validItemCount = 0;
    let totalArea = 0;

    if (arrangements && arrangements.length > 0) {
      arrangements.forEach((item, index) => {
        // Convert mm coordinates to canvas pixels
        const x = item.x * scaleX;
        const y = item.y * scaleY;
        const w = item.width * scaleX;
        const h = item.height * scaleY;

        // Validate dimensions
        if (w > 0 && h > 0 && x >= 0 && y >= 0) {
          validItemCount++;
          totalArea += item.width * item.height;

          // Generate distinct colors for each item
          const hue = (index * 137.5) % 360;
          const saturation = 70;
          const lightness = 75;

          // Draw item background
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          ctx.fillRect(x, y, w, h);

          // Draw item border
          ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness - 25}%)`;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          // Draw margins if available
          if (item.withMargins) {
            const marginW = (item.withMargins.width - item.width) * scaleX / 2;
            const marginH = (item.withMargins.height - item.height) * scaleY / 2;
            
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(x - marginW, y - marginH, w + marginW * 2, h + marginH * 2);
            ctx.setLineDash([]);
          }

          // Draw item label
          const fontSize = Math.max(10, Math.min(w / 6, h / 3, 14));
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, 25%)`;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Find corresponding design
          const design = designs.find(d => d.id === item.designId);
          const label = `${index + 1}`;
          
          ctx.fillText(label, x + w/2, y + h/2);

          // Add filename if space allows
          if (w > 80 && h > 50 && design) {
            const smallFontSize = Math.max(8, fontSize * 0.7);
            ctx.font = `${smallFontSize}px Arial, sans-serif`;
            const maxNameLength = Math.floor(w / 6);
            const shortName = design.filename.length > maxNameLength ? 
              design.filename.substring(0, maxNameLength - 3) + '...' : 
              design.filename;
            ctx.fillText(shortName, x + w/2, y + h/2 + fontSize + 2);
          }

          // Add dimensions info
          if (w > 60 && h > 40) {
            const dimFontSize = Math.max(7, fontSize * 0.6);
            ctx.font = `${dimFontSize}px Arial, sans-serif`;
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, 35%)`;
            ctx.fillText(
              `${Math.round(item.width)}×${Math.round(item.height)}mm`, 
              x + w/2, 
              y + h - dimFontSize - 2
            );
          }
        }
      });
    }

    ctx.restore();

    // Update render stats
    const pageArea = pageWidth * pageHeight;
    const efficiency = pageArea > 0 ? (totalArea / pageArea) * 100 : 0;
    setRenderStats({ efficiency, itemCount: validItemCount });

    const renderTime = performance.now() - startTime;
    
    // Draw loading state
    if (isLoading) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Dizilim hesaplanıyor...', displayWidth / 2, displayHeight / 2);
      
      // Spinning loader
      const time = Date.now() / 200;
      ctx.save();
      ctx.translate(displayWidth / 2, displayHeight / 2 - 30);
      ctx.rotate(time);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }

    // Draw error state
    if (error) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);
      
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❌ Dizilim Hatası', displayWidth / 2, displayHeight / 2 - 10);
      
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(error, displayWidth / 2, displayHeight / 2 + 10);
    }

  }, [
    arrangements, 
    pageWidth, 
    pageHeight, 
    designs, 
    bleedSettings, 
    canvasSize, 
    zoom, 
    pan, 
    isLoading, 
    error
  ]);

  // Render on dependencies change
  useEffect(() => {
    const timeoutId = setTimeout(renderPreview, 10);
    return () => clearTimeout(timeoutId);
  }, [renderPreview]);

  // Animation loop for loading state
  useEffect(() => {
    if (!isLoading) return;
    
    const animate = () => {
      renderPreview();
      if (isLoading) {
        requestAnimationFrame(animate);
      }
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isLoading, renderPreview]);

  // Mouse event handlers for pan and zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;

    setPan(prev => ({
      x: prev.x + deltaX / zoom,
      y: prev.y + deltaY / zoom
    }));

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const downloadPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `matbixx-preview-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetView}
            disabled={isLoading}
            className="h-8 px-2 text-xs"
          >
            Sıfırla
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={downloadPreview}
            disabled={isLoading || !arrangements.length}
            className="h-8 px-2 text-xs"
          >
            PNG İndir
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          {renderStats.itemCount > 0 && (
            <>
              <span>•</span>
              <span>{renderStats.itemCount} parça</span>
              <span>•</span>
              <span>{renderStats.efficiency.toFixed(1)}% verimlilik</span>
            </>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`block mx-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>

      {/* Status Info */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-medium text-gray-900">
            {arrangements?.length || 0}
          </div>
          <div className="text-gray-500 text-xs">Yerleştirilen</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {pageWidth}×{pageHeight}mm
          </div>
          <div className="text-gray-500 text-xs">Sayfa Boyutu</div>
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {renderStats.efficiency.toFixed(1)}%
          </div>
          <div className="text-gray-500 text-xs">Alan Verimliliği</div>
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && !error && (!arrangements || arrangements.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Dizilim yapıldığında önizleme görünecek</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Optimized Design List Component
const OptimizedDesignList = memo(({ designs, processVectorFileEnhanced, currentPageDimensions, bleedSettings, safeAreaSettings, scalingOptions }: {
  designs: Design[];
  processVectorFileEnhanced: any;
  currentPageDimensions: any;
  bleedSettings: any;
  safeAreaSettings: any;
  scalingOptions: any;
}) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < designs.length) {
          setVisibleCount(prev => Math.min(prev + 10, designs.length));
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, designs.length]);

  const visibleDesigns = useMemo(() => 
    designs.slice(0, visibleCount), 
    [designs, visibleCount]
  );

  return (
    <div className="max-h-60 overflow-y-auto space-y-3">
      {visibleDesigns.map((design: Design) => {
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
      
      {visibleCount < designs.length && (
        <div ref={loadMoreRef} className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Daha fazla yükleniyor...</p>
        </div>
      )}
    </div>
  );
});

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

// Advanced Layout Optimization Interfaces
interface OptimizationOptions {
  mode: 'maximum_efficiency' | 'fast_layout' | 'balanced' | 'custom';
  allowRotation: boolean;
  rotationSteps: number; // 45, 90, 180 degrees
  prioritizeSpacing: boolean;
  minimumSpacing: number; // mm
  maximumSpacing: number; // mm
  packingTightness: number; // 0-1 scale
  allowUpscaling: boolean;
  maxUpscaleRatio: number;
  allowDownscaling: boolean;
  minDownscaleRatio: number;
}

interface LayoutAlgorithmResult {
  items: OptimizedArrangementItem[];
  efficiency: number;
  wastePercentage: number;
  totalArea: number;
  usedArea: number;
  estimatedCost: number;
  alternativeLayouts?: LayoutAlgorithmResult[];
  performance: {
    algorithmUsed: string;
    executionTime: number;
    iterations: number;
  };
}

interface OptimizedArrangementItem extends ArrangementItem {
  rotation: number; // degrees
  scaleFactor: number;
  isRotated: boolean;
  isScaled: boolean;
  priority: number;
  originalItem: Design;
  costContribution: number;
}

interface CostAnalysis {
  materialCost: number;
  wasteCost: number;
  cuttingCost: number;
  totalCost: number;
  costPerItem: number;
  wastePercentage: number;
  suggestions: string[];
  alternatives: {
    layout: LayoutAlgorithmResult;
    description: string;
    savings: number;
  }[];
}

interface MultiFormatLayout {
  formats: {
    pageSize: PageDimensions;
    layout: LayoutAlgorithmResult;
    costAnalysis: CostAnalysis;
  }[];
  recommended: number; // index of best option
  comparison: {
    efficiency: number[];
    cost: number[];
    waste: number[];
  };
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

  // Advanced optimization settings
  const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
    mode: 'maximum_efficiency',
    allowRotation: true,
    rotationSteps: 90,
    prioritizeSpacing: false,
    minimumSpacing: 2,
    maximumSpacing: 5,
    packingTightness: 0.8,
    allowUpscaling: false,
    maxUpscaleRatio: 1.2,
    allowDownscaling: true,
    minDownscaleRatio: 0.8
  });

  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [multiFormatResults, setMultiFormatResults] = useState<MultiFormatLayout | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

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
  const [optimizationLevel, setOptimizationLevel] = useState<'basic' | 'advanced' | 'expert'>('advanced');
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<'binpack' | 'genetic' | 'grid'>('binpack');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Validasyon state'leri
  const [pageValidation, setPageValidation] = useState<any>(null);
  const [fileValidations, setFileValidations] = useState<any[]>([]);
  const [layoutValidation, setLayoutValidation] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);

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
   * Advanced Layout Optimization Algorithms
   */

  // Bin Packing Algorithm with Rotation Support
  const advancedBinPacking = (
    items: Design[],
    pageWidth: number,
    pageHeight: number,
    options: OptimizationOptions
  ): LayoutAlgorithmResult => {
    const startTime = performance.now();
    let iterations = 0;

    const processedItems = items.map((item, index) => {
      const dims = extractDimensions(item);
      return {
        id: item.id,
        originalWidth: dims.width,
        originalHeight: dims.height,
        width: dims.width,
        height: dims.height,
        area: dims.width * dims.height,
        aspectRatio: dims.width / dims.height,
        priority: calculateItemPriority(item, options),
        originalItem: item,
        placed: false,
        x: 0,
        y: 0,
        rotation: 0,
        scaleFactor: 1,
        isRotated: false,
        isScaled: false
      };
    });

    // Sort by priority and area
    processedItems.sort((a, b) => {
      if (options.mode === 'maximum_efficiency') {
        return b.area - a.area; // Largest first
      } else if (options.mode === 'fast_layout') {
        return a.priority - b.priority; // Priority first
      }
      return b.area * b.priority - a.area * a.priority; // Balanced
    });

    const placedItems: OptimizedArrangementItem[] = [];
    const freeRectangles = [{ x: 0, y: 0, width: pageWidth, height: pageHeight }];

    for (const item of processedItems) {
      iterations++;
      let bestPlacement = null;
      let bestScore = -1;

      // Try different orientations if rotation is allowed
      const orientations = options.allowRotation ? 
        [0, options.rotationSteps, options.rotationSteps * 2, options.rotationSteps * 3].filter(r => r < 360) : 
        [0];

      for (const rotation of orientations) {
        const [itemWidth, itemHeight] = rotation % 180 === 0 ? 
          [item.width, item.height] : [item.height, item.width];

        // Try different scale factors
        const scaleFactors = generateScaleFactors(options);

        for (const scaleFactor of scaleFactors) {
          const scaledWidth = itemWidth * scaleFactor + options.minimumSpacing;
          const scaledHeight = itemHeight * scaleFactor + options.minimumSpacing;

          if (scaledWidth > pageWidth || scaledHeight > pageHeight) continue;

          // Find best position using Bottom-Left-Fill heuristic
          for (let rectIndex = 0; rectIndex < freeRectangles.length; rectIndex++) {
            const rect = freeRectangles[rectIndex];

            if (scaledWidth <= rect.width && scaledHeight <= rect.height) {
              const score = calculatePlacementScore(
                rect.x, rect.y, scaledWidth, scaledHeight, 
                placedItems, options, pageWidth, pageHeight
              );

              if (score > bestScore) {
                bestScore = score;
                bestPlacement = {
                  x: rect.x,
                  y: rect.y,
                  width: scaledWidth - options.minimumSpacing,
                  height: scaledHeight - options.minimumSpacing,
                  rotation,
                  scaleFactor,
                  rectIndex,
                  isRotated: rotation !== 0,
                  isScaled: Math.abs(scaleFactor - 1) > 0.01
                };
              }
            }
          }
        }
      }

      if (bestPlacement) {
        const optimizedItem: OptimizedArrangementItem = {
          designId: item.id,
          x: bestPlacement.x,
          y: bestPlacement.y,
          width: bestPlacement.width,
          height: bestPlacement.height,
          rotation: bestPlacement.rotation,
          scaleFactor: bestPlacement.scaleFactor,
          isRotated: bestPlacement.isRotated,
          isScaled: bestPlacement.isScaled,
          priority: item.priority,
          originalItem: item.originalItem,
          costContribution: calculateItemCost(bestPlacement, options)
        };

        placedItems.push(optimizedItem);

        // Update free rectangles using maximal rectangles algorithm
        updateFreeRectangles(
          freeRectangles, 
          bestPlacement.x, 
          bestPlacement.y, 
          bestPlacement.width + options.minimumSpacing, 
          bestPlacement.height + options.minimumSpacing
        );
      }
    }

    const totalArea = pageWidth * pageHeight;
    const usedArea = placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
    const efficiency = (usedArea / totalArea) * 100;
    const wastePercentage = 100 - efficiency;

    return {
      items: placedItems,
      efficiency,
      wastePercentage,
      totalArea,
      usedArea,
      estimatedCost: placedItems.reduce((sum, item) => sum + item.costContribution, 0),
      performance: {
        algorithmUsed: 'Advanced Bin Packing with Rotation',
        executionTime: performance.now() - startTime,
        iterations
      }
    };
  };

  // Genetic Algorithm for Complex Layouts
  const geneticLayoutOptimization = (
    items: Design[],
    pageWidth: number,
    pageHeight: number,
    options: OptimizationOptions
  ): LayoutAlgorithmResult => {
    const startTime = performance.now();
    const populationSize = Math.min(50, items.length * 2);
    const generations = Math.min(100, items.length * 5);
    const mutationRate = 0.1;

    let population = initializePopulation(items, pageWidth, pageHeight, populationSize, options);
    let bestSolution = population[0];
    let iterations = 0;

    for (let generation = 0; generation < generations; generation++) {
      iterations++;

      // Evaluate fitness
      population.forEach(individual => {
        individual.fitness = calculateFitness(individual, pageWidth, pageHeight, options);
      });

      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);

      if (population[0].fitness > bestSolution.fitness) {
        bestSolution = { ...population[0] };
      }

      // Create next generation
      const newPopulation = [];

      // Keep best 20%
      const eliteCount = Math.floor(populationSize * 0.2);
      for (let i = 0; i < eliteCount; i++) {
        newPopulation.push({ ...population[i] });
      }

      // Crossover and mutation
      while (newPopulation.length < populationSize) {
        const parent1 = tournamentSelection(population);
        const parent2 = tournamentSelection(population);
        const child = crossover(parent1, parent2, options);

        if (Math.random() < mutationRate) {
          mutate(child, pageWidth, pageHeight, options);
        }

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    const result = convertGeneticSolutionToLayout(bestSolution, items, pageWidth, pageHeight);
    result.performance = {
      algorithmUsed: 'Genetic Algorithm',
      executionTime: performance.now() - startTime,
      iterations
    };

    return result;
  };

  // Multi-Format Layout Comparison
  const generateMultiFormatLayouts = async (
    items: Design[],
    options: OptimizationOptions
  ): Promise<MultiFormatLayout> => {
    const testFormats = [
      currentPageDimensions,
      ...PAPER_TEMPLATES.slice(0, 5).map(template => ({
        width: { value: template.widthMM, unit: 'mm' as Unit },
        height: { value: template.heightMM, unit: 'mm' as Unit },
        widthMM: template.widthMM,
        heightMM: template.heightMM,
        orientation: 'portrait' as const
      }))
    ];

    const results = await Promise.all(
      testFormats.map(async (format) => {
        const layout = await optimizeLayout(items, format, options);
        const costAnalysis = calculateCostAnalysis(layout, format, items.length);

        return {
          pageSize: format,
          layout,
          costAnalysis
        };
      })
    );

    // Find best option based on cost-efficiency balance
    const scores = results.map((result, index) => ({
      index,
      score: (result.layout.efficiency * 0.6) + ((100 - result.costAnalysis.wastePercentage) * 0.4)
    }));

    const recommendedIndex = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    ).index;

    return {
      formats: results,
      recommended: recommendedIndex,
      comparison: {
        efficiency: results.map(r => r.layout.efficiency),
        cost: results.map(r => r.costAnalysis.totalCost),
        waste: results.map(r => r.costAnalysis.wastePercentage)
      }
    };
  };

  // Enhanced Cost Analysis Functions
  const calculateCostAnalysis = (
    layout: LayoutAlgorithmResult,
    pageSize: PageDimensions,
    itemCount: number
  ): CostAnalysis => {
    const materialCostPerSqMM = 0.0012; // Updated: 0.0012 TL per mm²
    const cuttingCostPerMM = 0.015; // Updated: 0.015 TL per mm cutting
    const setupCost = 8; // Updated: 8 TL fixed setup cost
    const complexityCostPerItem = 0.5; // Cost for complex shapes
    const rotationPenalty = 0.1; // Additional cost for rotated items
    const scalingPenalty = 0.15; // Additional cost for scaled items

    const totalArea = pageSize.widthMM * pageSize.heightMM;
    const materialCost = totalArea * materialCostPerSqMM;
    const wasteCost = (totalArea - layout.usedArea) * materialCostPerSqMM;

    // Calculate cutting cost with complexity
    const totalCuttingLength = layout.items.reduce((sum, item) => {
      const perimeter = 2 * (item.width + item.height);
      let complexity = 1;

      // Add complexity for special cases
      if (item.isRotated) complexity += rotationPenalty;
      if (item.isScaled) complexity += scalingPenalty;

      return sum + (perimeter * complexity);
    }, 0);

    const cuttingCost = totalCuttingLength * cuttingCostPerMM + setupCost;

    // Add complexity cost
    const complexityCost = layout.items.reduce((sum, item) => {
      let itemComplexity = complexityCostPerItem;
      if (item.isRotated) itemComplexity += rotationPenalty;
      if (item.isScaled) itemComplexity += scalingPenalty;
      return sum + itemComplexity;
    }, 0);

    const totalCost = materialCost + cuttingCost + complexityCost;
    const costPerItem = totalCost / Math.max(itemCount, 1);

    // Enhanced suggestions with specific recommendations
    const suggestions = [];
    const alternatives: { layout: LayoutAlgorithmResult; description: string; savings: number }[] = [];

    if (layout.wastePercentage > 35) {
      suggestions.push(`🔴 Çok yüksek fire oranı (%${layout.wastePercentage.toFixed(1)}) - Sayfa boyutunu küçültün`);
      if (pageSize.widthMM > 200 && pageSize.heightMM > 200) {
        suggestions.push('💡 A4 veya daha küçük boyut deneyin');
      }
    } else if (layout.wastePercentage > 20) {
      suggestions.push(`🟡 Fire oranı yüksek (%${layout.wastePercentage.toFixed(1)}) - Optimizasyon gerekli`);
    } else {
      suggestions.push(`🟢 İyi fire oranı (%${layout.wastePercentage.toFixed(1)})`);
    }

    if (layout.efficiency < 50) {
      suggestions.push('🔴 Çok düşük verimlilik - Rotasyon ve ölçeklendirme ayarlarını kontrol edin');
    } else if (layout.efficiency < 70) {
      suggestions.push('🟡 Orta verimlilik - İyileştirme mümkün');
    } else {
      suggestions.push('🟢 Yüksek verimlilik');
    }

    if (costPerItem > 3) {
      suggestions.push('💰 Yüksek birim maliyet - Toplu üretim veya farklı sayfa boyutu değerlendirin');
    }

    // Rotation analysis
    const rotatedItemsCount = layout.items.filter(item => item.isRotated).length;
    if (rotatedItemsCount > 0) {
      const rotationSavings = rotatedItemsCount * rotationPenalty;
      suggestions.push(`🔄 ${rotatedItemsCount} parça döndürüldü (+${rotationSavings.toFixed(2)} TL)`);
    }

    // Scaling analysis
    const scaledItemsCount = layout.items.filter(item => item.isScaled).length;
    if (scaledItemsCount > 0) {
      const scalingSavings = scaledItemsCount * scalingPenalty;
      suggestions.push(`📏 ${scaledItemsCount} parça ölçeklendirildi (+${scalingSavings.toFixed(2)} TL)`);
    }

    // Algorithm performance insight
    if (layout.performance.executionTime > 5000) {
      suggestions.push('⏱️ Optimizasyon süresi uzun - Hızlı dizilim modunu deneyin');
    }

    return {
      materialCost,
      wasteCost,
      cuttingCost: cuttingCost + complexityCost,
      totalCost,
      costPerItem,
      wastePercentage: layout.wastePercentage,
      suggestions,
      alternatives
    };
  };

  // Smart Format Recommendation Engine
  const getSmartFormatRecommendations = (
    items: Design[],
    currentLayout: LayoutAlgorithmResult
  ): string[] => {
    const recommendations = [];

    // Analyze item sizes
    const itemSizes = items.map(item => {
      const dims = extractDimensions(item);
      return dims.width * dims.height;
    });

    const avgItemSize = itemSizes.reduce((a, b) => a + b, 0) / itemSizes.length;
    const maxItemSize = Math.max(...itemSizes);

    if (avgItemSize < 2000) { // Small items (< 20cm²)
      recommendations.push('📏 Küçük parçalar için A4 veya A5 boyutu ideal olabilir');
    }

    if (maxItemSize > 10000) { // Large items (> 100cm²)
      recommendations.push('📐 Büyük parçalar var - A3 veya daha büyük boyut gerekebilir');
    }

    if (currentLayout.efficiency < 60) {
      recommendations.push('⚡ Düşük verimlilik - Farklı sayfa oranları deneyin');
    }

    return recommendations;
  };

  // Helper Functions
  const extractDimensions = (design: Design): { width: number; height: number } => {
    if (design.realDimensionsMM && design.realDimensionsMM !== 'Unknown') {
      const match = design.realDimensionsMM.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
      if (match) {
        return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
      }
    }
    return { width: 50, height: 30 };
  };

  const calculateItemPriority = (item: Design, options: OptimizationOptions): number => {
    const dims = extractDimensions(item);
    const area = dims.width * dims.height;

    // Priority based on area, complexity, and user preferences
    let priority = area * 0.5; // Base priority from area

    if (item.type === 'PDF') priority += 10; // PDF files get higher priority
    if (dims.width > dims.height) priority += 5; // Landscape orientation bonus

    return priority;
  };

  const generateScaleFactors = (options: OptimizationOptions): number[] => {
    const factors = [1]; // Always include original size

    if (options.allowDownscaling) {
      for (let scale = options.minDownscaleRatio; scale < 1; scale += 0.1) {
        factors.push(Number(scale.toFixed(1)));
      }
    }

    if (options.allowUpscaling) {
      for (let scale = 1.1; scale <= options.maxUpscaleRatio; scale += 0.1) {
        factors.push(Number(scale.toFixed(1)));
      }
    }

    return factors;
  };

  const calculatePlacementScore = (
    x: number, y: number, width: number, height: number,
    placedItems: OptimizedArrangementItem[],
    options: OptimizationOptions,
    pageWidth: number, pageHeight: number
  ): number => {
    let score = 0;

    // Bottom-left preference
    score += (pageHeight - y) * 0.3;
    score += (pageWidth - x) * 0.2;

    // Area efficiency
    const area = width * height;
    score += area * 0.4;

    // Spacing efficiency
    const wastedSpace = calculateWastedSpace(x, y, width, height, placedItems);
    score -= wastedSpace * 0.1;

    return score;
  };

  const calculateWastedSpace = (
    x: number, y: number, width: number, height: number,
    placedItems: OptimizedArrangementItem[]
  ): number => {
    // Calculate unusable space created by this placement
    // This is a simplified version - could be more sophisticated
    return 0;
  };

  const updateFreeRectangles = (
    freeRects: Array<{x: number, y: number, width: number, height: number}>,
    x: number, y: number, width: number, height: number
  ) => {
    // Remove overlapping rectangles and create new ones
    const newRects = [];

    for (let i = freeRects.length - 1; i >= 0; i--) {
      const rect = freeRects[i];

      if (!(x >= rect.x + rect.width || x + width <= rect.x || 
            y >= rect.y + rect.height || y + height <= rect.y)) {
        // Rectangle overlaps, split it
        freeRects.splice(i, 1);

        // Create up to 4 new rectangles
        if (rect.x < x) {
          newRects.push({
            x: rect.x, y: rect.y,
            width: x - rect.x, height: rect.height
          });
        }
        if (x + width < rect.x + rect.width) {
          newRects.push({
            x: x + width, y: rect.y,
            width: rect.x + rect.width - (x + width), height: rect.height
          });
        }
        if (rect.y < y) {
          newRects.push({
            x: rect.x, y: rect.y,
            width: rect.width, height: y - rect.y
          });
        }
        if (y + height < rect.y + rect.height) {
          newRects.push({
            x: rect.x, y: y + height,
            width: rect.width, height: rect.y + rect.height - (y + height)
          });
        }
      }
    }

    freeRects.push(...newRects);

    // Remove redundant rectangles
    for (let i = 0; i < freeRects.length; i++) {
      for (let j = i + 1; j < freeRects.length; j++) {
        if (isRectangleInside(freeRects[i], freeRects[j])) {
          freeRects.splice(i, 1);
          i--;
          break;
        } else if (isRectangleInside(freeRects[j], freeRects[i])) {
          freeRects.splice(j, 1);
          j--;
        }
      }
    }
  };

  const isRectangleInside = (
    inner: {x: number, y: number, width: number, height: number},
    outer: {x: number, y: number, width: number, height: number}
  ): boolean => {
    return inner.x >= outer.x && inner.y >= outer.y &&
           inner.x + inner.width <= outer.x + outer.width &&
           inner.y + inner.height <= outer.y + outer.height;
  };

  const calculateItemCost = (
    placement: any,
    options: OptimizationOptions
  ): number => {
    const area = placement.width * placement.height;
    let baseCost = area * 0.001; // Base material cost

    // Add cost for scaling
    if (placement.isScaled) {
      baseCost *= 1.1; // 10% penalty for scaling
    }

    // Add cost for rotation
    if (placement.isRotated) {
      baseCost *= 1.05; // 5% penalty for rotation
    }

    return baseCost;
  };

  // Advanced Multi-Page Layout Algorithm
  const multiPageOptimization = (
    items: Design[],
    pageWidth: number,
    pageHeight: number,
    options: OptimizationOptions
  ): LayoutAlgorithmResult => {
    const startTime = performance.now();
    let totalItems: OptimizedArrangementItem[] = [];
    let currentPageItems = [...items];
    let pageCount = 0;
    let totalEfficiency = 0;

    while (currentPageItems.length > 0 && pageCount < 10) { // Max 10 pages
      pageCount++;

      // Optimize current page
      const pageResult = advancedBinPacking(currentPageItems, pageWidth, pageHeight, options);

      if (pageResult.items.length === 0) break; // No more items fit

      // Add page offset to positions
      const pageOffset = pageCount > 1 ? pageHeight * (pageCount - 1) + 20 : 0; // 20mm gap between pages
      const pageItems = pageResult.items.map(item => ({
        ...item,
        y: item.y + pageOffset,
        pageNumber: pageCount
      }));

      totalItems.push(...pageItems);
      totalEfficiency += pageResult.efficiency;

      // Remove placed items from remaining items
      const placedIds = pageResult.items.map(item => item.designId);
      currentPageItems = currentPageItems.filter(item => !placedIds.includes(item.id));
    }

    const avgEfficiency = pageCount > 0 ? totalEfficiency / pageCount : 0;
    const totalArea = pageWidth * pageHeight * pageCount;
    const usedArea = totalItems.reduce((sum, item) => sum + (item.width * item.height), 0);

    return {
      items: totalItems,
      efficiency: avgEfficiency,
      wastePercentage: 100 - avgEfficiency,
      totalArea,
      usedArea,
      estimatedCost: totalItems.reduce((sum, item) => sum + item.costContribution, 0),
      performance: {
        algorithmUsed: `Multi-Page Optimization (${pageCount} pages)`,
        executionTime: performance.now() - startTime,
        iterations: pageCount
      },
      alternativeLayouts: []
    };
  };

  // Smart Nesting Algorithm for Complex Shapes
  const smartNestingAlgorithm = (
    items: Design[],
    pageWidth: number,
    pageHeight: number,
    options: OptimizationOptions
  ): LayoutAlgorithmResult => {
    const startTime = performance.now();

    // Group items by aspect ratio for better nesting
    const groupedItems = items.reduce((groups, item) => {
      const dims = extractDimensions(item);
      const aspectRatio = dims.width / dims.height;
      const group = aspectRatio > 1.5 ? 'wide' : aspectRatio < 0.67 ? 'tall' : 'square';

      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, Design[]>);

    let bestResult: LayoutAlgorithmResult | null = null;
    let bestScore = -1;

    // Try different grouping strategies
    const strategies = [
      'size_descending',
      'aspect_ratio_grouping', 
      'mixed_optimization',
      'area_efficiency'
    ];

    for (const strategy of strategies) {
      let arrangedItems: OptimizedArrangementItem[] = [];
      let currentY = 0;

      const sortedGroups = Object.entries(groupedItems).sort(([, a], [, b]) => {
        switch (strategy) {
          case 'size_descending':
            return b.length - a.length;
          case 'aspect_ratio_grouping':
            return a[0] && b[0] ? 
              extractDimensions(b[0]).width * extractDimensions(b[0]).height - 
              extractDimensions(a[0]).width * extractDimensions(a[0]).height : 0;
          default:
            return Math.random() - 0.5;
        }
      });

      for (const [groupType, groupItems] of sortedGroups) {
        if (currentY >= pageHeight - 50) break; // Page full

        // Apply group-specific optimization
        const availableHeight = pageHeight - currentY - options.minimumSpacing;
        const groupResult = advancedBinPacking(groupItems, pageWidth, availableHeight, {
          ...options,
          mode: groupType === 'wide' ? 'fast_layout' : 'maximum_efficiency'
        });

        // Offset group items
        const offsetItems = groupResult.items.map(item => ({
          ...item,
          y: item.y + currentY,
          groupType
        }));

        arrangedItems.push(...offsetItems);
        currentY += Math.max(...offsetItems.map(item => item.y + item.height)) + options.minimumSpacing;
      }

      const totalArea = pageWidth * pageHeight;
      const usedArea = arrangedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
      const efficiency = (usedArea / totalArea) * 100;
      const score = efficiency * arrangedItems.length; // Score combines efficiency and item count

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          items: arrangedItems,
          efficiency,
          wastePercentage: 100 - efficiency,
          totalArea,
          usedArea,
          estimatedCost: arrangedItems.reduce((sum, item) => sum + item.costContribution, 0),
          performance: {
            algorithmUsed: `Smart Nesting (${strategy})`,
            executionTime: performance.now() - startTime,
            iterations: strategies.length
          }
        };
      }
    }

    return bestResult || {
      items: [],
      efficiency: 0,
      wastePercentage: 100,
      totalArea: pageWidth * pageHeight,
      usedArea: 0,
      estimatedCost: 0,
      performance: {
        algorithmUsed: 'Smart Nesting (failed)',
        executionTime: performance.now() - startTime,
        iterations: 0
      }
    };
  };

  // Dynamic Space Optimization Algorithm
  const dynamicSpaceOptimization = (
    items: Design[],
    pageWidth: number,
    pageHeight: number,
    options: OptimizationOptions
  ): LayoutAlgorithmResult => {
    const startTime = performance.now();

    // Create a grid-based approach for precise space utilization
    const gridSize = Math.min(5, options.minimumSpacing); // 5mm or minimum spacing
    const gridWidth = Math.floor(pageWidth / gridSize);
    const gridHeight = Math.floor(pageHeight / gridSize);
    const occupancyGrid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));

    const placedItems: OptimizedArrangementItem[] = [];
    const sortedItems = items
      .map(item => ({
        ...item,
        dimensions: extractDimensions(item),
        priority: calculateItemPriority(item, options)
      }))
      .sort((a, b) => b.priority - a.priority);

    for (const item of sortedItems) {
      let bestPlacement = null;
      let bestScore = -1;

      // Try different orientations
      const orientations = options.allowRotation ? [0, 90, 180, 270] : [0];

      for (const rotation of orientations) {
        const [width, height] = rotation % 180 === 0 ? 
          [item.dimensions.width, item.dimensions.height] : 
          [item.dimensions.height, item.dimensions.width];

        const gridItemWidth = Math.ceil(width / gridSize);
        const gridItemHeight = Math.ceil(height / gridSize);

        // Find best position in grid
        for (let gridY = 0; gridY <= gridHeight - gridItemHeight; gridY++) {
          for (let gridX = 0; gridX <= gridWidth - gridItemWidth; gridX++) {

            // Check if space is available
            let canPlace = true;
            for (let y = gridY; y < gridY + gridItemHeight && canPlace; y++) {
              for (let x = gridX; x < gridX + gridItemWidth && canPlace; x++) {
                if (occupancyGrid[y][x]) canPlace = false;
              }
            }

            if (canPlace) {
              // Calculate placement score based on space utilization
              const realX = gridX * gridSize;
              const realY = gridY * gridSize;
              const wastedSpace = calculateGridWastedSpace(gridX, gridY, gridItemWidth, gridItemHeight, occupancyGrid);
              const score = (gridItemWidth * gridItemHeight) - wastedSpace * 0.5;

              if (score > bestScore) {
                bestScore = score;
                bestPlacement = {
                  x: realX,
                  y: realY,
                  width,
                  height,
                  rotation,
                  gridX,
                  gridY,
                  gridWidth: gridItemWidth,
                  gridHeight: gridItemHeight
                };
              }
            }
          }
        }
      }

      if (bestPlacement) {
        const optimizedItem: OptimizedArrangementItem = {
          designId: item.id,
          x: bestPlacement.x,
          y: bestPlacement.y,
          width: bestPlacement.width,
          height: bestPlacement.height,
          rotation: bestPlacement.rotation,
          scaleFactor: 1,
          isRotated: bestPlacement.rotation !== 0,
          isScaled: false,
          priority: item.priority,
          originalItem: {
            ...item,
            dimensions: `${item.dimensions.width}x${item.dimensions.height}mm`
          } as Design,
          costContribution: calculateItemCost(bestPlacement, options)
        };

        placedItems.push(optimizedItem);

        // Mark grid cells as occupied
        for (let y = bestPlacement.gridY; y < bestPlacement.gridY + bestPlacement.gridHeight; y++) {
          for (let x = bestPlacement.gridX; x < bestPlacement.gridX + bestPlacement.gridWidth; x++) {
            occupancyGrid[y][x] = true;
          }
        }
      }
    }

    const totalArea = pageWidth * pageHeight;
    const usedArea = placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
    const efficiency = (usedArea / totalArea) * 100;

    return {
      items: placedItems,
      efficiency,
      wastePercentage: 100 - efficiency,
      totalArea,
      usedArea,
      estimatedCost: placedItems.reduce((sum, item) => sum + item.costContribution, 0),
      performance: {
        algorithmUsed: 'Dynamic Space Optimization',
        executionTime: performance.now() - startTime,
        iterations: sortedItems.length
      }
    };
  };

  const calculateGridWastedSpace = (
    gridX: number, gridY: number, gridWidth: number, gridHeight: number, 
    occupancyGrid: boolean[][]
  ): number => {
    let wastedSpace = 0;
    const endX = Math.min(gridX + gridWidth, occupancyGrid[0].length);
    const endY = Math.min(gridY + gridHeight, occupancyGrid.length);

    // Check surrounding cells for fragmentation
    for (let y = Math.max(0, gridY - 1); y <= Math.min(occupancyGrid.length - 1, endY); y++) {
      for (let x = Math.max(0, gridX - 1); x <= Math.min(occupancyGrid[0].length - 1, endX); x++) {
        if (!occupancyGrid[y][x] && (x < gridX || x >= endX || y < gridY || y >= endY)) {
          wastedSpace += 0.5; // Penalty for fragmented space
        }
      }
    }

    return wastedSpace;
  };

  // Genetic Algorithm Helper Functions
  const initializePopulation = (
    items: Design[], pageWidth: number, pageHeight: number,
    populationSize: number, options: OptimizationOptions
  ) => {
    const population = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(createRandomIndividual(items, pageWidth, pageHeight, options));
    }
    return population;
  };

  const createRandomIndividual = (
    items: Design[], pageWidth: number, pageHeight: number, options: OptimizationOptions
  ) => {
    const genes = items.map(item => {
      const dims = extractDimensions(item);
      return {
        itemId: item.id,
        x: Math.random() * (pageWidth - dims.width),
        y: Math.random() * (pageHeight - dims.height),
        rotation: options.allowRotation ? Math.floor(Math.random() * 4) * options.rotationSteps : 0,
        scale: 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      };
    });

    return { genes, fitness: 0 };
  };

  const calculateFitness = (individual: any, pageWidth: number, pageHeight: number, options: OptimizationOptions) => {
    // Implement fitness calculation based on overlap, area usage, etc.
    let fitness = 0;
    let totalArea = 0;
    let overlaps = 0;

    // Check for overlaps and calculate total area
    for (let i = 0; i < individual.genes.length; i++) {
      const gene1 = individual.genes[i];
      totalArea += gene1.scale * gene1.scale * 100; // Simplified area calculation

      for (let j = i + 1; j < individual.genes.length; j++) {
        const gene2 = individual.genes[j];
        if (isOverlapping(gene1, gene2)) {
          overlaps++;
        }
      }
    }

    fitness = totalArea - (overlaps * 1000); // Penalty for overlaps
    return fitness;
  };

  const isOverlapping = (gene1: any, gene2: any): boolean => {
    // Simplified overlap detection
    const margin = 5;
    return !(gene1.x + 50 + margin < gene2.x || 
             gene2.x + 50 + margin < gene1.x ||
             gene1.y + 30 + margin < gene2.y || 
             gene2.y + 30 + margin < gene1.y);
  };

  const tournamentSelection = (population: any[]) => {
    const tournamentSize = 3;
    let best = population[Math.floor(Math.random() * population.length)];

    for (let i = 1; i < tournamentSize; i++) {
      const competitor = population[Math.floor(Math.random() * population.length)];
      if (competitor.fitness > best.fitness) {
        best = competitor;
      }
    }

    return best;
  };

  const crossover = (parent1: any, parent2: any, options: OptimizationOptions) => {
    const crossoverPoint = Math.floor(Math.random() * parent1.genes.length);
    const childGenes = [];

    for (let i = 0; i < parent1.genes.length; i++) {
      if (i < crossoverPoint) {
        childGenes.push({ ...parent1.genes[i] });
      } else {
        childGenes.push({ ...parent2.genes[i] });
      }
    }

    return { genes: childGenes, fitness: 0 };
  };

  const mutate = (individual: any, pageWidth: number, pageHeight: number, options: OptimizationOptions) => {
    const mutationStrength = 0.1;

    individual.genes.forEach((gene: any) => {
      if (Math.random() < mutationStrength) {
        gene.x += (Math.random() - 0.5) * 20;
        gene.y += (Math.random() - 0.5) * 20;
        gene.x = Math.max(0, Math.min(pageWidth - 50, gene.x));
        gene.y = Math.max(0, Math.min(pageHeight - 30, gene.y));
      }
    });
  };

  const convertGeneticSolutionToLayout = (
    solution: any, items: Design[], pageWidth: number, pageHeight: number
  ): LayoutAlgorithmResult => {
    const optimizedItems: OptimizedArrangementItem[] = solution.genes.map((gene: any, index: number) => ({
      designId: gene.itemId,
      x: gene.x,
      y: gene.y,
      width: 50 * gene.scale,
      height: 30 * gene.scale,
      rotation: gene.rotation,
      scaleFactor: gene.scale,
      isRotated: gene.rotation !== 0,
      isScaled: Math.abs(gene.scale - 1) > 0.01,
      priority: 1,
      originalItem: items[index],
      costContribution: 0
    }));

    const totalArea = pageWidth * pageHeight;
    const usedArea = optimizedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
    const efficiency = (usedArea / totalArea) * 100;

    return {
      items: optimizedItems,
      efficiency,
      wastePercentage: 100 - efficiency,
      totalArea,
      usedArea,
      estimatedCost: 0,
      performance: {
        algorithmUsed: 'Genetic Algorithm',
        executionTime: 0,
        iterations: 0
      }
    };
  };

  // Main optimization function
  const optimizeLayout = async (
    items: Design[],
    pageSize: PageDimensions,
    options: OptimizationOptions
  ): Promise<LayoutAlgorithmResult> => {
    const pageWidth = pageSize.widthMM - bleedSettings.left - bleedSettings.right;
    const pageHeight = pageSize.heightMM - bleedSettings.top - bleedSettings.bottom;

    let result: LayoutAlgorithmResult;
    const algorithms: LayoutAlgorithmResult[] = [];

    switch (options.mode) {
      case 'maximum_efficiency':
        // Run multiple algorithms and pick the best
        if (items.length > 50) {
          // For large datasets, use multi-page optimization
          result = multiPageOptimization(items, pageWidth, pageHeight, options);
        } else if (items.length > 20) {
          // For medium datasets, try genetic algorithm
          const geneticResult = geneticLayoutOptimization(items, pageWidth, pageHeight, options);
          const nestingResult = smartNestingAlgorithm(items, pageWidth, pageHeight, options);
          const spaceResult = dynamicSpaceOptimization(items, pageWidth, pageHeight, options);

          algorithms.push(geneticResult, nestingResult, spaceResult);

          // Pick best result based on efficiency and item count
          result = algorithms.reduce((best, current) => {
            const bestScore = (best.efficiency * 0.7) + (best.items.length / items.length * 100 * 0.3);
            const currentScore = (current.efficiency * 0.7) + (current.items.length / items.length * 100 * 0.3);
            return currentScore > bestScore ? current : best;
          });
        } else {
          // For small datasets, use smart nesting with bin packing fallback
          const nestingResult = smartNestingAlgorithm(items, pageWidth, pageHeight, options);
          const binPackingResult = advancedBinPacking(items, pageWidth, pageHeight, options);

          result = nestingResult.efficiency > binPackingResult.efficiency ? nestingResult : binPackingResult;
          algorithms.push(nestingResult, binPackingResult);
        }
        break;

      case 'fast_layout':
        result = advancedBinPacking(items, pageWidth, pageHeight, options);
        break;

      case 'balanced':
        // Use dynamic space optimization for balanced approach
        const spaceResult = dynamicSpaceOptimization(items, pageWidth, pageHeight, options);
        const binPackingResult = advancedBinPacking(items, pageWidth, pageHeight, options);

        result = spaceResult.items.length >= binPackingResult.items.length ? spaceResult : binPackingResult;
        algorithms.push(spaceResult, binPackingResult);
        break;

      case 'custom':
        // Run all algorithms for comparison
        const allResults = [
          advancedBinPacking(items, pageWidth, pageHeight, options),
          smartNestingAlgorithm(items, pageWidth, pageHeight, options),
          dynamicSpaceOptimization(items, pageWidth, pageHeight, options)
        ];

        if (items.length > 15) {
          allResults.push(geneticLayoutOptimization(items, pageWidth, pageHeight, options));
        }

        // Score based on user preferences
        result = allResults.reduce((best, current) => {
          const bestScore = calculateCustomScore(best, options);
          const currentScore = calculateCustomScore(current, options);
          return currentScore > bestScore ? current : best;
        });

        algorithms.push(...allResults);
        break;

      default:
        result = advancedBinPacking(items, pageWidth, pageHeight, options);
    }

    // Generate alternative layouts
    if (options.mode === 'maximum_efficiency' || options.mode === 'custom') {
      const alternatives = algorithms.filter(alg => alg !== result).slice(0, 3);

      // Try with rotation toggle if not already done
      if (alternatives.length < 3) {
        const altOptions = { ...options, allowRotation: !options.allowRotation };
        const altResult = advancedBinPacking(items, pageWidth, pageHeight, altOptions);
        alternatives.push(altResult);
      }

      result.alternativeLayouts = alternatives;
    }

    return result;
  };

  // Custom scoring function for user preferences
  const calculateCustomScore = (result: LayoutAlgorithmResult, options: OptimizationOptions): number => {
    let score = 0;

    // Efficiency weight
    score += result.efficiency * 0.4;

    // Item placement rate
    const placementRate = (result.items.length / (result.items.length + (result.totalArea - result.usedArea) / 1000)) * 100;
    score += placementRate * 0.3;

    // Speed consideration
    if (options.mode === 'fast_layout') {
      score += (10000 - result.performance.executionTime) * 0.001; // Bonus for speed
    }

    // Rotation preference
    if (options.allowRotation) {
      const rotatedItems = result.items.filter(item => item.isRotated).length;
      score += (rotatedItems / result.items.length) * 10; // Bonus for using rotation
    }

    // Spacing optimization
    if (options.prioritizeSpacing) {
      score += (100 - result.wastePercentage) * 0.2;
    }

    return score;
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

  // Enhanced auto-arrange mutation with optimization
  const autoArrangeMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!Array.isArray(designs) || designs.length === 0) {
        throw new Error('Dizim yapılacak tasarım bulunamadı');
      }

      setIsOptimizing(true);

      try {
        console.log('Starting arrangement with designs:', designs.length);
        console.log('Page dimensions:', currentPageDimensions);
        console.log('Optimization options:', optimizationOptions);

        // Extract design dimensions properly
        const processedDesigns = designs.map(design => {
          const dims = extractDimensions(design);
          console.log(`Design ${design.filename}: ${dims.width}x${dims.height}mm`);
          return {
            ...design,
            realWidth: dims.width,
            realHeight: dims.height
          };
        });

        // Run local optimization first
        const optimizedLayout = await optimizeLayout(processedDesigns, currentPageDimensions, optimizationOptions);
        console.log('Optimization result:', optimizedLayout);

        // Calculate cost analysis
        const costAnalysis = calculateCostAnalysis(optimizedLayout, currentPageDimensions, designs.length);
        setCostAnalysis(costAnalysis);

        // Convert optimized layout to API format
        const arrangements = optimizedLayout.items.map(item => {
          const arrangement = {
            designId: item.designId,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            withMargins: {
              width: item.width + bleedSettings.left + bleedSettings.right,
              height: item.height + bleedSettings.top + bleedSettings.bottom
            }
          };
          console.log('Created arrangement:', arrangement);
          return arrangement;
        });

        const result: ArrangementResult = {
          arrangements,
          totalArranged: optimizedLayout.items.length,
          totalRequested: designs.length,
          efficiency: `${optimizedLayout.efficiency.toFixed(1)}%`,
          usedArea: {
            width: currentPageDimensions.widthMM - bleedSettings.left - bleedSettings.right,
            height: currentPageDimensions.heightMM - bleedSettings.top - bleedSettings.bottom
          }
        };

        console.log('Final arrangement result:', result);

        // Fallback to API if local optimization fails or produces poor results
        if (optimizedLayout.items.length === 0 || optimizedLayout.efficiency < 10) {
          console.log('Local optimization failed, trying API fallback...');
          try {
            const designIds = designs.map((d: Design) => d.id);
            const apiResult = await apiRequest<ArrangementResult>('POST', '/api/automation/plotter/auto-arrange', {
              designIds,
              plotterSettings
            });

            console.log('API fallback result:', apiResult);
            
            if (apiResult && apiResult.arrangements && apiResult.arrangements.length > 0) {
              setIsOptimizing(false);
              return apiResult;
            }
          } catch (apiError) {
            console.warn('API fallback failed:', apiError);
            // Continue with local result even if poor
          }
        }

        setIsOptimizing(false);
        return result;
      } catch (error) {
        setIsOptimizing(false);
        console.error('Optimization error:', error);
        throw error;
      }
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('Arrangement response received:', data);
      setArrangements(data);

      if (!data.arrangements || data.arrangements.length === 0 || data.totalArranged === 0) {
        toast({
          title: "Dizim Uyarısı",
          description: `Hiçbir tasarım baskı alanına sığmadı. Sayfa boyutunu büyütün veya tasarım boyutlarını küçültün. Mevcut sayfa: ${currentPageDimensions.widthMM}×${currentPageDimensions.heightMM}mm`,
          variant: "destructive",
        });
        return;
      }

      const efficiency = parseFloat(data.efficiency.replace('%', ''));
      const statusColor = efficiency > 70 ? "default" : efficiency > 50 ? "secondary" : "destructive";
      
      toast({
        title: "✅ Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi. Verimlilik: ${data.efficiency}`,
        variant: statusColor === "destructive" ? "destructive" : "default",
      });

      // Auto-generate PDF if arrangement is successful
      if (data.arrangements.length > 0) {
        setTimeout(() => {
          const pdfData = {
            plotterSettings: plotterSettings,
            arrangements: data.arrangements
          };
          console.log('Auto-generating PDF with data:', pdfData);
          generatePdfMutation.mutate(pdfData);
        }, 1500);
      }
    },
    onError: (error: unknown) => {
      console.error('Auto-arrange error:', error);
      
      let errorMessage = "Otomatik dizim başarısız";
      let suggestions = "";

      if (error instanceof Error) {
        if (error.message.includes('tasarım bulunamadı')) {
          errorMessage = "Dizim için dosya bulunamadı";
          suggestions = "Lütfen önce vektörel dosyalar yükleyin.";
        } else if (error.message.includes('sığmadı')) {
          errorMessage = "Tasarımlar sayfa alanına sığmıyor";
          suggestions = "Sayfa boyutunu büyütün veya daha az dosya seçin.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Sunucu bağlantı hatası";
          suggestions = "İnternet bağlantınızı kontrol edin ve tekrar deneyin.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "❌ Dizim Hatası",
        description: `${errorMessage}${suggestions ? '\n💡 ' + suggestions : ''}`,
        variant: "destructive",
      });

      // Reset processing state
      setIsOptimizing(false);
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
  const isBusy = uploadMutation.isPending || generatePdfMutation.isPending || isProcessing;
  const selectedDesigns = designs;

  const runValidation = async () => {
    setValidationLoading(true);
    setPageValidation(null);
    setFileValidations([]);
    setLayoutValidation(null);

    try {
      // 1. Sayfa Boyutu Validasyonu
      const pageWidth = currentPageDimensions.widthMM;
      const pageHeight = currentPageDimensions.heightMM;
      const minPageSize = 100; // Örnek minimum boyut
      const maxPageSize = 2000; // Örnek maksimum boyut

      const pageErrors: string[] = [];
      if (pageWidth < minPageSize || pageHeight < minPageSize) {
        pageErrors.push(`Sayfa boyutları minimum ${minPageSize}mm olmalıdır.`);
      }
      if (pageWidth > maxPageSize || pageHeight > maxPageSize) {
        pageErrors.push(`Sayfa boyutları maksimum ${maxPageSize}mm olmalıdır.`);
      }

      // Orantı kontrolü
      const aspectRatio = pageWidth / pageHeight;
      const minAspectRatio = 0.5;
      const maxAspectRatio = 2;
      if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
        pageErrors.push("Sayfa en-boy oranı geçersiz.");
      }

      setPageValidation({
        isValid: pageErrors.length === 0,
        errors: pageErrors,
        recommendations: pageErrors.length > 0 ? ["Önerilen sayfa boyutlarını kullanın."] : [],
      });

      // 2. Dosya Validasyonu
      const fileValidationResults = await Promise.all(
        selectedDesigns.map(async (design) => {
          const fileErrors: string[] = [];

          // Format uygunluğu (zaten yükleme sırasında kontrol edildi)

          // Çözünürlük kontrolü (varsa)
          if (design.type === "image/svg+xml") {
            // SVG çözünürlük kontrolü yapılamaz
          } else {
            // PDF veya diğer formatlar için DPI kontrolü
            const dpi = 300; // Gerçek DPI değerini almanız gerekir
            if (dpi < 150) {
              fileErrors.push(`Düşük çözünürlük (${dpi} DPI)`);
            }
          }

          // Boyut optimizasyonu (örnek)
          if (design.fileSize && design.fileSize > '10MB') {
            fileErrors.push("Dosya boyutu çok büyük. Optimize edin.");
          }

          // Renk profili kontrolü
          const colorProfileInfo = analyzeColorProfile(design.filename, design.type);
          if (!colorProfileInfo.isValid) {
            fileErrors.push(`Renk profili uygun değil (${colorProfileInfo.profile})`);
          }

          return {
            designId: design.id,
            isValid: fileErrors.length === 0,
            errors: fileErrors,
            recommendations: fileErrors.length > 0 ? ["Dosyayı optimize edin veya renk profilini düzeltin."] : [],
          };
        })
      );

      setFileValidations(fileValidationResults);

      // 3. Layout Validasyonu
      const layoutErrors: string[] = [];
      if (selectedDesigns.length > 100) {
        layoutErrors.push("Çok fazla tasarım var. Performans sorunları olabilir.");
      }

      setLayoutValidation({
        isValid: layoutErrors.length === 0,
        errors: layoutErrors,
        recommendations: layoutErrors.length > 0 ? ["Tasarım sayısını azaltın veya daha büyük bir sayfa boyutu kullanın."] : [],
      });

    } catch (error:any) {
      console.error("Validasyon hatası:", error);
      toast({
        title: "Validasyon Hatası",
        description: error.message || "Validasyon sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setValidationLoading(false);
    }
  };

  const applyAlternativeDimensions = (newWidth: number, newHeight: number) => {
    setCustomDimensions((prev) => ({
      ...prev,
      width: { value: newWidth, unit: prev.width.unit },
      height: { value: newHeight, unit: prev.height.unit },
      widthMM: newWidth,
      heightMM: newHeight,
    }));
  };

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
                  <OptimizedDesignList
                    designs={designs}
                    processVectorFileEnhanced={processVectorFileEnhanced}
                    currentPageDimensions={currentPageDimensions}
                    bleedSettings={bleedSettings}
                    safeAreaSettings={safeAreaSettings}
                    scalingOptions={scalingOptions}
                  />
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
              Gelişmiş Ayarlar & Optimizasyon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Optimization Mode Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Optimizasyon Modu</Label>
              <Select value={optimizationOptions.mode} 
                      onValueChange={(mode: 'maximum_efficiency' | 'fast_layout' | 'balanced' | 'custom') => 
                        setOptimizationOptions(prev => ({ ...prev, mode }))}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maximum_efficiency">🎯 Maksimum Verimlilik</SelectItem>
                  <SelectItem value="fast_layout">⚡ Hızlı Dizilim</SelectItem>
                  <SelectItem value="balanced">⚖️ Dengeli</SelectItem>
                  <SelectItem value="custom">🔧 Özel Ayarlar</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-xs text-gray-600 mt-1">
                {optimizationOptions.mode === 'maximum_efficiency' && 'Genetik algoritma ile en yüksek alan verimliliği'}
                {optimizationOptions.mode === 'fast_layout' && 'Hızlı bin packing algoritması'}
                {optimizationOptions.mode === 'balanced' && 'Hız ve verimlilik dengesi'}
                {optimizationOptions.mode === 'custom' && 'Manuel optimizasyon ayarları'}
              </div>
            </div>

            {/* Rotation Settings */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Rotasyon Ayarları</Label>
                <Switch
                  checked={optimizationOptions.allowRotation}
                  onCheckedChange={(checked) => 
                    setOptimizationOptions(prev => ({ ...prev, allowRotation: checked }))}
                />
              </div>

              {optimizationOptions.allowRotation && (
                <div>
                  <Label htmlFor="rotation-steps" className="text-xs">Rotasyon Adımları: {optimizationOptions.rotationSteps}°</Label>
                  <Select value={optimizationOptions.rotationSteps.toString()} 
                          onValueChange={(value) => 
                            setOptimizationOptions(prev => ({ ...prev, rotationSteps: parseInt(value) }))}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">45° adımlar</SelectItem>
                      <SelectItem value="90">90° adımlar</SelectItem>
                      <SelectItem value="180">180° adımlar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Spacing Optimization */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">Boşluk Optimizasyonu</Label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="min-spacing" className="text-xs">Min. Boşluk (mm)</Label>
                  <input
                    id="min-spacing"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={optimizationOptions.minimumSpacing}
                    onChange={(e) => setOptimizationOptions(prev => ({ ...prev, minimumSpacing: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="max-spacing" className="text-xs">Max. Boşluk (mm)</Label>
                  <input
                    id="max-spacing"
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={optimizationOptions.maximumSpacing}
                    onChange={(e) => setOptimizationOptions(prev => ({ ...prev, maximumSpacing: parseFloat(e.target.value) || 5 }))}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="packing-tightness" className="text-xs">Yerleştirme Sıkılığı: {(optimizationOptions.packingTightness * 100).toFixed(0)}%</Label>
                <input
                  id="packing-tightness"
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.1"
                  value={optimizationOptions.packingTightness}
                  onChange={(e) => setOptimizationOptions(prev => ({ ...prev, packingTightness: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Scale Settings */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">Ölçeklendirme Seçenekleri</Label>

              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  id="allow-downscaling"
                  checked={optimizationOptions.allowDownscaling}
                  onCheckedChange={(checked) => 
                    setOptimizationOptions(prev => ({ ...prev, allowDownscaling: checked }))}
                />
                <Label htmlFor="allow-downscaling" className="text-xs cursor-pointer">
                  Küçültme İzni ({(optimizationOptions.minDownscaleRatio * 100).toFixed(0)}% min)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-upscaling-opt"
                  checked={optimizationOptions.allowUpscaling}
                  onCheckedChange={(checked) => 
                    setOptimizationOptions(prev => ({ ...prev, allowUpscaling: checked }))}
                />
                <Label htmlFor="allow-upscaling-opt" className="text-xs cursor-pointer">
                  Büyütme İzni ({(optimizationOptions.maxUpscaleRatio * 100).toFixed(0)}% max)
                </Label>
              </div>
            </div>

            {/* Cost Analysis Display */}
            {costAnalysis && (
              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-medium flex items-center gap-1">
                  💰 Maliyet Analizi
                </Label>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-green-800">Toplam Maliyet:</span>
                      <p className="text-green-900 font-bold">{costAnalysis.totalCost.toFixed(2)} ₺</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Birim Maliyet:</span>
                      <p className="text-green-900 font-bold">{costAnalysis.costPerItem.toFixed(2)} ₺</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Fire Oranı:</span>
                      <p className="text-green-900">{costAnalysis.wastePercentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">İsraf Maliyeti:</span>
                      <p className="text-green-900">{costAnalysis.wasteCost.toFixed(2)} ₺</p>
                    </div>
                  </div>

                  {costAnalysis.suggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-green-300">
                      <span className="text-xs font-medium text-green-800">💡 Öneriler:</span>
                      {costAnalysis.suggestions.map((suggestion, index) => (
                        <p key={index} className="text-xs text-green-700 mt-1">• {suggestion}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Multi-Format Comparison */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">📊 Format Karşılaştırması</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (designs.length > 0) {
                      setIsOptimizing(true);
                      generateMultiFormatLayouts(designs, optimizationOptions)
                        .then(results => {
                          setMultiFormatResults(results);
                          setIsOptimizing(false);
                        })
                        .catch(() => setIsOptimizing(false));
                    }
                  }}
                  disabled={designs.length === 0 || isOptimizing}
                  className="text-xs h-6 px-2"
                >
                  {isOptimizing ? '⏳' : '🔍'} Analiz Et
                </Button>
              </div>

              {multiFormatResults && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs">
                    <p className="font-medium text-blue-800 mb-2">
                      🏆 Önerilen: {PAPER_TEMPLATES.find(t => 
                        t.widthMM === multiFormatResults.formats[multiFormatResults.recommended]?.pageSize.widthMM
                      )?.name || 'Özel Boyut'}
                    </p>

                    <div className="space-y-1">
                      {multiFormatResults.formats.slice(0, 3).map((format, index) => (
                        <div key={index} className={`flex justify-between ${
                          index === multiFormatResults.recommended ? 'font-bold text-blue-900' : 'text-blue-700'
                        }`}>
                          <span>{format.pageSize.widthMM}×{format.pageSize.heightMM}mm</span>
                          <span>{format.layout.efficiency.toFixed(1)}% | {format.costAnalysis.totalCost.toFixed(1)}₺</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <EnhancedPreviewRenderer
              arrangements={arrangements?.arrangements || []}
              pageWidth={currentPageDimensions.widthMM}
              pageHeight={currentPageDimensions.heightMM}
              designs={designs}
              bleedSettings={bleedSettings}
              isLoading={autoArrangeMutation.isPending || isOptimizing}
              error={autoArrangeMutation.error?.message || null}
            />

            {/* Results Summary */}
            {arrangements && arrangements.arrangements && arrangements.arrangements.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-green-800">Sayfa Boyutu</p>
                      <p className="text-green-700">
                        {formatDimension(currentPageDimensions.widthMM, 'mm')} × {formatDimension(currentPageDimensions.heightMM, 'mm')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-green-800">Yerleştirme</p>
                      <p className="text-green-700">
                        ✅ {arrangements.totalArranged}/{arrangements.totalRequested} tasarım
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-green-800">Verimlilik</p>
                      <p className="text-green-700 font-bold">
                        📊 {arrangements.efficiency}
                      </p>
                    </div>
                  </div>
                  
                  {costAnalysis && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <span className="text-green-800 font-medium">Toplam Maliyet:</span>
                          <p className="text-green-900 font-bold">{costAnalysis.totalCost.toFixed(2)} ₺</p>
                        </div>
                        <div className="text-center">
                          <span className="text-green-800 font-medium">Birim Maliyet:</span>
                          <p className="text-green-900">{costAnalysis.costPerItem.toFixed(2)} ₺</p>
                        </div>
                        <div className="text-center">
                          <span className="text-green-800 font-medium">Fire Oranı:</span>
                          <p className="text-green-900">{costAnalysis.wastePercentage.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                          <span className="text-green-800 font-medium">İsraf:</span>
                          <p className="text-green-900">{costAnalysis.wasteCost.toFixed(2)} ₺</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Smart Recommendations */}
                {costAnalysis && costAnalysis.suggestions.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">💡 Akıllı Öneriler:</p>
                    <div className="space-y-1">
                      {costAnalysis.suggestions.slice(0, 3).map((suggestion, index) => (
                        <p key={index} className="text-xs text-blue-700">• {suggestion}</p>
                      ))}
                    </div>
                  </div>
                )}
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
              onClick={() => {
                console.log('Auto-arrange button clicked');
                console.log('Designs available:', designs.length);
                console.log('Designs data:', designs);
                autoArrangeMutation.mutate();
              }}
              disabled={designs.length === 0 || uploadMutation.isPending || autoArrangeMutation.isPending || isOptimizing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold disabled:opacity-50 transition-all duration-200"
            >
              {(autoArrangeMutation.isPending || isOptimizing) ? (
                <>
                  <Play className="animate-spin h-6 w-6 mr-3" />
                  {isOptimizing ? 'OPTİMİZE EDİLİYOR...' : 'DİZİLİYOR...'}
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-3" />
                  AKILLI DİZİN ({designs.length} DOSYA)
                </>
              )}
            </Button>

            {/* Progress indicator */}
            {(autoArrangeMutation.isPending || isOptimizing) && (
              <div className="mt-4 space-y-2">
                <Progress value={isOptimizing ? 75 : 45} className="w-full" />
                <p className="text-sm text-gray-600 text-center">
                  {isOptimizing ? 
                    'Optimizasyon algoritması çalışıyor...' : 
                    'Tasarımlar analiz ediliyor...'}
                </p>
              </div>
            )}

            {costAnalysis && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-4 px-4 py-2 bg-green-100 rounded-lg text-sm">
                  <span className="text-green-800">
                    <strong>Tahmini Maliyet:</strong> {costAnalysis.totalCost.toFixed(2)} ₺
                  </span>
                  <span className="text-green-700">
                    <strong>Verimlilik:</strong> {(100 - costAnalysis.wastePercentage).toFixed(1)}%
                  </span>
                  <span className="text-green-700">
                    <strong>Birim:</strong> {costAnalysis.costPerItem.toFixed(2)} ₺
                  </span>
                </div>
              </div>
            )}

            {generatePdfMutation.isPending && (
              <div className="text-center">
                <div className="animate-pulse text-green-600 font-medium">PDF oluşturuluyor ve indiriliyor...</div>
                <div className="mt-2">
                  <Progress value={75} className="w-48" />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center max-w-md">
              Gelişmiş algoritma ile {formatDimension(currentPageDimensions.widthMM, 'mm')} × {formatDimension(currentPageDimensions.heightMM, 'mm')} 
              boyutuna {optimizationOptions.mode === 'maximum_efficiency' ? 'maksimum verimlilik' : 'hızlı dizilim'} ile yerleştirme.
              {optimizationOptions.allowRotation && ' Otomatik rotasyon aktif.'}
            </p>

            {/* Status indicators */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
            </div>
          </div>
          
          {/* Layout Options */}
          <Tabs defaultValue="layout" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">📐 Layout Seçenekleri</TabsTrigger>
              <TabsTrigger value="processing">⚙️ İşlem Seçenekleri</TabsTrigger>
              <TabsTrigger value="optimization">🎯 Optimizasyon</TabsTrigger>
              <TabsTrigger value="validation">✅ Validasyon</TabsTrigger>
            </TabsList>

            

            <TabsContent value="validation" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Validasyon ve Kalite Kontrolü</h3>
                  <Button 
                    onClick={runValidation} 
                    disabled={!selectedDesigns.length || validationLoading}
                    variant="outline"
                  >
                    {validationLoading ? "Kontrol Ediliyor..." : "Validasyonu Çalıştır"}
                  </Button>
                </div>

                {(pageValidation || fileValidations.length > 0 || layoutValidation) && (
                  <ValidationPanel
                    pageValidation={pageValidation}
                    fileValidations={fileValidations}
                    layoutValidation={layoutValidation}
                    onApplyAlternative={(alternative: any) => {
                      if (alternative && alternative.dimensions) {
                        applyAlternativeDimensions(alternative.dimensions.width, alternative.dimensions.height);
                      }
                    }}
                    className="mt-4"
                  />
                )}

                {!pageValidation && !fileValidations.length && !layoutValidation && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="text-gray-500">
                        Validasyon kontrolü için tasarım dosyaları seçin ve "Validasyonu Çalıştır" butonuna tıklayın.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}