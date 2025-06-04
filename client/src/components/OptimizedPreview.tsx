import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize } from 'lucide-react';

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

interface OptimizedPreviewProps {
  arrangements: ArrangementItem[];
  pageWidth: number;
  pageHeight: number;
  designs: any[];
  efficiency: string;
  onGeneratePDF?: () => void;
  className?: string;
}

export default function OptimizedPreview({
  arrangements,
  pageWidth,
  pageHeight,
  designs,
  efficiency,
  onGeneratePDF,
  className = ""
}: OptimizedPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Scale factor for display (convert mm to pixels)
  const scale = 2; // 2 pixels per mm for good resolution

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = pageWidth * scale * zoom;
    canvas.height = pageHeight * scale * zoom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan
    ctx.setTransform(zoom, 0, 0, zoom, panOffset.x, panOffset.y);

    // Draw page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth * scale, pageHeight * scale);

    // Draw page border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, pageWidth * scale, pageHeight * scale);

    // Draw grid (optional)
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    const gridSize = 10 * scale; // 10mm grid
    for (let x = 0; x <= pageWidth * scale; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, pageHeight * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= pageHeight * scale; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(pageWidth * scale, y);
      ctx.stroke();
    }

    // Draw arranged items
    arrangements.forEach((item, index) => {
      const design = designs.find(d => d.id === item.designId);
      if (!design) return;

      const x = item.x * scale;
      const y = item.y * scale;
      const width = item.width * scale;
      const height = item.height * scale;

      // Draw design rectangle
      ctx.fillStyle = `hsl(${(index * 137.5) % 360}, 70%, 90%)`;
      ctx.fillRect(x, y, width, height);

      // Draw design border
      ctx.strokeStyle = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw margins if available
      if (item.withMargins) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        const marginX = x - (item.withMargins.width - item.width) * scale / 2;
        const marginY = y - (item.withMargins.height - item.height) * scale / 2;
        ctx.strokeRect(marginX, marginY, item.withMargins.width * scale, item.withMargins.height * scale);
        ctx.setLineDash([]);
      }

      // Draw design info
      ctx.fillStyle = '#1f2937';
      ctx.font = `${12 * zoom}px Arial`;
      ctx.fillText(
        `${design.filename || design.name}`,
        x + 5,
        y + 20 * zoom
      );
      ctx.fillText(
        `${item.width}×${item.height}mm`,
        x + 5,
        y + 35 * zoom
      );
    });

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [arrangements, pageWidth, pageHeight, designs, zoom, panOffset, scale]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const downloadPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `matbixx-preview-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!arrangements || arrangements.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Maximize className="h-5 w-5" />
            Önizleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Tasarımları yerleştirin ve önizleme görün
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize className="h-5 w-5" />
            Yerleştirme Önizlemesi
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {efficiency} verimlilik
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex items-center gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetView}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={downloadPreview}>
            <Download className="h-4 w-4" />
          </Button>
          {onGeneratePDF && (
            <Button size="sm" onClick={onGeneratePDF} className="ml-auto">
              PDF Oluştur
            </Button>
          )}
        </div>

        {/* Canvas Container */}
        <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '400px' }}>
          <div className="w-full h-full overflow-auto">
            <canvas
              ref={canvasRef}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{arrangements.length}</div>
            <div className="text-gray-500">Yerleştirilen</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{pageWidth}×{pageHeight}mm</div>
            <div className="text-gray-500">Sayfa Boyutu</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{efficiency}</div>
            <div className="text-gray-500">Verimlilik</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}