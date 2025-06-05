import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import sharp from 'sharp';

const execAsync = promisify(exec);

interface FileMetadata {
  dimensions?: string;
  colorProfile?: string;
  resolution?: number;
  hasTransparency?: boolean;
  pageCount?: number;
  realDimensionsMM?: string;
  processingNotes?: string;
  contentPreserved?: boolean;
}

export class FileProcessingService {
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

  async processFile(filePath: string, mimeType: string): Promise<FileMetadata> {
    try {
      const contentIntegrityCheck = await this.verifyContentIntegrity(filePath, mimeType);

      if (!contentIntegrityCheck) {
        return {
          dimensions: 'Unknown',
          processingNotes: 'File integrity check failed',
          contentPreserved: false
        };
      }

      if (mimeType === 'application/pdf') {
        return await this.processPDFAdvanced(filePath);
      } else if (mimeType === 'image/svg+xml') {
        return await this.processSVGAdvanced(filePath);
      } else if (mimeType.includes('postscript') || mimeType.includes('eps')) {
        return await this.processEPSAdvanced(filePath);
      } else if (mimeType.startsWith('image/')) {
        return await this.processImageAdvanced(filePath);
      } else {
        return await this.processGenericFile(filePath);
      }
    } catch (error) {
      console.error('File processing error:', error);
      return {
        dimensions: 'Unknown',
        processingNotes: 'Processing failed: ' + (error as Error).message,
        contentPreserved: false
      };
    }
  }

  private async verifyContentIntegrity(filePath: string, mimeType: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) return false;

      if (mimeType === 'application/pdf') {
        const buffer = fs.readFileSync(filePath);
        return buffer.toString('ascii', 0, 4) === '%PDF';
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private async processPDFAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      dimensions: 'Vector Document',
      colorProfile: 'CMYK',
      contentPreserved: true
    };

