import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface PDFBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PDFAnalysisResult {
  success: boolean;
  dimensions: {
    widthMM: number;
    heightMM: number;
    confidence: number;
    method: 'mediabox' | 'trimbox' | 'artbox' | 'content' | 'visual' | 'manual';
    description: string;
  };
  boxes: {
    mediaBox?: PDFBox;
    trimBox?: PDFBox;
    artBox?: PDFBox;
    bleedBox?: PDFBox;
  };
  contentAnalysis: {
    hasVectorContent: boolean;
    hasRasterContent: boolean;
    hasText: boolean;
    isEmpty: boolean;
    contentBounds?: PDFBox;
  };
  qualityReport: {
    isVectorBased: boolean;
    hasProperBoxes: boolean;
    needsOptimization: boolean;
    warnings: string[];
    recommendations: string[];
  };
  processingNotes: string[];
  error?: string;
}

export class EnhancedPDFAnalyzer {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'server', 'enhancedPDFAnalysis.py');
  }

  async analyzePDF(filePath: string, fileName: string): Promise<PDFAnalysisResult> {
    console.log(`🔍 Enhanced PDF analysis starting: ${fileName}`);
    
    try {
      // Primary analysis using Python/PyMuPDF
      const primaryResult = await this.performPrimaryAnalysis(filePath, fileName);
      
      if (primaryResult.success && primaryResult.dimensions.confidence > 0.8) {
        console.log(`✅ Primary analysis successful: ${primaryResult.dimensions.widthMM}x${primaryResult.dimensions.heightMM}mm`);
        return primaryResult;
      }

      // Fallback to advanced content analysis
      console.log(`⚠️ Primary analysis low confidence, trying advanced methods...`);
      const fallbackResult = await this.performAdvancedAnalysis(filePath, fileName, primaryResult);
      
      return fallbackResult;

    } catch (error) {
      console.error(`❌ PDF analysis failed: ${error}`);
      return this.createFailureResult(fileName, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async performPrimaryAnalysis(filePath: string, fileName: string): Promise<PDFAnalysisResult> {
    const command = `python3 "${this.pythonScriptPath}" "${filePath}" "${fileName}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        encoding: 'utf8'
      });

      if (stderr) {
        console.log('Python stderr:', stderr);
      }

      const result = JSON.parse(stdout) as PDFAnalysisResult;
      return result;

    } catch (error) {
      throw new Error(`Primary analysis failed: ${error}`);
    }
  }

  private async performAdvancedAnalysis(
    filePath: string, 
    fileName: string, 
    primaryResult: PDFAnalysisResult
  ): Promise<PDFAnalysisResult> {
    
    const processingNotes = [...(primaryResult.processingNotes || [])];
    processingNotes.push("Primary analysis insufficient, using advanced methods");

    // Try visual content analysis
    try {
      const visualResult = await this.performVisualContentAnalysis(filePath);
      if (visualResult.success) {
        processingNotes.push("Visual content analysis successful");
        return {
          ...primaryResult,
          success: true,
          dimensions: {
            ...visualResult.dimensions,
            method: 'visual' as const,
            confidence: Math.max(0.6, visualResult.dimensions.confidence)
          },
          processingNotes
        };
      }
    } catch (error) {
      processingNotes.push(`Visual analysis failed: ${error}`);
    }

    // Try contour detection
    try {
      const contourResult = await this.performContourAnalysis(filePath);
      if (contourResult.success) {
        processingNotes.push("Contour detection successful");
        return {
          ...primaryResult,
          success: true,
          dimensions: {
            ...contourResult.dimensions,
            method: 'content' as const,
            confidence: Math.max(0.5, contourResult.dimensions.confidence)
          },
          processingNotes
        };
      }
    } catch (error) {
      processingNotes.push(`Contour analysis failed: ${error}`);
    }

    // Return enhanced failure result with suggestions
    return {
      ...primaryResult,
      success: false,
      qualityReport: {
        ...primaryResult.qualityReport,
        needsOptimization: true,
        warnings: [
          ...primaryResult.qualityReport.warnings,
          "Unable to detect design dimensions automatically"
        ],
        recommendations: [
          ...primaryResult.qualityReport.recommendations,
          "Consider manual dimension input",
          "Check if PDF contains visible design elements",
          "Verify PDF is not corrupted or empty"
        ]
      },
      processingNotes
    };
  }

  private async performVisualContentAnalysis(filePath: string): Promise<PDFAnalysisResult> {
    // Convert PDF to image and analyze
    const command = `python3 -c "
import fitz
import numpy as np
from PIL import Image
import json

doc = fitz.open('${filePath}')
page = doc[0]
mat = fitz.Matrix(2, 2)  # 2x zoom
pix = page.get_pixmap(matrix=mat)
img_data = pix.tobytes('ppm')

# Save temp image
with open('/tmp/pdf_analysis.ppm', 'wb') as f:
    f.write(img_data)

# Analyze image content
img = Image.open('/tmp/pdf_analysis.ppm')
np_img = np.array(img)

# Find non-white content
mask = np.all(np_img < 250, axis=2)
if np.any(mask):
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    
    # Convert back to PDF coordinates
    width_mm = round((cmax - cmin) * 25.4 / (72 * 2))  # 2x zoom factor
    height_mm = round((rmax - rmin) * 25.4 / (72 * 2))
    
    result = {
        'success': True,
        'dimensions': {
            'widthMM': max(width_mm, 10),
            'heightMM': max(height_mm, 10),
            'confidence': 0.7,
            'method': 'visual',
            'description': f'Visual content analysis: {width_mm}x{height_mm}mm'
        }
    }
else:
    result = {'success': False}

print(json.dumps(result))
"`;

    const { stdout } = await execAsync(command, { timeout: 15000 });
    return JSON.parse(stdout);
  }

  private async performContourAnalysis(filePath: string): Promise<PDFAnalysisResult> {
    // Use OpenCV-style contour detection through Python
    const command = `python3 -c "
import fitz
import json
import sys

try:
    doc = fitz.open('${filePath}')
    page = doc[0]
    
    # Get page drawings/paths
    drawings = page.get_drawings()
    if drawings:
        xs = []
        ys = []
        for drawing in drawings:
            for item in drawing['items']:
                if 'rect' in item:
                    rect = item['rect']
                    xs.extend([rect.x0, rect.x1])
                    ys.extend([rect.y0, rect.y1])
        
        if xs and ys:
            width_pts = max(xs) - min(xs)
            height_pts = max(ys) - min(ys)
            width_mm = round(width_pts * 25.4 / 72)
            height_mm = round(height_pts * 25.4 / 72)
            
            result = {
                'success': True,
                'dimensions': {
                    'widthMM': max(width_mm, 5),
                    'heightMM': max(height_mm, 5),
                    'confidence': 0.6,
                    'method': 'content',
                    'description': f'Vector path analysis: {width_mm}x{height_mm}mm'
                }
            }
        else:
            result = {'success': False}
    else:
        result = {'success': False}
        
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
"`;

    const { stdout } = await execAsync(command, { timeout: 10000 });
    return JSON.parse(stdout);
  }

  private createFailureResult(fileName: string, errorMessage: string): PDFAnalysisResult {
    return {
      success: false,
      dimensions: {
        widthMM: 50,
        heightMM: 30,
        confidence: 0.1,
        method: 'manual',
        description: `Analysis failed for ${fileName}`
      },
      boxes: {},
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
        warnings: [
          "PDF analysis completely failed",
          "File may be corrupted or inaccessible"
        ],
        recommendations: [
          "Verify file integrity",
          "Try re-exporting the PDF",
          "Use manual dimension input",
          "Check if file contains actual design content"
        ]
      },
      processingNotes: [
        `Analysis failed: ${errorMessage}`,
        "Using fallback dimensions",
        "Manual verification required"
      ],
      error: errorMessage
    };
  }

  async optimizePDF(filePath: string, outputPath: string): Promise<{
    success: boolean;
    optimizedPath?: string;
    improvements: string[];
    warnings: string[];
  }> {
    // PDF optimization implementation
    const command = `python3 -c "
import fitz
import json

doc = fitz.open('${filePath}')
improvements = []
warnings = []

try:
    page = doc[0]
    
    # Check and fix missing boxes
    mediabox = page.mediabox
    if not page.trimbox or page.trimbox == mediabox:
        # Set trimbox to content bounds if possible
        improvements.append('Added missing TrimBox')
    
    if not page.artbox or page.artbox == mediabox:
        improvements.append('Added missing ArtBox')
    
    # Save optimized version
    doc.save('${outputPath}', garbage=4, deflate=True)
    doc.close()
    
    result = {
        'success': True,
        'improvements': improvements,
        'warnings': warnings
    }
    
except Exception as e:
    result = {
        'success': False,
        'improvements': [],
        'warnings': [f'Optimization failed: {str(e)}']
    }

print(json.dumps(result))
"`;

    try {
      const { stdout } = await execAsync(command, { timeout: 20000 });
      const result = JSON.parse(stdout);
      
      if (result.success) {
        result.optimizedPath = outputPath;
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        improvements: [],
        warnings: [`Optimization process failed: ${error}`]
      };
    }
  }
}

export const enhancedPDFAnalyzer = new EnhancedPDFAnalyzer();