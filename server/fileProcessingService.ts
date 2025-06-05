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

      // Enhanced dimension detection with content analysis
      const fileSizeKB = buffer.length / 1024;
      console.log(`📊 File analysis: ${fileSizeKB.toFixed(1)}KB`);

      // Method 1: Extract dimensions from filename
      const filename = path.basename(filePath);
      const filenameMatch = filename.match(/(\d+)x(\d+)/i);
      if (filenameMatch) {
        const width = parseInt(filenameMatch[1]);
        const height = parseInt(filenameMatch[2]);
        if (width > 0 && height > 0 && width < 1000 && height < 1000) {
          metadata.realDimensionsMM = `${width}x${height}mm`;
          metadata.processingNotes = `Dosya adından boyut tespit edildi: ${width}×${height}mm`;
          metadata.processingStatus = 'processed';
          console.log(`📏 Filename dimensions: ${width}×${height}mm`);
          return metadata;
        }
      }

      // Method 2: Content-based analysis
      const contentText = buffer.toString('latin1');

      // Search for dimension patterns in content
      const dimensionPatterns = [
        /\/MediaBox\s*\[\s*[\d\.\-]+\s+[\d\.\-]+\s+([\d\.]+)\s+([\d\.]+)\s*\]/i,
        /\/CropBox\s*\[\s*[\d\.\-]+\s+[\d\.\-]+\s+([\d\.]+)\s+([\d\.]+)\s*\]/i,
        /width["\s]*[:=]\s*["']?(\d+(?:\.\d+)?)/i,
        /height["\s]*[:=]\s*["']?(\d+(?:\.\d+)?)/i
      ];

      for (const pattern of dimensionPatterns) {
        const match = contentText.match(pattern);
        if (match) {
          const width = parseFloat(match[1]);
          const height = parseFloat(match[2] || match[1]);
          if (width > 0 && height > 0) {
            // Convert points to mm (1 point = 0.352778 mm)
            const widthMM = Math.round(width * 0.352778);
            const heightMM = Math.round(height * 0.352778);
            if (widthMM < 1000 && heightMM < 1000) {
              metadata.realDimensionsMM = `${widthMM}x${heightMM}mm`;
              metadata.processingNotes = `İçerik analizinden boyut tespit edildi: ${widthMM}×${heightMM}mm`;
              metadata.processingStatus = 'processed';
              console.log(`📏 Content analysis dimensions: ${widthMM}×${heightMM}mm`);
              return metadata;
            }
          }
        }
      }

      // Common page size detection with better defaults
      const commonSizes = [
        { name: 'Label 50x30', width: 50, height: 30, minSize: 0, maxSize: 100 },
        { name: 'Business Card', width: 85, height: 55, minSize: 100, maxSize: 300 },
        { name: 'Label 100x70', width: 100, height: 70, minSize: 300, maxSize: 600 },
        { name: 'A5', width: 148, height: 210, minSize: 600, maxSize: 1200 },
        { name: 'A4', width: 210, height: 297, minSize: 1200, maxSize: 5000 },
        { name: 'A3', width: 297, height: 420, minSize: 5000, maxSize: Infinity }
      ];

      let defaultSize = commonSizes.find(s => fileSizeKB >= s.minSize && fileSizeKB < s.maxSize);

      if (!defaultSize) {
        defaultSize = commonSizes.find(s => s.name === 'Label 50x30');
      }

      if (defaultSize) {
        metadata.realDimensionsMM = `${defaultSize.width}x${defaultSize.height}mm`;
        metadata.processingNotes = `PDF size estimated as ${defaultSize.name} (${fileSizeKB.toFixed(0)}KB): ${defaultSize.width}×${defaultSize.height}mm`;
        console.log(`📏 PDF size estimated: ${defaultSize.name} based on file size`);
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

  // Professional design content extraction and analysis
  async extractRealDesignContent(filePath: string, mimeType: string): Promise<{
    actualDimensions: { width: number; height: number };
    contentBounds: { x: number; y: number; width: number; height: number };
    hasText: boolean;
    hasImages: boolean;
    hasVectorPaths: boolean;
    colorCount: number;
    complexity: 'simple' | 'medium' | 'complex';
    printQuality: 'low' | 'medium' | 'high';
    recommendedProcessing: string;
  }> {
    try {
      console.log(`🔍 Analyzing real design content: ${filePath}`);

      if (mimeType === 'application/pdf') {
        return await this.analyzePDFDesignContent(filePath);
      } else if (mimeType === 'image/svg+xml') {
        return await this.analyzeSVGDesignContent(filePath);
      } else if (mimeType.includes('postscript') || mimeType.includes('eps')) {
        return await this.analyzeEPSDesignContent(filePath);
      } else {
        return await this.analyzeImageDesignContent(filePath);
      }
    } catch (error) {
      console.error('❌ Design content analysis failed:', error);
      return {
        actualDimensions: { width: 50, height: 30 },
        contentBounds: { x: 0, y: 0, width: 50, height: 30 },
        hasText: false,
        hasImages: false,
        hasVectorPaths: false,
        colorCount: 1,
        complexity: 'simple',
        printQuality: 'low',
        recommendedProcessing: 'Basic processing due to analysis error'
      };
    }
  }

  private async analyzePDFDesignContent(filePath: string) {
    try {
      // Use pdfinfo and pdftk for detailed analysis
      const analysis = {
        actualDimensions: { width: 50, height: 30 },
        contentBounds: { x: 0, y: 0, width: 50, height: 30 },
        hasText: false,
        hasImages: false,
        hasVectorPaths: false,
        colorCount: 1,
        complexity: 'simple' as const,
        printQuality: 'medium' as const,
        recommendedProcessing: 'Vector PDF processing'
      };

      // Try pdfinfo for detailed page analysis
      try {
        const { stdout: pdfInfo } = await execAsync(`pdfinfo "${filePath}"`);
        console.log('📋 PDF Info:', pdfInfo);

        // Extract page dimensions
        const sizeMatch = pdfInfo.match(/Page size:\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*pts/);
        if (sizeMatch) {
          const widthPt = parseFloat(sizeMatch[1]);
          const heightPt = parseFloat(sizeMatch[2]);
          analysis.actualDimensions = {
            width: Math.round(widthPt * 0.352778),
            height: Math.round(heightPt * 0.352778)
          };
        }
      } catch (e) {
        console.log('📋 pdfinfo not available, using binary analysis');
      }

      // Analyze PDF content structure
      const buffer = fs.readFileSync(filePath);
      const content = buffer.toString('binary');

      // Check for text content
      analysis.hasText = content.includes('/Font') || content.includes('Tf') || content.includes('Tj');

      // Check for images
      analysis.hasImages = content.includes('/Image') || content.includes('/XObject') || content.includes('JFIF');

      // Check for vector paths
      analysis.hasVectorPaths = content.includes(' re ') || content.includes(' l ') || content.includes(' c ') || content.includes(' m ');

      // Estimate complexity
      const streamCount = (content.match(/stream/g) || []).length;
      const objectCount = (content.match(/obj/g) || []).length;

      if (streamCount > 10 && objectCount > 20) {
        analysis.complexity = 'complex';
        analysis.printQuality = 'high';
      } else if (streamCount > 3 && objectCount > 5) {
        analysis.complexity = 'medium';
        analysis.printQuality = 'medium';
      }

      // Estimate content bounds (simplified)
      analysis.contentBounds = {
        x: 0,
        y: 0,
        width: analysis.actualDimensions.width,
        height: analysis.actualDimensions.height
      };

      console.log(`✅ PDF Analysis Complete:`, analysis);
      return analysis;

    } catch (error) {
      console.error('PDF analysis error:', error);
      throw error;
    }
  }

  private async analyzeSVGDesignContent(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const analysis = {
        actualDimensions: { width: 50, height: 30 },
        contentBounds: { x: 0, y: 0, width: 50, height: 30 },
        hasText: content.includes('<text') || content.includes('<tspan'),
        hasImages: content.includes('<image') || content.includes('data:image'),
        hasVectorPaths: content.includes('<path') || content.includes('<polygon') || content.includes('<circle') || content.includes('<rect'),
        colorCount: (content.match(/fill="[^"]*"/g) || []).length,
        complexity: 'medium' as const,
        printQuality: 'high' as const,
        recommendedProcessing: 'SVG to high-quality PDF conversion'
      };

      // Extract SVG dimensions
      const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
      const widthMatch = content.match(/width="([^"]+)"/);
      const heightMatch = content.match(/height="([^"]+)"/);

      if (viewBoxMatch) {
        const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
        if (viewBox.length >= 4) {
          analysis.actualDimensions = {
            width: Math.round(viewBox[2] * 0.352778),
            height: Math.round(viewBox[3] * 0.352778)
          };
        }
      } else if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1].replace(/[^0-9.]/g, ''));
        const height = parseFloat(heightMatch[1].replace(/[^0-9.]/g, ''));
        analysis.actualDimensions = {
          width: Math.round(width * 0.352778),
          height: Math.round(height * 0.352778)
        };
      }

      // Complexity analysis
      const pathCount = (content.match(/<path/g) || []).length;
      const shapeCount = (content.match(/<(circle|rect|polygon|ellipse)/g) || []).length;

      if (pathCount > 10 || shapeCount > 15) {
        analysis.complexity = 'complex';
      } else if (pathCount > 3 || shapeCount > 5) {
        analysis.complexity = 'medium';
      } else {
        analysis.complexity = 'simple';
      }

      analysis.contentBounds = {
        x: 0,
        y: 0,
        width: analysis.actualDimensions.width,
        height: analysis.actualDimensions.height
      };

      console.log(`✅ SVG Analysis Complete:`, analysis);
      return analysis;

    } catch (error) {
      console.error('SVG analysis error:', error);
      throw error;
    }
  }

  private async analyzeEPSDesignContent(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);

      const analysis = {
        actualDimensions: { width: 85, height: 55 },
        contentBounds: { x: 0, y: 0, width: 85, height: 55 },
        hasText: content.includes('show') || content.includes('Tf'),
        hasImages: content.includes('colorimage') || content.includes('image'),
        hasVectorPaths: content.includes('moveto') || content.includes('lineto') || content.includes('curveto'),
        colorCount: (content.match(/setrgbcolor/g) || []).length,
        complexity: 'medium' as const,
        printQuality: 'high' as const,
        recommendedProcessing: 'Ghostscript EPS processing with vector preservation'
      };

      // Extract BoundingBox
      const boundingBoxMatch = content.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (boundingBoxMatch) {
        const x1 = parseInt(boundingBoxMatch[1]);
        const y1 = parseInt(boundingBoxMatch[2]);
        const x2 = parseInt(boundingBoxMatch[3]);
        const y2 = parseInt(boundingBoxMatch[4]);

        analysis.actualDimensions = {
          width: Math.round((x2 - x1) * 0.352778),
          height: Math.round((y2 - y1) * 0.352778)
        };
        analysis.contentBounds = {
          x: Math.round(x1 * 0.352778),
          y: Math.round(y1 * 0.352778),
          width: analysis.actualDimensions.width,
          height: analysis.actualDimensions.height
        };
      }

      // Complexity based on file size and content
      const fileSizeKB = stats.size / 1024;
      if (fileSizeKB > 500) {
        analysis.complexity = 'complex';
      } else if (fileSizeKB > 100) {
        analysis.complexity = 'medium';
      } else {
        analysis.complexity = 'simple';
      }

      console.log(`✅ EPS Analysis Complete:`, analysis);
      return analysis;

    } catch (error) {
      console.error('EPS analysis error:', error);
      throw error;
    }
  }

  private async analyzeImageDesignContent(filePath: string) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      const analysis = {
        actualDimensions: {
          width: Math.round((metadata.width || 200) / (metadata.density || 300) * 25.4),
          height: Math.round((metadata.height || 200) / (metadata.density || 300) * 25.4)
        },
        contentBounds: { x: 0, y: 0, width: 0, height: 0 },
        hasText: false, // Would need OCR to detect
        hasImages: true,
        hasVectorPaths: false,
        colorCount: 0,
        complexity: 'simple' as const,
        printQuality: (metadata.density || 72) >= 300 ? 'high' as const : 'medium' as const,
        recommendedProcessing:```text
 'High-resolution raster processing'
      };

      analysis.contentBounds = {
        x: 0,
        y: 0,
        width: analysis.actualDimensions.width,
        height: analysis.actualDimensions.height
      };

      // Complexity based on size and channels
      if ((metadata.width || 0) > 2000 && (metadata.height || 0) > 2000) {
        analysis.complexity = 'complex';
      } else if ((metadata.width || 0) > 1000 && (metadata.height || 0) > 1000) {
        analysis.complexity = 'medium';
      }

      console.log(`✅ Image Analysis Complete:`, analysis);
      return analysis;

    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
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

async processDesignFile(filePath: string): Promise<{
    success: boolean;
    metadata?: any;
    error?: string;
  }> {
    try {
      console.log(`🔍 Processing design file: ${filePath}`);
      const buffer = await fs.readFile(filePath);
      const fileStats = await fs.stat(filePath);

      const metadata = {
        filename: path.basename(filePath),
        fileSize: this.formatFileSize(fileStats.size),
        fileSizeBytes: fileStats.size,
        uploadedAt: new Date().toISOString(),
        type: this.getFileType(filePath),
        processingStatus: 'processing',
        processingNotes: 'Gelişmiş dosya analizi yapılıyor...'
      };

async processDesignFile(filePath: string): Promise<{
    success: boolean;
    metadata?: any;
    error?: string;
  }> {
    try {
      console.log(`🔍 Processing design file: ${filePath}`);
      const buffer = await fs.readFile(filePath);
      const fileStats = await fs.stat(filePath);

      const metadata = {
        filename: path.basename(filePath),
        fileSize: this.formatFileSize(fileStats.size),
        fileSizeBytes: fileStats.size,
        uploadedAt: new Date().toISOString(),
        type: this.getFileType(filePath),
        processingStatus: 'processing',
        processingNotes: 'Gelişmiş dosya analizi yapılıyor...'
      };

}

export const fileProcessingService = new FileProcessingService();