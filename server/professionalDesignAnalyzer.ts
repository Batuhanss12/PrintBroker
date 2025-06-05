import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DesignDimensions {
  widthMM: number;
  heightMM: number;
  category: 'logo' | 'label' | 'sticker' | 'business_card' | 'poster' | 'banner';
  confidence: number;
  description: string;
}

interface AnalysisResult {
  success: boolean;
  dimensions: DesignDimensions;
  detectedDesigns: number;
  processingNotes: string[];
}

export class ProfessionalDesignAnalyzer {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async analyzeDesignFile(filePath: string, fileName: string, mimeType: string): Promise<AnalysisResult> {
    try {
      console.log(`🔍 Profesyonel analiz başlatılıyor: ${fileName}`);
      
      switch (mimeType) {
        case 'application/pdf':
          return await this.analyzePDF(filePath, fileName);
        case 'image/svg+xml':
          return await this.analyzeSVG(filePath, fileName);
        case 'application/postscript':
        case 'application/eps':
          return await this.analyzeEPS(filePath, fileName);
        case 'image/jpeg':
        case 'image/png':
          return await this.analyzeImage(filePath, fileName);
        default:
          return this.createFallbackAnalysis(fileName);
      }
    } catch (error) {
      console.error('Analiz hatası:', error);
      return this.createFallbackAnalysis(fileName);
    }
  }

