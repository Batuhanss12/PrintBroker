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
      metadata.processingNotes = `İşleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
    }

    return metadata;
  }

  private async processImage(filePath: string): Promise<FileMetadata> {
    try {
      const stats = fs.statSync(filePath);
      let dimensions = 'Unknown';
      let resolution = 72;
      let hasTransparency = false;
      let colorProfile = 'RGB';
      let realDimensionsMM = 'Unknown';

      // Process vector files (SVG, AI, EPS) for real dimensions
      if (filePath.toLowerCase().endsWith('.svg')) {
        try {
          const svgContent = fs.readFileSync(filePath, 'utf8');
          const { realWidth, realHeight } = this.extractSVGDimensions(svgContent);
          if (realWidth && realHeight) {
            realDimensionsMM = `${realWidth}x${realHeight}mm`;
            dimensions = `${Math.round(realWidth * 2.83)}x${Math.round(realHeight * 2.83)}px`; // Convert mm to px at 72dpi
          }
        } catch (error) {
          console.warn('SVG dimension extraction failed:', error);
        }
      }

      // Try to extract image dimensions using imagemagick if available
      try {
        const { stdout } = await execAsync(`identify -ping -format "%wx%h %r" "${filePath}" 2>/dev/null`);
        const parts = stdout.trim().split(' ');
        if (parts.length >= 2) {
          dimensions = parts[0];
          colorProfile = parts[1] || 'RGB';
          
          // Check for transparency
          if (filePath.toLowerCase().endsWith('.png') || filePath.toLowerCase().endsWith('.svg')) {
            hasTransparency = true;
          }
        }
      } catch {
        // Try exiftool as fallback
        try {
          const { stdout } = await execAsync(`exiftool -ImageWidth -ImageHeight -ColorSpace "${filePath}" 2>/dev/null`);
          const lines = stdout.split('\n');
          let width, height;
          
          lines.forEach(line => {
            if (line.includes('Image Width')) {
              width = line.split(':')[1]?.trim();
            }
            if (line.includes('Image Height')) {
              height = line.split(':')[1]?.trim();
            }
            if (line.includes('Color Space')) {
              colorProfile = line.split(':')[1]?.trim() || 'RGB';
            }
          });
          
          if (width && height) {
            dimensions = `${width}x${height}`;
          }
        } catch {
          // Use file extension to guess format
          const ext = path.extname(filePath).toLowerCase();
          if (ext === '.png') {
            hasTransparency = true;
          }
          if (ext === '.jpg' || ext === '.jpeg') {
            colorProfile = 'YCbCr';
          }
        }
      }

      const metadata: FileMetadata = {
        dimensions,
        resolution,
        hasTransparency,
        colorProfile,
        pageCount: 1,
        realDimensionsMM,
        processingNotes: `Image file: ${this.formatFileSize(stats.size)}, Format: ${path.extname(filePath).toUpperCase()}`
      };

      return metadata;
    } catch (error) {
      return {
        dimensions: 'Unknown',
        processingNotes: `Image processing error: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
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
    try {
      const ext = path.extname(filename).toLowerCase();
      const thumbnailFilename = `thumb_${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}.jpg`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
      
      // Try imagemagick for thumbnail generation
      try {
        await execAsync(`convert "${filePath}" -thumbnail 200x200 -quality 85 "${thumbnailPath}" 2>/dev/null`);
        if (fs.existsSync(thumbnailPath)) {
          return `/uploads/thumbnails/${thumbnailFilename}`;
        }
      } catch (convertError) {
        console.log('ImageMagick not available, using original file');
      }

      // For SVG files, try to create a preview
      if (ext === '.svg') {
        try {
          await execAsync(`rsvg-convert -w 200 -h 200 "${filePath}" -o "${thumbnailPath}" 2>/dev/null`);
          if (fs.existsSync(thumbnailPath)) {
            return `/uploads/thumbnails/${thumbnailFilename}`;
          }
        } catch (svgError) {
          console.log('SVG conversion not available');
        }
      }

      // Fallback: return original file path for direct display
      const relativePath = path.relative(this.uploadDir, filePath);
      return `/uploads/${relativePath}`;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      const relativePath = path.relative(this.uploadDir, filePath);
      return `/uploads/${relativePath}`;
    }
  }

  async generatePDFThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      // For now, return original file path as thumbnail - in production use pdf2pic or similar
      return path.relative(this.uploadDir, filePath);
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
        // Basic file validation without sharp
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          errors.push('Boş görsel dosyası');
        }
        
        // Basic file size check (max 50MB)
        if (stats.size > 50 * 1024 * 1024) {
          errors.push('Dosya boyutu çok büyük (maksimum 50MB)');
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

  private extractSVGDimensions(svgContent: string): { realWidth: number | null, realHeight: number | null } {
    try {
      // Extract width and height from SVG attributes
      const widthMatch = svgContent.match(/width\s*=\s*["']([^"']+)["']/i);
      const heightMatch = svgContent.match(/height\s*=\s*["']([^"']+)["']/i);
      
      let realWidth: number | null = null;
      let realHeight: number | null = null;
      
      if (widthMatch) {
        const widthStr = widthMatch[1];
        if (widthStr.includes('mm')) {
          realWidth = parseFloat(widthStr.replace('mm', ''));
        } else if (widthStr.includes('cm')) {
          realWidth = parseFloat(widthStr.replace('cm', '')) * 10;
        } else if (widthStr.includes('in')) {
          realWidth = parseFloat(widthStr.replace('in', '')) * 25.4;
        } else if (widthStr.includes('pt')) {
          realWidth = parseFloat(widthStr.replace('pt', '')) * 0.352778;
        } else {
          // Assume pixels, convert using 72 DPI
          realWidth = parseFloat(widthStr) * 0.352778;
        }
      }
      
      if (heightMatch) {
        const heightStr = heightMatch[1];
        if (heightStr.includes('mm')) {
          realHeight = parseFloat(heightStr.replace('mm', ''));
        } else if (heightStr.includes('cm')) {
          realHeight = parseFloat(heightStr.replace('cm', '')) * 10;
        } else if (heightStr.includes('in')) {
          realHeight = parseFloat(heightStr.replace('in', '')) * 25.4;
        } else if (heightStr.includes('pt')) {
          realHeight = parseFloat(heightStr.replace('pt', '')) * 0.352778;
        } else {
          // Assume pixels, convert using 72 DPI
          realHeight = parseFloat(heightStr) * 0.352778;
        }
      }
      
      // Try viewBox if dimensions not found
      if (!realWidth || !realHeight) {
        const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/i);
        if (viewBoxMatch) {
          const viewBoxValues = viewBoxMatch[1].split(/\s+/);
          if (viewBoxValues.length >= 4) {
            const vbWidth = parseFloat(viewBoxValues[2]);
            const vbHeight = parseFloat(viewBoxValues[3]);
            if (!realWidth) realWidth = vbWidth * 0.352778; // Convert assuming 72 DPI
            if (!realHeight) realHeight = vbHeight * 0.352778;
          }
        }
      }
      
      return { realWidth, realHeight };
    } catch (error) {
      console.warn('SVG dimension extraction error:', error);
      return { realWidth: null, realHeight: null };
    }
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