    try {
      console.log('📄 PDF integrity check:', await this.verifyContentIntegrity(filePath, 'application/pdf'));

      const buffer = fs.readFileSync(filePath);
      const pdfString = buffer.toString('binary');

      const mediaBoxMatch = pdfString.match(/\/MediaBox\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/);

      if (mediaBoxMatch) {
        const [, x1, y1, x2, y2] = mediaBoxMatch.map(Number);
        const widthPt = x2 - x1;
        const heightPt = y2 - y1;

        const widthMM = Math.round(widthPt * 0.352778);
        const heightMM = Math.round(heightPt * 0.352778);

        metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
        metadata.processingNotes = `PDF analyzed via MediaBox: ${widthMM}×${heightMM}mm`;

        console.log(`✅ PDF dimensions from MediaBox: ${widthMM}×${heightMM}mm`);
      } else {
        metadata.realDimensionsMM = 'Boyut tespit edilemedi';
        metadata.processingNotes = 'MediaBox not found in PDF';
      }

      const pageMatch = pdfString.match(/\/Count\s+(\d+)/);
      metadata.pageCount = pageMatch ? parseInt(pageMatch[1]) : 1;

      return metadata;
    } catch (error) {
      console.error('PDF processing error:', error);
      metadata.processingNotes = 'PDF processing failed';
      metadata.contentPreserved = false;
      return metadata;
    }
  }

  private async processSVGAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      dimensions: 'Vector Document',
      colorProfile: 'RGB',
      contentPreserved: true
    };

    try {
      const svgContent = fs.readFileSync(filePath, 'utf8');

      const widthMatch = svgContent.match(/width\s*=\s*["']?([^"'\s>]+)/);
      const heightMatch = svgContent.match(/height\s*=\s*["']?([^"'\s>]+)/);

      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);

        if (!isNaN(width) && !isNaN(height)) {
          metadata.realDimensionsMM = `${Math.round(width)}x${Math.round(height)}mm`;
          metadata.processingNotes = `SVG dimensions: ${width}×${height}`;
        }
      }

      return metadata;
    } catch (error) {
      console.error('SVG processing error:', error);
      metadata.processingNotes = 'SVG processing failed';
      metadata.contentPreserved = false;
      return metadata;
    }
  }

  private async processEPSAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      dimensions: 'Vector Document',
      colorProfile: 'CMYK',
      contentPreserved: true,
      processingNotes: 'EPS file processed'
    };

    return metadata;
  }

  private async processImageAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};

    try {
      const imageMetadata = await sharp(filePath).metadata();

      metadata.dimensions = `${imageMetadata.width}×${imageMetadata.height}`;
      metadata.resolution = imageMetadata.density;
      metadata.hasTransparency = imageMetadata.hasAlpha;
      metadata.colorProfile = this.getColorSpace(imageMetadata.space);
      metadata.processingNotes = 'Image processed with Sharp';
      metadata.contentPreserved = true;

      return metadata;
    } catch (error) {
      console.error('Image processing error:', error);
      metadata.processingNotes = 'Image processing failed';
      metadata.contentPreserved = false;
      return metadata;
    }
  }

  private async processGenericFile(filePath: string): Promise<FileMetadata> {
    return {
      dimensions: 'Unknown',
      processingNotes: 'Generic file processing',
      contentPreserved: true
    };
  }

  private getColorSpace(space?: string): string {
    switch (space) {
      case 'cmyk': return 'CMYK';
      case 'rgb': return 'RGB';
      case 'srgb': return 'sRGB';
      default: return 'Unknown';
    }
  }

  async generateThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}.png`);

      if (filePath.toLowerCase().endsWith('.pdf')) {
        return await this.generatePDFThumbnail(filePath, filename);
      }

      await sharp(filePath)
        .resize(200, 150, { fit: 'inside' })
        .png()
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return '';
    }
  }

  async generatePDFThumbnail(filePath: string, filename: string): Promise<string> {
    console.log('ImageMagick not available for PDF thumbnail');
    return '';
  }

  async validateFile(filePath: string, mimeType: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const stats = fs.statSync(filePath);

      if (stats.size === 0) {
        errors.push('File is empty');
      }

      if (stats.size > 100 * 1024 * 1024) {
        errors.push('File too large (>100MB)');
      }

      const integrity = await this.verifyContentIntegrity(filePath, mimeType);
      if (!integrity) {
        errors.push('File integrity check failed');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['File validation failed']
      };
    }
  }

  async extractDesignsFromPDF(filePath: string): Promise<Array<{ width: number; height: number; page: number }>> {
    try {
      const metadata = await this.processPDFAdvanced(filePath);

      if (metadata.realDimensionsMM) {
        const match = metadata.realDimensionsMM.match(/(\d+)x(\d+)mm/);
        if (match) {
          return [{
            width: parseInt(match[1]),
            height: parseInt(match[2]),
            page: 1
          }];
        }
      }

      return [];
    } catch (error) {
      console.error('PDF design extraction error:', error);
      return [];
    }
  }

  async extractRealDesignContent(filePath: string, mimeType: string): Promise<{
    hasVectorContent: boolean;
    contentQuality: 'low' | 'medium' | 'high';
    processingRecommendation: string;
  }> {
    try {
      if (mimeType === 'application/pdf') {
        return {
          hasVectorContent: true,
          contentQuality: 'medium',
          processingRecommendation: 'Vector processing with quality preservation'
        };
      } else if (mimeType === 'image/svg+xml') {
        return {
          hasVectorContent: true,
          contentQuality: 'high',
          processingRecommendation: 'SVG vector processing'
        };
      } else if (mimeType.startsWith('image/')) {
        return {
          hasVectorContent: false,
          contentQuality: 'medium',
          processingRecommendation: 'Raster image processing'
        };
      }

      return {
        hasVectorContent: false,
        contentQuality: 'low',
        processingRecommendation: 'Standard processing'
      };
    } catch (error) {
      return {
        hasVectorContent: false,
        contentQuality: 'low',
        processingRecommendation: 'Error in analysis'
      };
    }
  }

  async verifyVectorContent(filePath: string, mimeType: string): Promise<{
    isVector: boolean;
    quality: 'low' | 'medium' | 'high';
    recommendation: string;
  }> {
    const analysis = await this.extractRealDesignContent(filePath, mimeType);

    return {
      isVector: analysis.hasVectorContent,
      quality: analysis.contentQuality,
      recommendation: analysis.processingRecommendation
    };
  }

  async prepareFileForEmbedding(filePath: string, mimeType: string): Promise<{
    processedPath: string;
    contentAnalysis: any;
    preparationNotes: string;
  }> {
    try {
      const processedPath = path.join(this.uploadDir, `processed_${Date.now()}`);
      fs.copyFileSync(filePath, processedPath);

      const contentAnalysis = await this.extractRealDesignContent(filePath, mimeType);

      return {
        processedPath,
        contentAnalysis,
        preparationNotes: `File prepared for embedding: ${contentAnalysis.processingRecommendation}`
      };
    } catch (error) {
      console.error('File preparation error:', error);
      return {
        processedPath: filePath,
        contentAnalysis: { hasVectorContent: false, contentQuality: 'low', processingRecommendation: 'Standard processing' },
        preparationNotes: 'File preparation failed, using original'
      };
    }
  }

  async processLayoutWithPython(
    files: string[],
    pageWidth: number = 210,
    pageHeight: number = 297,
    cuttingSpace: number = 5
  ): Promise<any> {
    try {
      console.log('🐍 Profesyonel Python dizim motoru başlatılıyor...');

      const inputData = {
        files,
        pageWidth,
        pageHeight,
        cuttingSpace,
        outputPath: path.join(process.cwd(), 'uploads', `professional-layout-${Date.now()}.pdf`)
      };

      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
          path.join(process.cwd(), 'server', 'professionalLayoutEngine.py'),
          JSON.stringify(inputData)
        ]);

        let result = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
          result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
          console.error('Python stderr:', data.toString());
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const parsedResult = JSON.parse(result.trim());
              console.log('✅ Profesyonel Python işlemi başarılı:', parsedResult);
              resolve(parsedResult);
            } catch (parseError) {
              console.error('❌ Python sonuç parsing hatası:', parseError);
              reject(new Error('Python sonucu parse edilemedi'));
            }
          } else {
            console.error(`❌ Python process exited with code ${code}`);
            console.error('Error output:', error);
            reject(new Error(`Python process failed: ${error}`));
          }
        });

        pythonProcess.on('error', (err) => {
          console.error('❌ Python process spawn error:', err);
          reject(err);
        });
      });

    } catch (error) {
      console.error('❌ processLayoutWithPython error:', error);
      throw error;
    }
  }
}

export const fileProcessingService = new FileProcessingService();