import fs from 'fs';
import path from 'path';
// import sharp from 'sharp'; // Temporarily disabled
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface FileMetadata {
  dimensions?: string;
  colorProfile?: string;
  resolution?: number;
  hasTransparency?: boolean;
  pageCount?: number;
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
        const imageMetadata = await this.processImage(filePath);
        Object.assign(metadata, imageMetadata);
      } else if (mimeType === 'application/pdf') {
        const pdfMetadata = await this.processPDF(filePath);
        Object.assign(metadata, pdfMetadata);
      } else if (mimeType.startsWith('application/') && mimeType.includes('document')) {
        const docMetadata = await this.processDocument(filePath);
        Object.assign(metadata, docMetadata);
      }

      metadata.processingNotes = 'Dosya başarıyla işlendi';
    } catch (error) {
      metadata.processingNotes = `İşleme hatası: ${error.message}`;
    }

    return metadata;
  }

  private async processImage(filePath: string): Promise<FileMetadata> {
    const image = sharp(filePath);
    const imageMetadata = await image.metadata();

    const metadata: FileMetadata = {
      dimensions: `${imageMetadata.width}x${imageMetadata.height}`,
      resolution: imageMetadata.density || 72,
      hasTransparency: imageMetadata.hasAlpha || false,
      colorProfile: this.getColorSpace(imageMetadata.space),
      pageCount: 1
    };

    // Generate thumbnail
    await this.generateThumbnail(filePath, path.basename(filePath));

    return metadata;
  }

  private async processPDF(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};

    try {
      // PDF page count using pdftk or pdfinfo (if available)
      const { stdout } = await execAsync(`pdfinfo "${filePath}" | grep Pages`);
      const pageMatch = stdout.match(/Pages:\s+(\d+)/);
      metadata.pageCount = pageMatch ? parseInt(pageMatch[1]) : 1;

      // Generate PDF thumbnail (first page)
      await this.generatePDFThumbnail(filePath, path.basename(filePath));
    } catch (error) {
      metadata.pageCount = 1;
      metadata.processingNotes = 'PDF analizi tamamlanamadı';
    }

    return metadata;
  }

  private async processDocument(filePath: string): Promise<FileMetadata> {
    const stats = fs.statSync(filePath);
    return {
      pageCount: 1,
      processingNotes: `Doküman boyutu: ${this.formatFileSize(stats.size)}`
    };
  }

  private getColorSpace(space?: string): string {
    switch (space) {
      case 'srgb':
      case 'rgb':
        return 'RGB';
      case 'cmyk':
        return 'CMYK';
      case 'grey':
      case 'gray':
        return 'Grayscale';
      default:
        return 'RGB';
    }
  }

  async generateThumbnail(filePath: string, filename: string): Promise<string> {
    const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}.jpg`);
    
    try {
      await sharp(filePath)
        .resize(300, 300, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return path.relative(this.uploadDir, thumbnailPath);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return '';
    }
  }

  async generatePDFThumbnail(filePath: string, filename: string): Promise<string> {
    const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}.jpg`);
    
    try {
      // Using ImageMagick to convert first page of PDF to thumbnail
      await execAsync(`convert "${filePath}[0]" -resize 300x300 -quality 80 "${thumbnailPath}"`);
      return path.relative(this.uploadDir, thumbnailPath);
    } catch (error) {
      console.error('PDF thumbnail generation failed:', error);
      return '';
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async validateFile(filePath: string, mimeType: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const stats = fs.statSync(filePath);

    // File size validation (max 50MB)
    if (stats.size > 50 * 1024 * 1024) {
      errors.push('Dosya boyutu 50MB\'dan büyük olamaz');
    }

    // MIME type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/postscript',
      'application/x-indesign'
    ];

    if (!allowedTypes.includes(mimeType)) {
      errors.push('Desteklenmeyen dosya formatı');
    }

    // Image-specific validation
    if (mimeType.startsWith('image/')) {
      try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        
        if (!metadata.width || !metadata.height) {
          errors.push('Geçersiz görsel dosyası');
        }

        // Check for print-ready resolution
        if (metadata.density && metadata.density < 150) {
          errors.push('Baskı kalitesi için en az 150 DPI önerilir');
        }
      } catch (error) {
        errors.push('Görsel dosyası okunamadı');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getFileTypeFromMime(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.startsWith('application/') && mimeType.includes('document')) return 'document';
    if (mimeType.startsWith('text/')) return 'document';
    return 'other';
  }

  async getFilePreviewInfo(filePath: string, mimeType: string) {
    const stats = fs.statSync(filePath);
    const metadata = await this.processFile(filePath, mimeType);

    return {
      size: this.formatFileSize(stats.size),
      lastModified: stats.mtime,
      ...metadata
    };
  }
}

export const fileProcessingService = new FileProcessingService();