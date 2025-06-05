import { enhancedPDFAnalyzer } from './enhancedPDFAnalyzer';
import { pythonAnalyzerService } from './pythonAnalyzerService';
import { fileProcessingService } from './fileProcessingService';
import path from 'path';
import fs from 'fs';

export interface AnalysisResult {
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

export interface ManualDimensionInput {
  widthMM: number;
  heightMM: number;
  userNote?: string;
}

export class MultiMethodAnalyzer {
  private uploadDir = path.join(process.cwd(), 'uploads');
  private thumbnailDir = path.join(this.uploadDir, 'thumbnails');

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  async analyzeDesignFile(filePath: string, fileName: string, mimeType: string): Promise<AnalysisResult> {
    console.log(`🔍 Multi-method analysis starting: ${fileName}`);
    
    const result: AnalysisResult = {
      success: false,
      fileName,
      filePath,
      dimensions: {
        widthMM: 50,
        heightMM: 30,
        confidence: 0.1,
        method: 'fallback',
        description: 'Analysis failed'
      },
      contentAnalysis: {
        hasVectorContent: false,
        hasRasterContent: false,
        hasText: false,
        isEmpty: true
      },
      qualityReport: {
        isVectorBased: false,
        hasProperBoxes: false,
        needsOptimization: true,
        warnings: [],
        recommendations: []
      },
      processingNotes: [],
      requiresManualInput: false,
      alternativeMethods: []
    };

    try {
      // PDF dosyaları için gelişmiş analiz
      if (mimeType === 'application/pdf') {
        const pdfResult = await this.analyzePDFFile(filePath, fileName);
        if (pdfResult.success && pdfResult.dimensions.confidence > 0.5) {
          return this.enhanceResult(pdfResult, fileName, filePath);
        }
        
        // PDF analizi başarısız - fallback yöntemleri dene
        result.processingNotes.push('PDF analysis failed, trying fallback methods');
        result.alternativeMethods.push('enhanced-pdf-analysis');
      }

      // Python tabanlı analiz (tüm dosya türleri için)
      try {
        const pythonResult = await pythonAnalyzerService.analyzeFile(filePath, fileName, mimeType);
        if (pythonResult.success) {
          return this.convertPythonResult(pythonResult, fileName, filePath);
        }
        result.alternativeMethods.push('python-analysis');
      } catch (error) {
        result.processingNotes.push(`Python analysis failed: ${error}`);
      }

      // Dosya işleme servisi ile temel analiz
      try {
        const fileResult = await fileProcessingService.processFile(filePath, mimeType);
        if (fileResult.realDimensionsMM) {
          return this.convertFileProcessingResult(fileResult, fileName, filePath);
        }
        result.alternativeMethods.push('file-processing');
      } catch (error) {
        result.processingNotes.push(`File processing failed: ${error}`);
      }

      // Tüm yöntemler başarısız - manuel girdi gerekli
      result.requiresManualInput = true;
      result.qualityReport.warnings.push('Automatic dimension detection failed');
      result.qualityReport.recommendations.push('Manual dimension input required');
      result.processingNotes.push('All automatic analysis methods failed');
      
      return result;

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown analysis error';
      result.requiresManualInput = true;
      return result;
    }
  }

  private async analyzePDFFile(filePath: string, fileName: string): Promise<any> {
    try {
      return await enhancedPDFAnalyzer.analyzePDF(filePath, fileName);
    } catch (error) {
      console.error('Enhanced PDF analysis failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'PDF analysis failed' };
    }
  }

  private enhanceResult(pdfResult: any, fileName: string, filePath: string): AnalysisResult {
    const thumbnailPath = this.generateThumbnailPath(fileName);
    
    return {
      success: true,
      fileName,
      filePath,
      dimensions: pdfResult.dimensions,
      contentAnalysis: pdfResult.contentAnalysis,
      qualityReport: pdfResult.qualityReport,
      processingNotes: pdfResult.processingNotes || [],
      thumbnailPath,
      requiresManualInput: pdfResult.dimensions.confidence < 0.3,
      alternativeMethods: [],
      error: pdfResult.error
    };
  }

  private convertPythonResult(pythonResult: any, fileName: string, filePath: string): AnalysisResult {
    const thumbnailPath = this.generateThumbnailPath(fileName);
    
    return {
      success: true,
      fileName,
      filePath,
      dimensions: {
        widthMM: pythonResult.realWorldDimensions?.widthMM || pythonResult.widthMM || 50,
        heightMM: pythonResult.realWorldDimensions?.heightMM || pythonResult.heightMM || 30,
        confidence: pythonResult.aiConfidence || 0.7,
        method: 'python-analysis',
        description: pythonResult.description || 'Python-based analysis'
      },
      contentAnalysis: {
        hasVectorContent: pythonResult.contentType !== 'raster',
        hasRasterContent: pythonResult.contentType === 'raster',
        hasText: pythonResult.hasText || false,
        isEmpty: false
      },
      qualityReport: {
        isVectorBased: pythonResult.contentType !== 'raster',
        hasProperBoxes: false,
        needsOptimization: pythonResult.recommendedRotation || false,
        warnings: pythonResult.notes || [],
        recommendations: pythonResult.recommendedRotation ? ['Consider rotation for better layout'] : []
      },
      processingNotes: pythonResult.notes || [],
      thumbnailPath,
      requiresManualInput: (pythonResult.aiConfidence || 0.7) < 0.5,
      alternativeMethods: []
    };
  }

  private convertFileProcessingResult(fileResult: any, fileName: string, filePath: string): AnalysisResult {
    const thumbnailPath = this.generateThumbnailPath(fileName);
    const dimensions = this.parseDimensions(fileResult.realDimensionsMM);
    
    return {
      success: true,
      fileName,
      filePath,
      dimensions: {
        widthMM: dimensions.width,
        heightMM: dimensions.height,
        confidence: 0.6,
        method: 'file-processing',
        description: 'File metadata analysis'
      },
      contentAnalysis: {
        hasVectorContent: !fileResult.hasTransparency,
        hasRasterContent: fileResult.hasTransparency || false,
        hasText: false,
        isEmpty: false
      },
      qualityReport: {
        isVectorBased: !fileResult.hasTransparency,
        hasProperBoxes: false,
        needsOptimization: fileResult.needsOptimization || false,
        warnings: [],
        recommendations: fileResult.contentPreserved ? [] : ['Content may need preservation']
      },
      processingNotes: [fileResult.processingNotes || 'File processing completed'],
      thumbnailPath,
      requiresManualInput: false,
      alternativeMethods: []
    };
  }

  private parseDimensions(dimensionString: string): { width: number; height: number } {
    try {
      const match = dimensionString.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/);
      if (match) {
        return {
          width: Math.max(parseFloat(match[1]), 5),
          height: Math.max(parseFloat(match[2]), 5)
        };
      }
    } catch (error) {
      console.error('Dimension parsing error:', error);
    }
    
    return { width: 50, height: 30 };
  }

