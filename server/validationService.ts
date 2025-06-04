
import { fileProcessingService } from './fileProcessingService';

// Validasyon arayüzleri
interface PageDimensions {
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'inch';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface FileValidationResult extends ValidationResult {
  metadata?: {
    dimensions?: string;
    resolution?: number;
    colorProfile?: string;
    optimizationSuggestions?: string[];
  };
}

interface LayoutValidationResult extends ValidationResult {
  efficiency: number;
  alternatives: Array<{
    dimensions: PageDimensions;
    efficiency: number;
    cost: string;
    description: string;
  }>;
}

export class ValidationService {
  // Boyut limitleri ve kuralları
  private static readonly DIMENSION_LIMITS = {
    MIN_WIDTH_MM: 10,
    MAX_WIDTH_MM: 2000,
    MIN_HEIGHT_MM: 10,
    MAX_HEIGHT_MM: 3000,
    MIN_RATIO: 0.1,
    MAX_RATIO: 10,
    COMMON_RATIOS: [
      { ratio: 1.414, name: 'A Serisi (√2)', tolerance: 0.05 },
      { ratio: 1.0, name: 'Kare', tolerance: 0.05 },
      { ratio: 1.618, name: 'Altın Oran', tolerance: 0.05 },
      { ratio: 0.707, name: 'A Serisi Yatay', tolerance: 0.05 }
    ]
  };

  private static readonly STANDARD_SIZES = [
    { name: 'A4', width: 210, height: 297, unit: 'mm' as const },
    { name: 'A3', width: 297, height: 420, unit: 'mm' as const },
    { name: 'A5', width: 148, height: 210, unit: 'mm' as const },
    { name: 'Letter', width: 216, height: 279, unit: 'mm' as const },
    { name: 'Legal', width: 216, height: 356, unit: 'mm' as const },
    { name: '10x15cm', width: 100, height: 150, unit: 'mm' as const },
    { name: '13x18cm', width: 130, height: 180, unit: 'mm' as const },
    { name: '20x30cm', width: 200, height: 300, unit: 'mm' as const }
  ];

  // Birim dönüşümleri
  private static convertToMM(value: number, unit: string): number {
    switch (unit) {
      case 'cm': return value * 10;
      case 'inch': return value * 25.4;
      case 'mm':
      default: return value;
    }
  }

