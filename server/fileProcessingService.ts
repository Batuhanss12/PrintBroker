import fs from 'fs';
import path from 'path';
// import sharp from 'sharp'; // Temporarily disabled
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface FileMetadata {
  dimensions?: string;
  realDimensionsMM?: string;
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
      metadata.processingNotes = `İşleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
    }

    return metadata;
  }

  private async processImage(filePath: string): Promise<FileMetadata> {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let dimensions = 'Unknown';
      let resolution = 72;
      let hasTransparency = false;
      let colorProfile = 'RGB';
      let realDimensionsMM = 'Unknown';

      // Process SVG files specifically for vector dimensions
      if (ext === '.svg') {
        const svgMetadata = await this.processSVG(filePath);
        return { ...svgMetadata, resolution, hasTransparency: true, colorProfile: 'RGB' };
      }

      // Try to extract image dimensions using imagemagick if available
      try {
        const { stdout } = await execAsync(`identify -ping -format "%wx%h %r %x %y %U" "${filePath}" 2>/dev/null`);
        const parts = stdout.trim().split(' ');
        if (parts.length >= 2) {
          dimensions = parts[0];
          colorProfile = parts[1] || 'RGB';
          
          // Extract resolution and calculate real dimensions
          if (parts.length >= 5) {
            const xRes = parseFloat(parts[2]);
            const yRes = parseFloat(parts[3]);
            const unit = parts[4];
            
            if (xRes && yRes && unit) {
              resolution = Math.round((xRes + yRes) / 2);
              const [width, height] = dimensions.split('x').map(Number);
              
              // Convert to millimeters
              let widthMM, heightMM;
              if (unit.toLowerCase().includes('inch') || unit === 'PixelsPerInch') {
                widthMM = (width / xRes) * 25.4;
                heightMM = (height / yRes) * 25.4;
              } else if (unit.toLowerCase().includes('cm') || unit === 'PixelsPerCentimeter') {
                widthMM = (width / xRes) * 10;
                heightMM = (height / yRes) * 10;
              }
              
              if (widthMM && heightMM) {
                realDimensionsMM = `${Math.round(widthMM * 100) / 100}x${Math.round(heightMM * 100) / 100}mm`;
              }
            }
          }
          
          // Check for transparency
          if (filePath.toLowerCase().endsWith('.png')) {
            hasTransparency = true;
          }
        }
      } catch {
        // Try exiftool as fallback
        try {
          const { stdout } = await execAsync(`exiftool -ImageWidth -ImageHeight -ColorSpace -XResolution -YResolution "${filePath}" 2>/dev/null`);
          const lines = stdout.split('\n');
          let width, height, xRes, yRes;
          
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
            if (line.includes('X Resolution')) {
              xRes = parseFloat(line.split(':')[1]?.trim() || '0');
            }
            if (line.includes('Y Resolution')) {
              yRes = parseFloat(line.split(':')[1]?.trim() || '0');
            }
          });
          
          if (width && height) {
            dimensions = `${width}x${height}`;
            
            if (xRes && yRes) {
              resolution = Math.round((xRes + yRes) / 2);
              const widthMM = (parseInt(width) / xRes) * 25.4;
              const heightMM = (parseInt(height) / yRes) * 25.4;
              realDimensionsMM = `${Math.round(widthMM * 100) / 100}x${Math.round(heightMM * 100) / 100}mm`;
            }
          }
        } catch {
          // Use file extension to guess format
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
        processingNotes: `Vector file: ${this.formatFileSize(stats.size)}, Format: ${ext.toUpperCase()}, Real size: ${realDimensionsMM}`
      };

      return metadata;
    } catch (error) {
      return {
        dimensions: 'Unknown',
        processingNotes: `Vector processing error: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
  }

  private async processSVG(filePath: string): Promise<FileMetadata> {
    try {
      const svgContent = fs.readFileSync(filePath, 'utf-8');
      
      // Extract dimensions from SVG
      let width = 0, height = 0, realDimensionsMM = 'Unknown';
      
      // Try to get width and height attributes
      const widthMatch = svgContent.match(/width\s*=\s*["']([^"']+)["']/i);
      const heightMatch = svgContent.match(/height\s*=\s*["']([^"']+)["']/i);
      
      if (widthMatch && heightMatch) {
        const widthStr = widthMatch[1];
        const heightStr = heightMatch[1];
        
        // Parse dimensions with units
        const parseSize = (sizeStr: string) => {
          const match = sizeStr.match(/^([0-9.]+)\s*(mm|cm|in|pt|px)?$/i);
          if (match) {
            const value = parseFloat(match[1]);
            const unit = (match[2] || 'px').toLowerCase();
            
            // Convert to millimeters
            switch (unit) {
              case 'mm': return value;
              case 'cm': return value * 10;
              case 'in': return value * 25.4;
              case 'pt': return value * 0.352778;
              case 'px': return value * 0.264583; // Assuming 96 DPI
              default: return value * 0.264583;
            }
          }
          return parseFloat(sizeStr) * 0.264583; // Default to px
        };
        
        const widthMM = parseSize(widthStr);
        const heightMM = parseSize(heightStr);
        
        width = Math.round(widthMM / 0.264583); // Convert back to pixels for dimensions
        height = Math.round(heightMM / 0.264583);
        realDimensionsMM = `${Math.round(widthMM * 100) / 100}x${Math.round(heightMM * 100) / 100}mm`;
      }
      
      // Try viewBox if width/height not found
      if (!width || !height) {
        const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']([^"']+)["']/i);
        if (viewBoxMatch) {
          const viewBox = viewBoxMatch[1].split(/\s+/);
          if (viewBox.length >= 4) {
            width = parseInt(viewBox[2]);
            height = parseInt(viewBox[3]);
          }
        }
      }

      return {
        dimensions: width && height ? `${width}x${height}` : 'Unknown',
        realDimensionsMM,
        pageCount: 1,
        hasTransparency: true,
        colorProfile: 'RGB',
        processingNotes: `SVG vektör dosyası, Gerçek boyut: ${realDimensionsMM}`
      };
    } catch (error) {
      return {
        dimensions: 'Unknown',
        realDimensionsMM: 'Unknown',
        processingNotes: `SVG işleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
  }

  private async processPDF(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};

    try {
      // PDF page count and dimensions using pdfinfo
      const { stdout } = await execAsync(`pdfinfo "${filePath}"`);
      const lines = stdout.split('\n');
      
      let pageCount = 1;
      let realDimensionsMM = 'Unknown';
      
      lines.forEach(line => {
        if (line.includes('Pages:')) {
          const pageMatch = line.match(/Pages:\s+(\d+)/);
          pageCount = pageMatch ? parseInt(pageMatch[1]) : 1;
        }
        
        if (line.includes('Page size:')) {
          // Extract page size in points and convert to mm
          const sizeMatch = line.match(/Page size:\s+([0-9.]+)\s+x\s+([0-9.]+)\s+pts/);
          if (sizeMatch) {
            const widthPts = parseFloat(sizeMatch[1]);
            const heightPts = parseFloat(sizeMatch[2]);
            
            // Convert points to millimeters (1 point = 0.352778 mm)
            const widthMM = Math.round(widthPts * 0.352778 * 100) / 100;
            const heightMM = Math.round(heightPts * 0.352778 * 100) / 100;
            
            realDimensionsMM = `${widthMM}x${heightMM}mm`;
            metadata.dimensions = `${Math.round(widthPts)}x${Math.round(heightPts)}pts`;
          }
        }
      });

      metadata.pageCount = pageCount;
      metadata.realDimensionsMM = realDimensionsMM;
      metadata.colorProfile = 'CMYK';
      metadata.processingNotes = `PDF vektör dosyası, ${pageCount} sayfa, Gerçek boyut: ${realDimensionsMM}`;

      // Generate PDF thumbnail (first page)
      await this.generatePDFThumbnail(filePath, path.basename(filePath));
    } catch (error) {
      metadata.pageCount = 1;
      metadata.realDimensionsMM = 'Unknown';
      metadata.processingNotes = 'PDF boyut analizi tamamlanamadı';
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