  private generateThumbnailPath(fileName: string): string {
    const nameWithoutExt = path.parse(fileName).name;
    return path.join(this.thumbnailDir, `${nameWithoutExt}_thumb.png`);
  }

  async applyManualDimensions(
    analysisResult: AnalysisResult, 
    manualInput: ManualDimensionInput
  ): Promise<AnalysisResult> {
    console.log(`📏 Applying manual dimensions: ${manualInput.widthMM}x${manualInput.heightMM}mm`);
    
    return {
      ...analysisResult,
      success: true,
      dimensions: {
        widthMM: manualInput.widthMM,
        heightMM: manualInput.heightMM,
        confidence: 1.0,
        method: 'manual',
        description: `Manual input: ${manualInput.widthMM}x${manualInput.heightMM}mm`
      },
      processingNotes: [
        ...analysisResult.processingNotes,
        'Manual dimensions applied',
        manualInput.userNote || 'User-provided dimensions'
      ],
      requiresManualInput: false,
      qualityReport: {
        ...analysisResult.qualityReport,
        warnings: analysisResult.qualityReport.warnings.filter(w => 
          !w.includes('dimension') && !w.includes('detection')
        ),
        recommendations: [
          ...analysisResult.qualityReport.recommendations.filter(r => 
            !r.includes('manual') && !r.includes('input')
          ),
          'Verify manual dimensions are correct for printing'
        ]
      }
    };
  }

  async generateThumbnail(filePath: string, fileName: string): Promise<string | null> {
    try {
      // Thumbnail oluşturma hatalarını yoksay - zorunlu değil
      console.log('Attempting thumbnail generation for:', fileName);
      const result = await fileProcessingService.generateThumbnail(filePath, fileName);
      if (result) {
        console.log('Thumbnail created successfully:', result);
        return result;
      }
      return null;
    } catch (error) {
      console.warn('Thumbnail generation skipped (not critical):', error.message);
      return null;
    }
  }

  async validateAnalysisResult(result: AnalysisResult): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Boyut kontrolleri
    if (result.dimensions.widthMM < 5 || result.dimensions.heightMM < 5) {
      issues.push('Dimensions too small for printing');
      suggestions.push('Minimum 5mm required for each dimension');
    }

    if (result.dimensions.widthMM > 400 || result.dimensions.heightMM > 600) {
      issues.push('Dimensions exceed standard sheet size');
      suggestions.push('Consider scaling or using larger sheet format');
    }

    // Güven seviyesi kontrolleri
    if (result.dimensions.confidence < 0.5) {
      issues.push('Low confidence in dimension detection');
      suggestions.push('Manual verification recommended');
    }

    // İçerik kontrolleri
    if (result.contentAnalysis.isEmpty) {
      issues.push('No content detected in file');
      suggestions.push('Verify file contains actual design elements');
    }

    if (!result.contentAnalysis.hasVectorContent && result.contentAnalysis.hasRasterContent) {
      suggestions.push('Vector-based designs recommended for better print quality');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  getCacheKey(filePath: string, mimeType: string): string {
    const stats = fs.statSync(filePath);
    return `${filePath}_${stats.mtime.getTime()}_${stats.size}_${mimeType}`;
  }
}

export const multiMethodAnalyzer = new MultiMethodAnalyzer();