  // Sayfa boyutu validasyonu
  static validatePageDimensions(dimensions: PageDimensions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const widthMM = this.convertToMM(dimensions.width, dimensions.unit);
    const heightMM = this.convertToMM(dimensions.height, dimensions.unit);

    // Minimum/maksimum boyut kontrolü
    if (widthMM < this.DIMENSION_LIMITS.MIN_WIDTH_MM) {
      errors.push(`Genişlik çok küçük (minimum ${this.DIMENSION_LIMITS.MIN_WIDTH_MM}mm)`);
    }
    if (widthMM > this.DIMENSION_LIMITS.MAX_WIDTH_MM) {
      errors.push(`Genişlik çok büyük (maksimum ${this.DIMENSION_LIMITS.MAX_WIDTH_MM}mm)`);
    }
    if (heightMM < this.DIMENSION_LIMITS.MIN_HEIGHT_MM) {
      errors.push(`Yükseklik çok küçük (minimum ${this.DIMENSION_LIMITS.MIN_HEIGHT_MM}mm)`);
    }
    if (heightMM > this.DIMENSION_LIMITS.MAX_HEIGHT_MM) {
      errors.push(`Yükseklik çok büyük (maksimum ${this.DIMENSION_LIMITS.MAX_HEIGHT_MM}mm)`);
    }

    // Oran kontrolü
    const ratio = widthMM / heightMM;
    if (ratio < this.DIMENSION_LIMITS.MIN_RATIO || ratio > this.DIMENSION_LIMITS.MAX_RATIO) {
      warnings.push('Sayfa oranı çok aşırı - yazdırma sorunları olabilir');
    }

    // Standart boyut önerileri
    const closestStandard = this.findClosestStandardSize(widthMM, heightMM);
    if (closestStandard.distance > 20) {
      suggestions.push(`Standart ${closestStandard.size.name} boyutunu (${closestStandard.size.width}×${closestStandard.size.height}mm) düşünebilirsiniz`);
    }

    // Oran önerileri
    const closestRatio = this.findClosestRatio(ratio);
    if (closestRatio.distance > 0.1) {
      suggestions.push(`${closestRatio.ratio.name} oranını kullanmak daha estetik olabilir`);
    }

    // Maliyet optimizasyonu
    if (widthMM * heightMM > 100000) { // 100cm²'den büyük
      suggestions.push('Büyük boyutlar maliyeti artırır - boyutu küçültmeyi düşünün');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Dosya validasyonu
  static async validateFile(filePath: string, mimeType: string): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Dosya işleme servisini kullan
      const metadata = await fileProcessingService.processFile(filePath, mimeType);
      const optimizationSuggestions: string[] = [];

      // Format kontrolü
      const supportedFormats = ['application/pdf', 'image/svg+xml', 'application/postscript'];
      if (!supportedFormats.includes(mimeType)) {
        errors.push('Desteklenmeyen dosya formatı - PDF, SVG veya EPS kullanın');
      }

      // Çözünürlük kontrolü (raster içerik için)
      if (metadata.resolution) {
        if (metadata.resolution < 150) {
          warnings.push('Düşük çözünürlük - yazdırma kalitesi düşük olabilir');
          optimizationSuggestions.push('En az 300 DPI çözünürlük önerilir');
        } else if (metadata.resolution > 600) {
          suggestions.push('Çok yüksek çözünürlük - dosya boyutunu azaltabilirsiniz');
          optimizationSuggestions.push('300-600 DPI arası optimal çözünürlük');
        }
      }

      // Renk profili kontrolü
      if (metadata.colorProfile) {
        if (metadata.colorProfile !== 'CMYK' && mimeType === 'application/pdf') {
          warnings.push('RGB renk profili tespit edildi - CMYK baskı için daha uygun');
          optimizationSuggestions.push('Profesyonel baskı için CMYK renk profiline dönüştürün');
        }
      }

      // Boyut optimizasyonu
      const fileSizeKB = require('fs').statSync(filePath).size / 1024;
      if (fileSizeKB > 10000) { // 10MB'dan büyük
        warnings.push('Büyük dosya boyutu - yükleme süresi artabilir');
        optimizationSuggestions.push('Dosya boyutunu 10MB altında tutmaya çalışın');
      }

      // Şeffaflık kontrolü
      if (metadata.hasTransparency && mimeType !== 'image/svg+xml') {
        suggestions.push('Şeffaflık tespit edildi - baskı sonucu farklı olabilir');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        metadata: {
          dimensions: metadata.dimensions,
          resolution: metadata.resolution,
          colorProfile: metadata.colorProfile,
          optimizationSuggestions
        }
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Dosya analizi hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  // Layout validasyonu ve optimizasyon önerileri
  static validateLayout(
    items: Array<{ width: number; height: number }>,
    pageWidth: number,
    pageHeight: number
  ): LayoutValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Toplam alan hesaplama
    const totalItemArea = items.reduce((sum, item) => sum + (item.width * item.height), 0);
    const pageArea = pageWidth * pageHeight;
    const efficiency = (totalItemArea / pageArea) * 100;

    // Verimlilik kontrolü
    if (efficiency < 30) {
      warnings.push('Düşük alan kullanımı - sayfa boyutunu küçültmeyi düşünün');
    } else if (efficiency > 90) {
      warnings.push('Çok yoğun düzen - kesim payı problemi olabilir');
    }

    // Alternatif düzenler
    const alternatives = this.generateLayoutAlternatives(items, efficiency);

    // Maliyet optimizasyonu önerileri
    if (pageArea > 150000) { // 150cm²'den büyük
      suggestions.push('Büyük sayfa boyutu maliyeti artırır');
    }

    // Kesim payı uyarıları
    const hasSmallItems = items.some(item => item.width < 20 || item.height < 20);
    if (hasSmallItems) {
      warnings.push('Küçük parçalar var - kesim payı dikkat edilmeli');
      suggestions.push('Küçük parçalar için minimum 3mm kesim payı bırakın');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      efficiency: Math.round(efficiency),
      alternatives
    };
  }

  // Yardımcı metodlar
  private static findClosestStandardSize(widthMM: number, heightMM: number) {
    let closest = this.STANDARD_SIZES[0];
    let minDistance = Infinity;

    this.STANDARD_SIZES.forEach(size => {
      const distance = Math.sqrt(
        Math.pow(widthMM - size.width, 2) + Math.pow(heightMM - size.height, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = size;
      }
    });

    return { size: closest, distance: minDistance };
  }

  private static findClosestRatio(ratio: number) {
    let closest = this.DIMENSION_LIMITS.COMMON_RATIOS[0];
    let minDistance = Infinity;

    this.DIMENSION_LIMITS.COMMON_RATIOS.forEach(commonRatio => {
      const distance = Math.abs(ratio - commonRatio.ratio);
      if (distance < minDistance) {
        minDistance = distance;
        closest = commonRatio;
      }
    });

    return { ratio: closest, distance: minDistance };
  }

  private static generateLayoutAlternatives(
    items: Array<{ width: number; height: number }>,
    currentEfficiency: number
  ) {
    const alternatives = [];

    // A4 alternatifi
    alternatives.push({
      dimensions: { width: 210, height: 297, unit: 'mm' as const },
      efficiency: this.calculateEfficiencyForSize(items, 210, 297),
      cost: 'Düşük',
      description: 'Standart A4 boyutu - ekonomik seçenek'
    });

    // A3 alternatifi
    alternatives.push({
      dimensions: { width: 297, height: 420, unit: 'mm' as const },
      efficiency: this.calculateEfficiencyForSize(items, 297, 420),
      cost: 'Orta',
      description: 'A3 boyutu - daha fazla alan'
    });

    // Özel optimum boyut
    const optimumSize = this.calculateOptimumSize(items);
    alternatives.push({
      dimensions: optimumSize,
      efficiency: this.calculateEfficiencyForSize(items, optimumSize.width, optimumSize.height),
      cost: 'Değişken',
      description: 'Hesaplanmış optimum boyut'
    });

    return alternatives.filter(alt => alt.efficiency > currentEfficiency).slice(0, 3);
  }

  private static calculateEfficiencyForSize(
    items: Array<{ width: number; height: number }>,
    pageWidth: number,
    pageHeight: number
  ): number {
    // Basit bin packing simülasyonu
    const totalItemArea = items.reduce((sum, item) => sum + (item.width * item.height), 0);
    const pageArea = pageWidth * pageHeight;
    return Math.min(100, Math.round((totalItemArea / pageArea) * 100));
  }

  private static calculateOptimumSize(items: Array<{ width: number; height: number }>) {
    const totalArea = items.reduce((sum, item) => sum + (item.width * item.height), 0);
    const maxWidth = Math.max(...items.map(item => item.width));
    const maxHeight = Math.max(...items.map(item => item.height));
    
    // %75 verimlilik hedefi ile boyut hesaplama
    const targetArea = totalArea / 0.75;
    const ratio = 1.414; // A serisi oranı
    
    const width = Math.max(maxWidth * 1.2, Math.sqrt(targetArea * ratio));
    const height = Math.max(maxHeight * 1.2, Math.sqrt(targetArea / ratio));
    
    return {
      width: Math.round(width),
      height: Math.round(height),
      unit: 'mm' as const
    };
  }
}

export const validationService = new ValidationService();
