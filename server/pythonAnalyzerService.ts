import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface PythonAnalysisResult {
  success: boolean;
  dimensions: {
    widthMM: number;
    heightMM: number;
    category: string;
    confidence: number;
    description: string;
    shouldRotate?: boolean;
  };
  detectedDesigns: number;
  pageCount?: number;
  hasText?: boolean;
  hasImages?: boolean;
  isVector?: boolean;
  imageProperties?: {
    widthPx: number;
    heightPx: number;
    dpi: number;
    isGrayscale: boolean;
    complexity: string;
  };
  processingNotes: string[];
  error?: string;
}

export class PythonAnalyzerService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(process.cwd(), 'server', 'advancedPythonAnalyzer.py');
  }

  async analyzeFile(filePath: string, fileName: string, mimeType: string): Promise<PythonAnalysisResult> {
    try {
      console.log(`🐍 Python analizi başlatılıyor: ${fileName}`);
      
      // Python script'i çalıştır
      const command = `python3 "${this.pythonScriptPath}" "${filePath}" "${fileName}" "${mimeType}"`;
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 saniye timeout
        encoding: 'utf8'
      });

      if (stderr) {
        console.log('Python stderr:', stderr);
      }

      // JSON sonucu parse et
      const result = JSON.parse(stdout) as PythonAnalysisResult;
      
      console.log(`✅ Python analizi tamamlandı:`, {
        success: result.success,
        dimensions: `${result.dimensions.widthMM}x${result.dimensions.heightMM}mm`,
        category: result.dimensions.category,
        confidence: result.dimensions.confidence
      });

      return result;

    } catch (error) {
      console.error('Python analiz hatası:', error);
      
      // Hata durumunda fallback sonuç döndür
      return this.createFallbackResult(fileName, error.message);
    }
  }

  private createFallbackResult(fileName: string, errorMessage: any): PythonAnalysisResult {
    const name = fileName.toLowerCase();
    let widthMM = 80, heightMM = 60, category = 'label';
    
    // Dosya adından akıllı tahmin
    if (name.includes('logo')) {
      widthMM = 100; heightMM = 80; category = 'logo';
    } else if (name.includes('kartvizit') || name.includes('business')) {
      widthMM = 85; heightMM = 55; category = 'business_card';
    } else if (name.includes('etiket') || name.includes('label')) {
      widthMM = 60; heightMM = 40; category = 'label';
    }

    return {
      success: false,
      dimensions: {
        widthMM,
        heightMM,
        category,
        confidence: 0.5,
        description: `Fallback analizi: ${widthMM}x${heightMM}mm ${category}`,
        shouldRotate: false
      },
      detectedDesigns: 1,
      processingNotes: [
        'Python analizi başarısız, fallback kullanıldı',
        `Hata: ${errorMessage}`,
        `Varsayılan boyutlar: ${widthMM}x${heightMM}mm`,
        `Kategori: ${category}`
      ],
      error: errorMessage
    };
  }

  async testPythonEnvironment(): Promise<boolean> {
    try {
      const command = `python3 -c "import sys, fitz, PIL, cv2, numpy, svglib, reportlab, cairosvg, magic; print('Python environment OK')"`;
      await execAsync(command, { timeout: 10000 });
      console.log('✅ Python environment testi başarılı');
      return true;
    } catch (error) {
      console.error('❌ Python environment testi başarısız:', error);
      return false;
    }
  }
}

export const pythonAnalyzerService = new PythonAnalyzerService();