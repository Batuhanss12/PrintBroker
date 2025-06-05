
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
      console.log(`🔍 Professional file processing: ${filePath} (${mimeType})`);

      // Content integrity check
      const isValid = await this.verifyContentIntegrity(filePath, mimeType);
      if (!isValid) {
        return {
          contentPreserved: false,
          processingNotes: 'File integrity check failed'
        };
      }

      // Process by file type
      switch (mimeType) {
        case 'application/pdf':
          return await this.processPDFAdvanced(filePath);
        case 'image/svg+xml':
          return await this.processSVGAdvanced(filePath);
        case 'application/postscript':
        case 'application/eps':
        case 'image/eps':
          return await this.processEPSAdvanced(filePath);
        default:
          if (mimeType.startsWith('image/')) {
            return await this.processImageAdvanced(filePath);
          }
          return await this.processGenericFile(filePath);
      }
    } catch (error) {
      console.error('❌ File processing error:', error);
      return {
        contentPreserved: false,
        processingNotes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async verifyContentIntegrity(filePath: string, mimeType: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile() || stats.size === 0) {
        console.log('❌ File integrity: Invalid file or zero size');
        return false;
      }

      const buffer = fs.readFileSync(filePath, { encoding: null });
      
      // File signature checks
      switch (mimeType) {
        case 'application/pdf':
          const isPdf = buffer.subarray(0, 4).toString('ascii') === '%PDF';
          console.log(`📄 PDF integrity check: ${isPdf}`);
          return isPdf;
          
        case 'image/svg+xml':
          const svgContent = buffer.toString('utf8', 0, 200);
          const isSvg = svgContent.includes('<svg') || svgContent.includes('<?xml');
          console.log(`🎨 SVG integrity check: ${isSvg}`);
          return isSvg;
          
        case 'application/postscript':
        case 'application/eps':
        case 'image/eps':
          // More flexible EPS/AI detection
          const epsContent = buffer.toString('ascii', 0, 100);
          const isEps = epsContent.includes('%!PS-Adobe') || 
                       epsContent.includes('%!') || 
                       epsContent.includes('Adobe Illustrator') ||
                       epsContent.includes('%%Creator: Adobe');
          console.log(`✏️ EPS/AI integrity check: ${isEps}, first 100 chars: "${epsContent.substring(0, 50)}..."`);
          
          // Even if header check fails, allow if file size is reasonable
          if (!isEps && stats.size > 1024) {
            console.log('📝 EPS header not found but file size suggests valid content, allowing...');
            return true;
          }
          return isEps;
          
        default:
          console.log(`🔧 Unknown type ${mimeType}, allowing by default`);
          return true;
      }
    } catch (error) {
      console.error('Content integrity check failed:', error);
      return false;
    }
  }

  private async processPDFAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      dimensions: 'Vector Document',
      pageCount: 1,
      colorProfile: 'CMYK',
      contentPreserved: true
    };

    try {
      // Method 1: Try pdfinfo if available
      try {
        const { stdout } = await execAsync(`pdfinfo "${filePath}" 2>/dev/null`);
        const lines = stdout.split('\n');
        
        for (const line of lines) {
          if (line.includes('Pages:')) {
            metadata.pageCount = parseInt(line.split(':')[1].trim()) || 1;
          }
          if (line.includes('Page size:')) {
            const sizeMatch = line.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*pts/);
            if (sizeMatch) {
              const widthPt = parseFloat(sizeMatch[1]);
              const heightPt = parseFloat(sizeMatch[2]);
              const widthMM = Math.round(widthPt * 0.352778);
              const heightMM = Math.round(heightPt * 0.352778);
              metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
              metadata.processingNotes = `PDF analyzed with pdfinfo: ${widthMM}×${heightMM}mm`;
              console.log(`✅ PDF dimensions detected: ${widthMM}×${heightMM}mm`);
              return metadata;
            }
          }
        }
      } catch (pdfInfoError) {
        console.log('📋 pdfinfo not available, using binary analysis...');
      }

      // Method 2: Binary PDF analysis
      const buffer = fs.readFileSync(filePath);
      const content = buffer.toString('binary');
      
      // Look for MediaBox
      const mediaBoxMatches = content.match(/\/MediaBox\s*\[\s*([^\]]+)\]/g);
      if (mediaBoxMatches && mediaBoxMatches.length > 0) {
        for (const match of mediaBoxMatches) {
          const coords = match.match(/\[\s*([\d\.\s]+)\]/);
          if (coords) {
            const numbers = coords[1].split(/\s+/).map(Number).filter(n => !isNaN(n));
            if (numbers.length >= 4) {
              const widthPt = numbers[2] - numbers[0];
              const heightPt = numbers[3] - numbers[1];
              
              if (widthPt > 0 && heightPt > 0) {
                const widthMM = Math.round(widthPt * 0.352778);
                const heightMM = Math.round(heightPt * 0.352778);
                metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
                metadata.processingNotes = `PDF analyzed via MediaBox: ${widthMM}×${heightMM}mm`;
                console.log(`✅ PDF dimensions from MediaBox: ${widthMM}×${heightMM}mm`);
                return metadata;
              }
            }
          }
        }
      }

      // Method 3: Common page size detection
      const commonSizes = [
        { name: 'A4', width: 210, height: 297 },
        { name: 'A3', width: 297, height: 420 },
        { name: 'A5', width: 148, height: 210 },
        { name: 'Letter', width: 216, height: 279 },
        { name: 'Label 50x30', width: 50, height: 30 },
        { name: 'Label 70x50', width: 70, height: 50 },
        { name: 'Business Card', width: 85, height: 55 }
      ];

      // If no size detected, use default based on file size
      const fileSizeKB = buffer.length / 1024;
      let defaultSize;
      
      if (fileSizeKB < 100) {
        defaultSize = commonSizes.find(s => s.name === 'Label 50x30');
      } else if (fileSizeKB < 500) {
        defaultSize = commonSizes.find(s => s.name === 'Business Card');
      } else {
        defaultSize = commonSizes.find(s => s.name === 'A4');
      }

      if (defaultSize) {
        metadata.realDimensionsMM = `${defaultSize.width}x${defaultSize.height}mm`;
        metadata.processingNotes = `PDF size estimated as ${defaultSize.name}: ${defaultSize.width}×${defaultSize.height}mm`;
        console.log(`📏 PDF size estimated: ${defaultSize.name}`);
      }

    } catch (error) {
      console.error('PDF analysis error:', error);
      metadata.realDimensionsMM = '50x30mm';
      metadata.processingNotes = 'PDF processing with fallback dimensions';
    }

    return metadata;
  }

  private async processSVGAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      colorProfile: 'RGB',
      contentPreserved: true
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract dimensions from SVG
      const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
      const widthMatch = content.match(/width="([^"]+)"/);
      const heightMatch = content.match(/height="([^"]+)"/);
      
      if (viewBoxMatch) {
        const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
        if (viewBox.length >= 4) {
          const width = viewBox[2];
          const height = viewBox[3];
          metadata.realDimensionsMM = `${Math.round(width * 0.352778)}x${Math.round(height * 0.352778)}mm`;
          metadata.dimensions = `${width}x${height}px`;
        }
      } else if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1].replace(/[^0-9.]/g, ''));
        const height = parseFloat(heightMatch[1].replace(/[^0-9.]/g, ''));
        
        if (width && height) {
          metadata.dimensions = `${width}x${height}`;
          // Assume SVG units are in pixels, convert to mm
          metadata.realDimensionsMM = `${Math.round(width * 0.352778)}x${Math.round(height * 0.352778)}mm`;
        }
      }

      metadata.processingNotes = `SVG processed: ${metadata.realDimensionsMM || 'dimensions detected'}`;
      
    } catch (error) {
      console.error('SVG processing error:', error);
      metadata.contentPreserved = false;
      metadata.realDimensionsMM = '50x30mm';
    }

    return metadata;
  }

  private async processEPSAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      colorProfile: 'CMYK',
      contentPreserved: true
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      const fileSizeKB = stats.size / 1024;
      
      // Look for BoundingBox in EPS
      const boundingBoxMatch = content.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (boundingBoxMatch) {
        const x1 = parseInt(boundingBoxMatch[1]);
        const y1 = parseInt(boundingBoxMatch[2]);
        const x2 = parseInt(boundingBoxMatch[3]);
        const y2 = parseInt(boundingBoxMatch[4]);
        
        const widthPt = x2 - x1;
        const heightPt = y2 - y1;
        const widthMM = Math.round(widthPt * 0.352778);
        const heightMM = Math.round(heightPt * 0.352778);
        
        metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
        metadata.dimensions = `${widthPt}x${heightPt}pt`;
        console.log(`✅ EPS dimensions detected: ${widthMM}×${heightMM}mm`);
      } else {
        // Intelligent size estimation based on file size and content
        let estimatedSize;
        
        if (fileSizeKB < 100) {
          estimatedSize = { width: 50, height: 30 }; // Business card size
        } else if (fileSizeKB < 500) {
          estimatedSize = { width: 85, height: 55 }; // Label size
        } else if (fileSizeKB < 2000) {
          estimatedSize = { width: 210, height: 297 }; // A4 size
        } else {
          estimatedSize = { width: 297, height: 420 }; // A3 size
        }
        
        metadata.realDimensionsMM = `${estimatedSize.width}x${estimatedSize.height}mm`;
        console.log(`📏 EPS size estimated based on file size (${fileSizeKB.toFixed(0)}KB): ${estimatedSize.width}×${estimatedSize.height}mm`);
      }

      metadata.processingNotes = `EPS/AI processed: ${metadata.realDimensionsMM}`;
      
    } catch (error) {
      console.error('EPS processing error:', error);
      metadata.realDimensionsMM = '85x55mm'; // Default business card size
      metadata.processingNotes = 'EPS processing with fallback dimensions';
    }

    return metadata;
  }

  private async processImageAdvanced(filePath: string): Promise<FileMetadata> {
    const metadata: FileMetadata = {};

    try {
      const image = sharp(filePath);
      const imageMetadata = await image.metadata();
      
      metadata.dimensions = `${imageMetadata.width}x${imageMetadata.height}px`;
      metadata.resolution = imageMetadata.density || 300;
      metadata.colorProfile = this.getColorSpace(imageMetadata.space);
      metadata.hasTransparency = imageMetadata.hasAlpha;
      metadata.contentPreserved = true;

      // Convert pixels to mm assuming 300 DPI
      if (imageMetadata.width && imageMetadata.height) {
        const dpi = metadata.resolution;
        const widthMM = Math.round((imageMetadata.width / dpi) * 25.4);
        const heightMM = Math.round((imageMetadata.height / dpi) * 25.4);
        metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
      }

      metadata.processingNotes = `Image processed: ${metadata.dimensions}, ${metadata.colorProfile}`;
      
    } catch (error) {
      console.error('Image processing error:', error);
      metadata.contentPreserved = false;
      metadata.realDimensionsMM = '50x30mm';
    }

    return metadata;
  }

  private async processGenericFile(filePath: string): Promise<FileMetadata> {
    return {
      processingNotes: 'Generic file processed',
      contentPreserved: true,
      realDimensionsMM: '50x30mm'
    };
  }

  private getColorSpace(space?: string): string {
    switch (space) {
      case 'srgb': return 'sRGB';
      case 'cmyk': return 'CMYK';
      case 'lab': return 'Lab';
      case 'gray': return 'Grayscale';
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
        .resize(200, 200, { 
          fit: 'inside', 
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 85 })
        .toFile(thumbnailPath);
      
      return `/uploads/thumbnails/${thumbnailName}`;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return '';
    }
  }

  async generatePDFThumbnail(filePath: string, filename: string): Promise<string> {
    try {
      // Try using ImageMagick if available
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      const thumbnailName = `${basename}_thumb.jpg`;
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailName);
      
      try {
        await execAsync(`convert "${filePath}[0]" -thumbnail 200x200 -background white -alpha remove "${thumbnailPath}"`);
        return `/uploads/thumbnails/${thumbnailName}`;
      } catch (magickError) {
        console.log('ImageMagick not available for PDF thumbnail');
        return '';
      }
    } catch (error) {
      console.error('PDF thumbnail generation failed:', error);
      return '';
    }
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
        'application/postscript',
        'application/eps',
        'image/eps'
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

  // Extract designs from PDF using advanced analysis
  async extractDesignsFromPDF(filePath: string): Promise<Array<{ width: number; height: number; page: number }>> {
    try {
      const metadata = await this.processPDFAdvanced(filePath);
      const designs = [];

      if (metadata.realDimensionsMM) {
        const dimensionMatch = metadata.realDimensionsMM.match(/(\d+)x(\d+)mm/);
        if (dimensionMatch) {
          designs.push({
            width: parseInt(dimensionMatch[1]),
            height: parseInt(dimensionMatch[2]),
            page: 1
          });
        }
      }

      return designs;
    } catch (error) {
      console.error('PDF design extraction error:', error);
      return [{ width: 50, height: 30, page: 1 }];
    }
  }

  // Advanced content verification for vector files
  async verifyVectorContent(filePath: string, mimeType: string): Promise<{
    hasVectorContent: boolean;
    contentQuality: 'high' | 'medium' | 'low';
    processingRecommendation: string;
  }> {
    try {
      const stats = fs.statSync(filePath);
      const fileSizeKB = stats.size / 1024;

      // Basic heuristics for content quality
      let contentQuality: 'high' | 'medium' | 'low' = 'medium';
      let processingRecommendation = 'Standard processing';

      if (mimeType === 'application/pdf') {
        // Check if PDF has vector content
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('binary');
        
        const hasStreamObjects = content.includes('/Type/XObject') || content.includes('/Subtype/Form');
        const hasVectorPaths = content.includes('re') || content.includes('l') || content.includes('c');
        const hasText = content.includes('/Font') || content.includes('Tf');

        if (hasStreamObjects && hasVectorPaths) {
          contentQuality = 'high';
          processingRecommendation = 'Direct vector embedding recommended';
        } else if (hasText || hasVectorPaths) {
          contentQuality = 'medium';
          processingRecommendation = 'Vector processing with quality preservation';
        } else {
          contentQuality = 'low';
          processingRecommendation = 'Raster fallback may be required';
        }

        return {
          hasVectorContent: hasStreamObjects || hasVectorPaths,
          contentQuality,
          processingRecommendation
        };
      }

      // For other vector formats
      if (mimeType === 'image/svg+xml') {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasComplexPaths = content.includes('<path') || content.includes('<polygon') || content.includes('<circle');
        const hasGradients = content.includes('<defs>') || content.includes('gradient');

        contentQuality = hasComplexPaths && hasGradients ? 'high' : hasComplexPaths ? 'medium' : 'low';
        processingRecommendation = contentQuality === 'high' ? 'SVG to PDF conversion' : 'Standard SVG processing';

        return {
          hasVectorContent: hasComplexPaths,
          contentQuality,
          processingRecommendation
        };
      }

      // For EPS/AI files
      if (mimeType.includes('postscript') || mimeType.includes('eps')) {
        const hasVectorContent = fileSizeKB > 10; // Basic size check
        contentQuality = fileSizeKB > 100 ? 'high' : fileSizeKB > 50 ? 'medium' : 'low';
        processingRecommendation = 'PostScript processing with Ghostscript';

        return {
          hasVectorContent,
          contentQuality,
          processingRecommendation
        };
      }

      return {
        hasVectorContent: false,
        contentQuality: 'low',
        processingRecommendation: 'Basic file processing'
      };

    } catch (error) {
      console.error('Vector content verification failed:', error);
      return {
        hasVectorContent: false,
        contentQuality: 'low',
        processingRecommendation: 'Error in content analysis'
      };
    }
  }

  // Enhanced file preparation for PDF embedding
  async prepareFileForEmbedding(filePath: string, mimeType: string): Promise<{
    success: boolean;
    processedPath?: string;
    contentAnalysis: any;
    processingNotes: string;
  }> {
    try {
      console.log(`🔧 Preparing file for embedding: ${filePath}`);

      // Verify vector content
      const contentAnalysis = await this.verifyVectorContent(filePath, mimeType);
      
      // Copy file to a processing path
      const ext = path.extname(filePath);
      const processedFileName = `processed_${Date.now()}${ext}`;
      const processedPath = path.join(this.uploadDir, processedFileName);

      fs.copyFileSync(filePath, processedPath);

      const result = {
        success: true,
        processedPath,
        contentAnalysis,
        processingNotes: `File prepared for embedding: ${contentAnalysis.processingRecommendation}`
      };

      console.log(`✅ File preparation completed:`, result.processingNotes);
      return result;

    } catch (error) {
      console.error('File preparation failed:', error);
      return {
        success: false,
        contentAnalysis: { hasVectorContent: false, contentQuality: 'low', processingRecommendation: 'Error' },
        processingNotes: `Preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const fileProcessingService = new FileProcessingService();
