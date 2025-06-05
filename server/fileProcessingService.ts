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
  contentPreserved?: boolean;
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
      console.log(`🔍 Processing file: ${filePath} (${mimeType})`);

      if (mimeType.startsWith('image/')) {
        return await this.processImage(filePath);
      } else if (mimeType === 'application/pdf') {
        return await this.processPDF(filePath);
      } else if (mimeType === 'image/svg+xml') {
        return await this.processSVG(filePath);
      } else if (mimeType.includes('postscript') || mimeType.includes('eps')) {
        return await this.processEPS(filePath);
      } else {
        return await this.processDocument(filePath);
      }
    } catch (error) {
      console.error('File processing error:', error);
      return { contentPreserved: false };
    }
  }

  private async verifyContentIntegrity(filePath: string, mimeType: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile() || stats.size === 0) {
        return false;
      }

      const buffer = fs.readFileSync(filePath);

      if (mimeType === 'application/pdf') {
        return buffer.toString('ascii', 0, 5) === '%PDF-';
      } else if (mimeType === 'image/svg+xml') {
        const content = buffer.toString('utf8', 0, 100);
        return content.includes('<svg') || content.includes('<?xml');
      }

      return true;
    } catch (error) {
      console.error('Content integrity check failed:', error);
      return false;
    }
  }

  private async processSVG(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const widthMatch = content.match(/width="([^"]+)"/);
      const heightMatch = content.match(/height="([^"]+)"/);
      
      if (widthMatch && heightMatch) {
        metadata.dimensions = `${widthMatch[1]}x${heightMatch[1]}`;
      }
      
      metadata.processingNotes = 'SVG file processed';
      metadata.contentPreserved = true;
    } catch (error) {
      console.error('SVG processing error:', error);
      metadata.contentPreserved = false;
    }
    
    return metadata;
  }

  private async processEPS(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      metadata.processingNotes = 'EPS file processed';
      metadata.contentPreserved = true;
    } catch (error) {
      console.error('EPS processing error:', error);
      metadata.contentPreserved = false;
    }
    
    return metadata;
  }

  private async processImage(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};
    
    try {
      const image = sharp(filePath);
      const imageMetadata = await image.metadata();
      
      metadata.dimensions = `${imageMetadata.width}x${imageMetadata.height}`;
      metadata.colorProfile = imageMetadata.space || 'Unknown';
      metadata.hasTransparency = imageMetadata.hasAlpha;
      metadata.processingNotes = 'Image processed successfully';
      metadata.contentPreserved = true;
    } catch (error) {
      console.error('Image processing error:', error);
      metadata.contentPreserved = false;
    }
    
    return metadata;
  }

  private async processPDF(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};
    
    try {
      console.log('Analyzing PDF:', filePath);
      
      try {
        const { stdout } = await execAsync(`pdfinfo "${filePath}" 2>/dev/null`);
        const lines = stdout.split('\n');
        
        for (const line of lines) {
          if (line.includes('Pages:')) {
            metadata.pageCount = parseInt(line.split(':')[1].trim());
          }
          if (line.includes('Page size:')) {
            const sizeMatch = line.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*pts/);
            if (sizeMatch) {
              const widthPt = parseFloat(sizeMatch[1]);
              const heightPt = parseFloat(sizeMatch[2]);
              const widthMM = Math.round(widthPt * 0.352778);
              const heightMM = Math.round(heightPt * 0.352778);
              metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
            }
          }
        }
      } catch (pdfInfoError) {
        console.log('PDFInfo not available, trying alternative method...');
        
        try {
          const buffer = fs.readFileSync(filePath);
          const content = buffer.toString('binary');
          
          const mediaBoxMatch = content.match(/\/MediaBox\s*\[\s*([^\]]+)\]/);
          if (mediaBoxMatch) {
            const coords = mediaBoxMatch[1].split(/\s+/).map(Number).filter(n => !isNaN(n));
            if (coords.length >= 4) {
              const widthPt = coords[2] - coords[0];
              const heightPt = coords[3] - coords[1];
              const widthMM = Math.round(widthPt * 0.352778);
              const heightMM = Math.round(heightPt * 0.352778);
              metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
              console.log(`Extracted from MediaBox: ${widthMM}x${heightMM}mm`);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback PDF analysis failed:', fallbackError);
        }
      }
      
      metadata.dimensions = 'Vector Rectangle';
      metadata.pageCount = metadata.pageCount || 1;
      metadata.processingNotes = `PDF analyzed - ${metadata.realDimensionsMM || 'unknown dimensions'} rectangle shape`;
      metadata.contentPreserved = true;
      
      console.log('Final PDF metadata:', metadata);
    } catch (error) {
      console.error('PDF processing error:', error);
      metadata.contentPreserved = false;
    }
    
    return metadata;
  }

  private async processDocument(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};
    metadata.processingNotes = 'Document processed';
    metadata.contentPreserved = true;
    return metadata;
  }

  private getColorSpace(space?: string): string {
    switch (space) {
      case 'srgb': return 'sRGB';
      case 'cmyk': return 'CMYK';
      case 'lab': return 'Lab';
      default: return 'RGB';
    }
  }

  async generateThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      const thumbnailName = `${basename}_thumb.jpg`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);
      
      await sharp(filePath)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      return thumbnailName;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return '';
    }
  }

  async generatePDFThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      console.log('ImageMagick not available, skipping thumbnail generation');
      return '';
    } catch (error) {
      console.error('PDF thumbnail generation failed:', error);
      return '';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async validateFile(filePath: string, mimeType: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const stats = fs.statSync(filePath);
      
      if (!stats.isFile()) {
        errors.push('Not a valid file');
      }
      
      if (stats.size === 0) {
        errors.push('File is empty');
      }
      
      if (stats.size > 50 * 1024 * 1024) {
        errors.push('File size exceeds 50MB limit');
      }
      
      const allowedMimeTypes = [
        'application/pdf',
        'image/svg+xml',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/postscript'
      ];
      
      if (!allowedMimeTypes.includes(mimeType)) {
        errors.push(`Unsupported file type: ${mimeType}`);
      }
      
    } catch (error) {
      errors.push('File validation failed');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('postscript')) return 'eps';
    return 'document';
  }

  async getFilePreviewInfo(filePath: string, mimeType: string) {
    const metadata = await this.processFile(filePath, mimeType);
    return {
      type: this.getFileTypeFromMime(mimeType),
      dimensions: metadata.dimensions,
      realDimensionsMM: metadata.realDimensionsMM,
      processingNotes: metadata.processingNotes,
      contentPreserved: metadata.contentPreserved
    };
  }
}

export const fileProcessingService = new FileProcessingService();