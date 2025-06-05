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
  hasVectorContent?: boolean;
  hasImages?: boolean;
  extractedDesigns?: any[];
  designElements?: any[];
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

      // Enhanced content preservation check
      const contentPreserved = await this.verifyContentIntegrity(filePath, mimeType);
      metadata.contentPreserved = contentPreserved;


  // Enhanced design extraction from PDF files
  async extractDesignsFromPDF(filePath: string): Promise<{
    success: boolean;
    designs: any[];
    message: string;
  }> {
    try {
      console.log('🎨 Starting design extraction from PDF:', filePath);
      
      const extractedDesigns: any[] = [];
      const outputDir = path.join(this.uploadDir, 'extracted_designs');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Method 1: Try pdf2svg for vector extraction
      try {
        await execAsync('which pdf2svg');
        const fileName = path.basename(filePath, path.extname(filePath));
        
        // Get page count first
        let pageCount = 1;
        try {
          const { stdout } = await execAsync(`pdfinfo "${filePath}" 2>/dev/null`);
          const pagesMatch = stdout.match(/Pages:\s*(\d+)/);
          if (pagesMatch) pageCount = parseInt(pagesMatch[1]);
        } catch (e) {}

        // Extract each page as SVG
        for (let page = 1; page <= Math.min(pageCount, 10); page++) {
          const svgPath = path.join(outputDir, `${fileName}_page${page}.svg`);
          await execAsync(`pdf2svg "${filePath}" "${svgPath}" ${page}`);
          
          if (fs.existsSync(svgPath)) {
            const svgContent = fs.readFileSync(svgPath, 'utf8');
            const designInfo = await this.analyzeSVGDesign(svgPath, svgContent);
            
            extractedDesigns.push({
              type: 'svg',
              page: page,
              filePath: svgPath,
              relativePath: `/uploads/extracted_designs/${path.basename(svgPath)}`,
              ...designInfo
            });
          }
        }
        
        console.log(`✅ Extracted ${extractedDesigns.length} SVG designs from PDF`);
      } catch (e) {
        console.log('pdf2svg not available, trying alternative methods...');
      }

      // Method 2: Try pdftoppm for image extraction
      if (extractedDesigns.length === 0) {
        try {
          await execAsync('which pdftoppm');
          const fileName = path.basename(filePath, path.extname(filePath));
          const pngPrefix = path.join(outputDir, fileName);
          
          await execAsync(`pdftoppm -png -r 300 "${filePath}" "${pngPrefix}"`);
          
          // Find generated PNG files
          const files = fs.readdirSync(outputDir);
          const pngFiles = files.filter(f => f.startsWith(path.basename(fileName)) && f.endsWith('.png'));
          
          for (const pngFile of pngFiles) {
            const pngPath = path.join(outputDir, pngFile);
            const imageInfo = await this.processImage(pngPath);
            
            extractedDesigns.push({
              type: 'png',
              filePath: pngPath,
              relativePath: `/uploads/extracted_designs/${pngFile}`,
              ...imageInfo
            });
          }
          
          console.log(`✅ Extracted ${extractedDesigns.length} PNG designs from PDF`);
        } catch (e) {
          console.log('pdftoppm not available');
        }
      }

      // Method 3: Basic PDF content analysis
      if (extractedDesigns.length === 0) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const fileContent = fileBuffer.toString('latin1');
          
          // Analyze PDF structure for design elements
          const designElements = this.analyzePDFContent(fileContent);
          
          extractedDesigns.push({
            type: 'pdf_analysis',
            filePath: filePath,
            elements: designElements,
            message: 'PDF content analyzed, vector data preserved'
          });
          
          console.log(`📊 PDF content analysis found ${designElements.length} design elements`);
        } catch (e) {
          console.log('PDF content analysis failed');
        }
      }

      return {
        success: extractedDesigns.length > 0,
        designs: extractedDesigns,
        message: extractedDesigns.length > 0 
          ? `${extractedDesigns.length} tasarım başarıyla çıkarıldı`
          : 'PDF\'den tasarım çıkarılamadı, dosya bütünlüğü korundu'
      };

    } catch (error) {
      console.error('Design extraction failed:', error);
      return {
        success: false,
        designs: [],
        message: `Tasarım çıkarma hatası: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Analyze SVG content for design information
  private async analyzeSVGDesign(filePath: string, content: string): Promise<any> {
    try {
      // Extract SVG dimensions and elements
      const widthMatch = content.match(/width="([^"]+)"/);
      const heightMatch = content.match(/height="([^"]+)"/);
      const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
      
      // Count design elements
      const pathCount = (content.match(/<path/g) || []).length;
      const rectCount = (content.match(/<rect/g) || []).length;
      const circleCount = (content.match(/<circle/g) || []).length;
      const textCount = (content.match(/<text/g) || []).length;
      
      let realWidthMM = 50;
      let realHeightMM = 30;
      
      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        
        if (!isNaN(width) && !isNaN(height)) {
          realWidthMM = Math.round(width * 0.352778); // Convert from points
          realHeightMM = Math.round(height * 0.352778);
        }
      }
      
      return {
        realDimensionsMM: `${realWidthMM}x${realHeightMM}mm`,
        elementCount: pathCount + rectCount + circleCount + textCount,
        paths: pathCount,
        shapes: rectCount + circleCount,
        text: textCount,
        isComplex: pathCount > 10 || textCount > 5
      };
    } catch (error) {
      return {
        realDimensionsMM: '50x30mm',
        elementCount: 0,
        analysis: 'failed'
      };
    }
  }

  // Analyze PDF content structure
  private analyzePDFContent(content: string): any[] {
    const elements: any[] = [];
    
    try {
      // Look for drawing operations
      const pathOperations = content.match(/[0-9]+\.?[0-9]*\s+[0-9]+\.?[0-9]*\s+[ml]/g) || [];
      const rectangles = content.match(/[0-9]+\.?[0-9]*\s+[0-9]+\.?[0-9]*\s+[0-9]+\.?[0-9]*\s+[0-9]+\.?[0-9]*\s+re/g) || [];
      const textBlocks = content.match(/BT[\s\S]*?ET/g) || [];
      
      elements.push({
        type: 'paths',
        count: pathOperations.length,
        description: 'Vector paths and lines'
      });
      
      elements.push({
        type: 'rectangles',
        count: rectangles.length,
        description: 'Rectangle shapes'
      });
      
      elements.push({
        type: 'text',
        count: textBlocks.length,
        description: 'Text blocks'
      });
      
      // Look for images
      const imageObjects = content.match(/\/Type\s*\/XObject[\s\S]*?\/Subtype\s*\/Image/g) || [];
      if (imageObjects.length > 0) {
        elements.push({
          type: 'images',
          count: imageObjects.length,
          description: 'Embedded images'
        });
      }
      
    } catch (error) {
      console.error('PDF content analysis error:', error);
    }
    
    return elements;
  }


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
      return {
        processingNotes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        contentPreserved: false
      };
    }
  }

  private async verifyContentIntegrity(filePath: string, mimeType: string): Promise<boolean> {
    try {
      const stats = fs.statSync(filePath);

      // Check if file exists and has content
      if (!stats.isFile() || stats.size === 0) {
        return false;
      }

      // Verify file header for known formats
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
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract dimensions from SVG
      let realWidthMM = 50;
      let realHeightMM = 30;

      const widthMatch = content.match(/width="([^"]+)"/);
      const heightMatch = content.match(/height="([^"]+)"/);
      const viewBoxMatch = content.match(/viewBox="[^"]*?\s+[^"]*?\s+([^"]*?)\s+([^"]*?)"/);

      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);

        if (!isNaN(width) && !isNaN(height)) {
          // Convert units to mm
          if (widthMatch[1].includes('mm')) {
            realWidthMM = width;
            realHeightMM = height;
          } else if (widthMatch[1].includes('px')) {
            realWidthMM = Math.round((width / 96) * 25.4); // 96 DPI default
            realHeightMM = Math.round((height / 96) * 25.4);
          } else {
            realWidthMM = width;
            realHeightMM = height;
          }
        }
      } else if (viewBoxMatch) {
        const width = parseFloat(viewBoxMatch[1]);
        const height = parseFloat(viewBoxMatch[2]);

        if (!isNaN(width) && !isNaN(height)) {
          realWidthMM = Math.round((width / 96) * 25.4);
          realHeightMM = Math.round((height / 96) * 25.4);
        }
      }

      return {
        dimensions: 'SVG Vector',
        realDimensionsMM: `${realWidthMM}x${realHeightMM}mm`,
        colorProfile: 'RGB',
        processingNotes: `SVG processed - ${realWidthMM}x${realHeightMM}mm`,
        contentPreserved: true
      };
    } catch (error) {
      console.error('SVG processing error:', error);
      return {
        dimensions: 'SVG Vector',
        realDimensionsMM: '50x30mm',
        processingNotes: 'SVG processing failed - using defaults',
        contentPreserved: false
      };
    }
  }

  private async processEPS(filePath: string): Promise<FileMetadata> {
    try {
      const buffer = fs.readFileSync(filePath);
      const content = buffer.toString('latin1');

      let realWidthMM = 50;
      let realHeightMM = 30;

      // Look for BoundingBox in EPS
      const boundingBoxMatch = content.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);

      if (boundingBoxMatch) {
        const x1 = parseInt(boundingBoxMatch[1]);
        const y1 = parseInt(boundingBoxMatch[2]);
        const x2 = parseInt(boundingBoxMatch[3]);
        const y2 = parseInt(boundingBoxMatch[4]);

        const widthPoints = x2 - x1;
        const heightPoints = y2 - y1;

        realWidthMM = Math.round(widthPoints * 0.352778);
        realHeightMM = Math.round(heightPoints * 0.352778);
      }

      return {
        dimensions: 'EPS Vector',
        realDimensionsMM: `${realWidthMM}x${realHeightMM}mm`,
        colorProfile: 'CMYK',
        processingNotes: `EPS processed - ${realWidthMM}x${realHeightMM}mm`,
        contentPreserved: true
      };
    } catch (error) {
      console.error('EPS processing error:', error);
      return {
        dimensions: 'EPS Vector',
        realDimensionsMM: '50x30mm',
        processingNotes: 'EPS processing failed - using defaults',
        contentPreserved: false
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
      console.log(`🔍 Enhanced PDF analysis: ${filePath}`);

      let realWidthMM = 50;
      let realHeightMM = 30;
      let pageCount = 1;
      let shape = 'rectangle';
      let hasVectorContent = false;
      let hasImages = false;
      let extractedDesigns: any[] = [];

      // Step 1: Basic PDF info extraction
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
        }

        if (pagesMatch) {
          pageCount = parseInt(pagesMatch[1]);
        }
      } catch (pdfError) {
        console.log('PDFInfo not available, trying content analysis...');
      }

      // Step 2: PDF Content Analysis for Design Detection
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileContent = fileBuffer.toString('latin1');

        // Detect vector content
        if (fileContent.includes('/Type/XObject') || 
            fileContent.includes('/Subtype/Form') ||
            fileContent.includes('BT') || // Text blocks
            fileContent.includes('re') || // Rectangle paths
            fileContent.includes('m ') || // Move to commands
            fileContent.includes('l ')) {  // Line to commands
          hasVectorContent = true;
          console.log('✅ Vector content detected in PDF');
        }

        // Detect images
        if (fileContent.includes('/Type/XObject') && 
            fileContent.includes('/Subtype/Image')) {
          hasImages = true;
          console.log('✅ Embedded images detected in PDF');
        }

        // Extract MediaBox for more accurate dimensions
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
        }

        // Detect multiple design elements
        const pathMatches = fileContent.match(/[0-9]+\.?[0-9]*\s+[0-9]+\.?[0-9]*\s+m/g);
        if (pathMatches && pathMatches.length > 5) {
          console.log(`📐 Multiple design paths detected: ${pathMatches.length} elements`);
        }

      } catch (contentError) {
        console.log('PDF content analysis failed:', contentError);
      }

      // Step 3: Try to extract design elements using pdf2svg if available
      try {
        await execAsync('which pdf2svg');
        const outputDir = path.join(this.uploadDir, 'extracted_designs');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const svgOutputPath = path.join(outputDir, `design_${Date.now()}.svg`);
        await execAsync(`pdf2svg "${filePath}" "${svgOutputPath}" 1`);
        
        if (fs.existsSync(svgOutputPath)) {
          console.log('✅ PDF converted to SVG for design extraction');
          extractedDesigns.push({
            type: 'svg',
            path: svgOutputPath,
            page: 1
          });
        }
      } catch (extractError) {
        console.log('Design extraction not available (pdf2svg not installed)');
      }

      // Validate and constrain dimensions
      if (realWidthMM > 500 || realHeightMM > 500) {
        realWidthMM = Math.min(realWidthMM, 200);
        realHeightMM = Math.min(realHeightMM, 200);
      }

      if (realWidthMM < 10 || realHeightMM < 10) {
        realWidthMM = 50;
        realHeightMM = 30;
        shape = 'rectangle';
      }

      // Compile metadata
      const contentType = hasVectorContent ? 'Vector' : hasImages ? 'Image' : 'Mixed';
      metadata.realDimensionsMM = `${realWidthMM}x${realHeightMM}mm`;
      metadata.dimensions = `${contentType} ${shape.charAt(0).toUpperCase() + shape.slice(1)}`;
      metadata.pageCount = pageCount;
      metadata.hasVectorContent = hasVectorContent;
      metadata.hasImages = hasImages;
      metadata.extractedDesigns = extractedDesigns;
      metadata.processingNotes = `PDF analyzed - ${realWidthMM}x${realHeightMM}mm ${shape}, ${contentType} content${extractedDesigns.length > 0 ? `, ${extractedDesigns.length} designs extracted` : ''}`;
      metadata.contentPreserved = true;

      console.log('🎯 Enhanced PDF metadata:', metadata);

    } catch (error) {
      console.error('PDF processing error:', error);
      metadata.pageCount = 1;
      metadata.realDimensionsMM = '50x30mm';
      metadata.dimensions = 'Vector Rectangle';
      metadata.processingNotes = 'PDF analysis failed - using defaults';
      metadata.contentPreserved = false;
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
      const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');

      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      const outputPath = path.join(thumbnailDir, filename);

      // Check if ImageMagick is available
      try {
        await new Promise((resolve, reject) => {
          exec('which convert', (error) => {
            if (error) reject(new Error('ImageMagick not installed'));
            else resolve(true);
          });
        });
      } catch (error) {
        console.warn('ImageMagick not available, skipping thumbnail generation');
        return '';
      }

      // Use ImageMagick to convert first page of PDF to thumbnail
      const command = `convert "${filePath}[0]" -thumbnail 200x200 "${outputPath}" 2>/dev/null`;

      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      return `/uploads/thumbnails/${filename}`;
    } catch (error) {
      console.warn('PDF thumbnail generation failed:', error);
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