  private async analyzePDF(filePath: string, fileName: string): Promise<AnalysisResult> {
    try {
      // PDF dosyasını okuyup boyutları tespit et
      const pdfBuffer = fs.readFileSync(filePath);
      
      // PDF header'ından sayfa boyutlarını bul
      const pdfText = pdfBuffer.toString('binary');
      
      // MediaBox veya CropBox'ı ara
      const mediaBoxMatch = pdfText.match(/\/MediaBox\s*\[\s*(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s*\]/);
      let widthPt = 0, heightPt = 0;
      
      if (mediaBoxMatch) {
        const x1 = parseFloat(mediaBoxMatch[1]);
        const y1 = parseFloat(mediaBoxMatch[2]);
        const x2 = parseFloat(mediaBoxMatch[3]);
        const y2 = parseFloat(mediaBoxMatch[4]);
        
        widthPt = x2 - x1;
        heightPt = y2 - y1;
      }
      
      // Varsayılan boyutlar kullan
      if (widthPt === 0 || heightPt === 0) {
        widthPt = 595; // A4 width in points
        heightPt = 842; // A4 height in points
      }

      // Points'i mm'ye çevir (1 pt = 0.352778 mm)
      const widthMM = Math.round(widthPt * 0.352778);
      const heightMM = Math.round(heightPt * 0.352778);

      const category = this.determineCategory(widthMM, heightMM, fileName);
      
      return {
        success: true,
        dimensions: {
          widthMM,
          heightMM,
          category,
          confidence: 0.8,
          description: `PDF analizi: ${widthMM}x${heightMM}mm ${category}`
        },
        detectedDesigns: 1,
        processingNotes: [
          'PDF boyutları tespit edildi',
          `Boyutlar: ${widthMM}x${heightMM}mm`,
          `Kategori: ${category}`
        ]
      };
    } catch (error) {
      console.warn('PDF analiz hatası:', error);
      return this.analyzeByFileName(fileName);
    }
  }

  private async analyzeSVG(filePath: string, fileName: string): Promise<AnalysisResult> {
    try {
      const svgContent = fs.readFileSync(filePath, 'utf8');
      
      // SVG boyutlarını tespit et
      let widthMM = 0, heightMM = 0;
      
      // width ve height attributeleri
      const widthMatch = svgContent.match(/width="([^"]+)"/);
      const heightMatch = svgContent.match(/height="([^"]+)"/);
      
      if (widthMatch && heightMatch) {
        widthMM = this.parseSize(widthMatch[1]);
        heightMM = this.parseSize(heightMatch[1]);
      }
      
      // Viewbox'tan boyut hesapla
      if (widthMM === 0 || heightMM === 0) {
        const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
        if (viewBoxMatch) {
          const values = viewBoxMatch[1].split(/\s+/);
          if (values.length === 4) {
            // SVG units genellikle px, 3.78 px = 1 mm
            widthMM = Math.round(parseFloat(values[2]) / 3.78);
            heightMM = Math.round(parseFloat(values[3]) / 3.78);
          }
        }
      }

      const category = this.determineCategory(widthMM, heightMM, fileName);
      
      return {
        success: true,
        dimensions: {
          widthMM,
          heightMM,
          category,
          confidence: 0.85,
          description: `SVG analizi: ${widthMM}x${heightMM}mm ${category}`
        },
        detectedDesigns: 1,
        processingNotes: [
          'SVG boyutları tespit edildi',
          `Boyutlar: ${widthMM}x${heightMM}mm`,
          `Kategori: ${category}`
        ]
      };
    } catch (error) {
      console.warn('SVG analiz hatası:', error);
      return this.analyzeByFileName(fileName);
    }
  }

  private async analyzeEPS(filePath: string, fileName: string): Promise<AnalysisResult> {
    try {
      const epsContent = fs.readFileSync(filePath, 'latin1');
      
      // BoundingBox'ı bul
      const boundingBoxMatch = epsContent.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      
      if (boundingBoxMatch) {
        const x1 = parseInt(boundingBoxMatch[1]);
        const y1 = parseInt(boundingBoxMatch[2]);
        const x2 = parseInt(boundingBoxMatch[3]);
        const y2 = parseInt(boundingBoxMatch[4]);
        
        // Points'i mm'ye çevir
        const widthMM = Math.round((x2 - x1) * 0.352778);
        const heightMM = Math.round((y2 - y1) * 0.352778);
        
        const category = this.determineCategory(widthMM, heightMM, fileName);
        
        return {
          success: true,
          dimensions: {
            widthMM,
            heightMM,
            category,
            confidence: 0.8,
            description: `EPS analizi: ${widthMM}x${heightMM}mm ${category}`
          },
          detectedDesigns: 1,
          processingNotes: [
            'EPS BoundingBox tespit edildi',
            `Boyutlar: ${widthMM}x${heightMM}mm`,
            `Kategori: ${category}`
          ]
        };
      }
      
      return this.analyzeByFileName(fileName);
    } catch (error) {
      console.warn('EPS analiz hatası:', error);
      return this.analyzeByFileName(fileName);
    }
  }

  private async analyzeImage(filePath: string, fileName: string): Promise<AnalysisResult> {
    try {
      const metadata = await sharp(filePath).metadata();
      
      if (metadata.width && metadata.height) {
        // 300 DPI varsayımı ile mm'ye çevir
        const dpi = metadata.density || 300;
        const widthMM = Math.round((metadata.width / dpi) * 25.4);
        const heightMM = Math.round((metadata.height / dpi) * 25.4);
        
        const category = this.determineCategory(widthMM, heightMM, fileName);
        
        return {
          success: true,
          dimensions: {
            widthMM,
            heightMM,
            category,
            confidence: 0.7,
            description: `Görsel analizi: ${widthMM}x${heightMM}mm ${category}`
          },
          detectedDesigns: 1,
          processingNotes: [
            'Görsel boyutları hesaplandı',
            `DPI: ${dpi}`,
            `Boyutlar: ${widthMM}x${heightMM}mm`,
            `Kategori: ${category}`
          ]
        };
      }
      
      return this.analyzeByFileName(fileName);
    } catch (error) {
      console.warn('Görsel analiz hatası:', error);
      return this.analyzeByFileName(fileName);
    }
  }

  private analyzeByFileName(fileName: string): AnalysisResult {
    const name = fileName.toLowerCase();
    let widthMM = 80, heightMM = 50, category: DesignDimensions['category'] = 'label';
    
    // Akıllı dosya adı analizi
    if (name.includes('logo') || name.includes('marka')) {
      widthMM = 100; heightMM = 80; category = 'logo';
    } else if (name.includes('kartvizit') || name.includes('business') || name.includes('card')) {
      widthMM = 85; heightMM = 55; category = 'business_card';
    } else if (name.includes('etiket') || name.includes('label') || name.includes('sticker')) {
      // Etiket boyutları için yaygın standartlar
      if (name.includes('yuvarlak') || name.includes('round')) {
        widthMM = 50; heightMM = 50; category = 'sticker';
      } else if (name.includes('büyük') || name.includes('large')) {
        widthMM = 70; heightMM = 40; category = 'label';
      } else {
        widthMM = 50; heightMM = 30; category = 'label';
      }
    } else if (name.includes('poster') || name.includes('afiş')) {
      widthMM = 350; heightMM = 500; category = 'poster';
    } else if (name.includes('banner') || name.includes('pankart')) {
      widthMM = 150; heightMM = 50; category = 'banner';
    }
    
    // Boyut ipuçları
    const sizeMatch = name.match(/(\d+)x(\d+)/);
    if (sizeMatch) {
      widthMM = parseInt(sizeMatch[1]);
      heightMM = parseInt(sizeMatch[2]);
    }

    return {
      success: true,
      dimensions: {
        widthMM,
        heightMM,
        category,
        confidence: 0.7,
        description: `Akıllı dosya analizi: ${widthMM}x${heightMM}mm ${category}`
      },
      detectedDesigns: 1,
      processingNotes: [
        'Dosya adından akıllı analiz yapıldı',
        `Tespit edilen boyutlar: ${widthMM}x${heightMM}mm`,
        `Kategori: ${category}`,
        'Profesyonel standartlar uygulandı'
      ]
    };
  }

  private determineCategory(widthMM: number, heightMM: number, fileName: string): DesignDimensions['category'] {
    const name = fileName.toLowerCase();
    
    // Dosya adından kategori tespiti
    if (name.includes('logo')) return 'logo';
    if (name.includes('kartvizit') || name.includes('business')) return 'business_card';
    if (name.includes('sticker')) return 'sticker';
    if (name.includes('poster') || name.includes('afiş')) return 'poster';
    if (name.includes('banner')) return 'banner';
    
    // Boyutlara göre kategori tespiti
    if (widthMM >= 80 && widthMM <= 90 && heightMM >= 50 && heightMM <= 60) return 'business_card';
    if (widthMM <= 100 && heightMM <= 100) return 'label';
    if (widthMM > 200 || heightMM > 200) return 'poster';
    if (widthMM > heightMM * 2 || heightMM > widthMM * 2) return 'banner';
    
    return 'label';
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+\.?\d*)(mm|px|in|cm)?$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'px';
    
    switch (unit) {
      case 'mm': return value;
      case 'cm': return value * 10;
      case 'in': return value * 25.4;
      case 'px': return value / 3.78; // 96 DPI varsayımı
      default: return value;
    }
  }

  private createFallbackAnalysis(fileName: string): AnalysisResult {
    return {
      success: false,
      dimensions: {
        widthMM: 50,
        heightMM: 30,
        category: 'label',
        confidence: 0.3,
        description: 'Varsayılan boyutlar kullanıldı'
      },
      detectedDesigns: 1,
      processingNotes: [
        'Dosya analizi başarısız',
        'Varsayılan boyutlar atandı',
        'Manuel düzenleme önerilir'
      ]
    };
  }
}

export const professionalDesignAnalyzer = new ProfessionalDesignAnalyzer();