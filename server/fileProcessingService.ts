import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
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
}

export class FileProcessingService {
  private uploadDir = path.join(process.cwd(), 'uploads');
  private thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');

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
    const metadata: FileMetadata = {};

    try {
      if (mimeType.startsWith('image/')) {
        return await this.processImage(filePath);
      } else if (mimeType === 'application/pdf') {
        return await this.processPDF(filePath);
      } else {
        return await this.processDocument(filePath);
      }
    } catch (error) {
      console.error('File processing error:', error);
      return {
        processingNotes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async processImage(filePath: string): Promise<FileMetadata> {
    try {
      const imageMetadata = await sharp(filePath).metadata();
      
      const dpi = imageMetadata.density || 300;
      const realWidthMM = Math.round((imageMetadata.width! / dpi) * 25.4);
      const realHeightMM = Math.round((imageMetadata.height! / dpi) * 25.4);
      
      return {
        dimensions: `${imageMetadata.width}x${imageMetadata.height}px`,
        resolution: dpi,
        hasTransparency: imageMetadata.hasAlpha,
        colorProfile: this.getColorSpace(imageMetadata.space),
        realDimensionsMM: `${realWidthMM}x${realHeightMM}mm`,
        processingNotes: `Image processed - ${dpi} DPI resolution`
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        processingNotes: 'Image processing error: ' + (error as Error).message,
        realDimensionsMM: '50x30mm',
        dimensions: 'Unknown'
      };
    }
  }

  private async processPDF(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};

    try {
      console.log(`Analyzing PDF: ${filePath}`);
      
      let realWidthMM = 50;
      let realHeightMM = 30;
      let pageCount = 1;
      let shape = 'rectangle';
      
      try {
        const { stdout } = await execAsync(`pdfinfo "${filePath}" 2>/dev/null`);
        console.log('PDF info:', stdout);
        
        const pageSizeMatch = stdout.match(/Page size:\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
        const pagesMatch = stdout.match(/Pages:\s*(\d+)/);
        
        if (pageSizeMatch) {
          const widthPoints = parseFloat(pageSizeMatch[1]);
          const heightPoints = parseFloat(pageSizeMatch[2]);
          
          realWidthMM = Math.round(widthPoints * 0.352778);
          realHeightMM = Math.round(heightPoints * 0.352778);
          
          const ratio = widthPoints / heightPoints;
          if (Math.abs(ratio - 1) < 0.1) {
            shape = 'square';
          } else if (ratio > 1.5) {
            shape = 'landscape';
          } else if (ratio < 0.67) {
            shape = 'portrait';
          } else {
            shape = 'rectangle';
          }
          
          console.log(`PDF dimensions: ${realWidthMM}x${realHeightMM}mm, shape: ${shape}`);
        }
        
        if (pagesMatch) {
          pageCount = parseInt(pagesMatch[1]);
        }
      } catch (pdfError) {
        console.log('PDFInfo not available, trying alternative method...');
        
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const fileContent = fileBuffer.toString('latin1');
          
          const mediaBoxMatch = fileContent.match(/\/MediaBox\s*\[\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*\]/);
          
          if (mediaBoxMatch) {
            const x1 = parseFloat(mediaBoxMatch[1]);
            const y1 = parseFloat(mediaBoxMatch[2]);
            const x2 = parseFloat(mediaBoxMatch[3]);
            const y2 = parseFloat(mediaBoxMatch[4]);
            
            const widthPoints = x2 - x1;
            const heightPoints = y2 - y1;
            
            realWidthMM = Math.round(widthPoints * 0.352778);
            realHeightMM = Math.round(heightPoints * 0.352778);
            
            console.log(`Extracted from MediaBox: ${realWidthMM}x${realHeightMM}mm`);
          }
        } catch (fallbackError) {
          console.log('PDF content analysis failed, using defaults');
        }
      }
      
      if (realWidthMM > 500 || realHeightMM > 500) {
        realWidthMM = Math.min(realWidthMM, 200);
        realHeightMM = Math.min(realHeightMM, 200);
      }
      
      if (realWidthMM < 10 || realHeightMM < 10) {
        realWidthMM = 50;
        realHeightMM = 30;
        shape = 'rectangle';
      }
      
      metadata.realDimensionsMM = `${realWidthMM}x${realHeightMM}mm`;
      metadata.dimensions = `Vector ${shape.charAt(0).toUpperCase() + shape.slice(1)}`;
      metadata.pageCount = pageCount;
      metadata.processingNotes = `PDF analyzed - ${realWidthMM}x${realHeightMM}mm ${shape} shape`;
      
      console.log('Final PDF metadata:', metadata);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      metadata.pageCount = 1;
      metadata.realDimensionsMM = '50x30mm';
      metadata.dimensions = 'Vector Rectangle';
      metadata.processingNotes = 'PDF analysis failed - using defaults';
    }

    return metadata;
  }

  private async processDocument(filePath: string): Promise<FileMetadata> {
    const stats = fs.statSync(filePath);
    return {
      dimensions: 'Document',
      processingNotes: `Document processed - ${this.formatFileSize(stats.size)}`,
      realDimensionsMM: '210x297mm' // A4 default
    };
  }

  private getColorSpace(space?: string): string {
    switch (space) {
      case 'srgb': return 'sRGB';
      case 'rgb': return 'RGB';
      case 'cmyk': return 'CMYK';
      case 'grey': return 'Grayscale';
      default: return 'RGB';
    }
  }

  async generateThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      const ext = path.extname(filename).toLowerCase();
      const thumbnailName = `thumb_${path.basename(filename, ext)}.jpg`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);

      if (ext === '.pdf') {
        return await this.generatePDFThumbnail(filePath, thumbnailName);
      }

      await sharp(filePath)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return `/uploads/thumbnails/${thumbnailName}`;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return '';
    }
  }

  async generatePDFThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, filename);
      
      await execAsync(`convert "${filePath}[0]" -thumbnail 200x200 "${thumbnailPath}" 2>/dev/null`);
      
      return `/uploads/thumbnails/${filename}`;
    } catch (error) {
      console.error('PDF thumbnail generation failed:', error);
      return '';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async validateFile(filePath: string, mimeType: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size > 50 * 1024 * 1024) {
        errors.push('File size exceeds 50MB limit');
      }
      
      if (stats.size === 0) {
        errors.push('File is empty');
      }
      
      const allowedTypes = ['application/pdf', 'image/svg+xml', 'application/postscript'];
      if (!allowedTypes.includes(mimeType)) {
        errors.push('File type not supported');
      }
      
    } catch (error) {
      errors.push('File access error: ' + (error as Error).message);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getFileTypeFromMime(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'image/svg+xml': 'SVG',
      'application/postscript': 'EPS',
      'image/png': 'PNG',
      'image/jpeg': 'JPEG'
    };
    
    return typeMap[mimeType] || 'Unknown';
  }

  async getFilePreviewInfo(filePath: string, mimeType: string) {
    const metadata = await this.processFile(filePath, mimeType);
    const filename = path.basename(filePath);
    
    return {
      name: filename,
      type: this.getFileTypeFromMime(mimeType),
      size: this.formatFileSize(fs.statSync(filePath).size),
      dimensions: metadata.dimensions || 'Unknown',
      realDimensionsMM: metadata.realDimensionsMM || 'Unknown',
      thumbnail: await this.generateThumbnail(filePath, filename)
    };
  }
}

export const fileProcessingService = new FileProcessingService();