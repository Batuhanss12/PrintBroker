import { advancedLayoutEngine } from "./advancedLayoutEngine";
import { fileProcessingService } from "./fileProcessingService";
import { nodePDFGenerator } from "./pdfGeneratorJS";
import { aiLayoutOptimizer } from "./aiLayoutOptimizer";
import { aiDesignAnalyzer } from "./aiDesignAnalyzer";

interface OneClickLayoutRequest {
  designIds: string[];
  sheetSettings: {
    width: number;
    height: number;
    margin: number;
    bleedMargin: number;
  };
  cuttingSettings: {
    enabled: boolean;
    markLength: number;
    markWidth: number;
  };
}

interface ProcessedDesign {
  id: string;
  name: string;
  width: number;
  height: number;
  filePath: string;
  vectorContent: boolean;
  quality: 'low' | 'medium' | 'high';
}

export class OneClickLayoutSystem {
  
  async processOneClickLayout(
    designs: any[], 
    settings: OneClickLayoutRequest
  ): Promise<{
    success: boolean;
    arrangements: any[];
    pdfPath?: string;
    efficiency: number;
    statistics: {
      totalDesigns: number;
      arrangedDesigns: number;
      rotatedItems: number;
      wastePercentage: number;
    };
    message?: string;
  }> {
    try {
      console.log('🚀 Tek tuş otomatik dizim başlatılıyor...');
      
      // 1. AI destekli dosya analizi ve boyut tespiti
      const processedDesigns = await this.analyzeAndProcessDesignsWithAI(designs);
      
      if (processedDesigns.length === 0) {
        return {
          success: false,
          arrangements: [],
          efficiency: 0,
          statistics: { totalDesigns: 0, arrangedDesigns: 0, rotatedItems: 0, wastePercentage: 100 },
          message: 'Hiçbir tasarım analiz edilemedi'
        };
      }

      // 2. AI destekli akıllı yerleştirme
      let layoutResult;
      let aiRecommendations: string[] = [];

      if (aiLayoutOptimizer.isAvailable()) {
        console.log('🤖 AI destekli dizim kullanılıyor...');
        const aiResult = await aiLayoutOptimizer.optimizeLayoutWithAI(
          processedDesigns,
          {
            width: settings.sheetSettings.width,
            height: settings.sheetSettings.height,
            margin: settings.sheetSettings.margin,
            spacing: settings.sheetSettings.bleedMargin
          }
        );
        
        layoutResult = {
          arrangements: aiResult.arrangements,
          efficiency: aiResult.efficiency,
          statistics: {
            rotatedItems: aiResult.arrangements.filter(a => a.rotation === 90).length,
            wasteArea: 0,
            utilizationRate: Math.round((aiResult.arrangements.length / processedDesigns.length) * 100)
          }
        };
        
        aiRecommendations = aiResult.aiRecommendations;
        console.log('🎯 AI Önerileri:', aiRecommendations);
        
      } else {
        console.log('🔧 Standart dizim kullanılıyor...');
        layoutResult = advancedLayoutEngine.optimizeLayout(
          processedDesigns.map(d => ({
            id: d.id,
            width: d.width + (settings.sheetSettings.bleedMargin * 2),
            height: d.height + (settings.sheetSettings.bleedMargin * 2),
            name: d.name,
            canRotate: true
          })),
          {
            sheetWidth: settings.sheetSettings.width,
            sheetHeight: settings.sheetSettings.height,
            margin: settings.sheetSettings.margin,
            spacing: 2,
            allowRotation: true,
            optimizeForWaste: true
          }
        );
      }

      // 3. Düzenleme formatını dönüştür
      const arrangements = layoutResult.arrangements.map(item => {
        const designData = processedDesigns.find(d => d.id === (item.id || item.designId));
        const designName = designData?.name || item.name || item.designName || `Design_${(item.id || item.designId || '').slice(0,8)}`;
        
        return {
          designId: item.id || item.designId,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          rotation: item.rotation,
          designName: item.rotation === 90 ? `${designName} (döndürülmüş)` : designName,
          withCuttingMarks: settings.cuttingSettings.enabled,
          withMargins: {
            width: item.width,
            height: item.height
          }
        };
      });

      // 4. PDF oluştur
      let pdfPath: string | undefined;
      try {
        const pdfResult = await nodePDFGenerator.generateArrangementPDF({
          plotterSettings: {
            sheetWidth: settings.sheetSettings.width,
            sheetHeight: settings.sheetSettings.height,
            marginTop: settings.sheetSettings.margin,
            marginBottom: settings.sheetSettings.margin,
            marginLeft: settings.sheetSettings.margin,
            marginRight: settings.sheetSettings.margin,
            labelWidth: 50,
            labelHeight: 30,
            horizontalSpacing: 2,
            verticalSpacing: 2
          },
          arrangements
        });

        if (pdfResult.success) {
          pdfPath = pdfResult.filePath;
          console.log('✅ PDF başarıyla oluşturuldu:', pdfPath);
        }
      } catch (pdfError) {
        console.warn('PDF oluşturma hatası:', pdfError);
      }

      const statistics = {
        totalDesigns: processedDesigns.length,
        arrangedDesigns: arrangements.length,
        rotatedItems: layoutResult.statistics.rotatedItems,
        wastePercentage: Math.round((100 - layoutResult.efficiency) * 100) / 100
      };

      console.log(`🎯 Tek tuş dizim tamamlandı: ${arrangements.length}/${processedDesigns.length} tasarım, ${layoutResult.efficiency}% verimlilik`);

      return {
        success: true,
        arrangements,
        pdfPath,
        efficiency: layoutResult.efficiency,
        statistics,
        message: `${arrangements.length} tasarım başarıyla dizildi`,
        aiRecommendations: aiRecommendations.length > 0 ? aiRecommendations : undefined
      };

    } catch (error) {
      console.error('❌ Tek tuş dizim hatası:', error);
      return {
        success: false,
        arrangements: [],
        efficiency: 0,
        statistics: { totalDesigns: 0, arrangedDesigns: 0, rotatedItems: 0, wastePercentage: 100 },
        message: 'Dizim işlemi başarısız: ' + (error as Error).message
      };
    }
  }

  private async analyzeAndProcessDesignsWithAI(designs: any[]): Promise<ProcessedDesign[]> {
    const processed: ProcessedDesign[] = [];

    for (const design of designs) {
      try {
        console.log(`🤖 AI ile tasarım analizi: ${design.name}`);

        // AI analiz sonuçlarını kullan
        let width = 50;
        let height = 30;
        let vectorContent = false;
        let quality: 'low' | 'medium' | 'high' = 'medium';

        // Eğer AI analizi mevcutsa kullan
        if (design.aiAnalysis && design.aiAnalysis.success) {
          const aiDesign = design.aiAnalysis.designs[0];
          if (aiDesign) {
            width = aiDesign.realWorldDimensions.widthMM;
            height = aiDesign.realWorldDimensions.heightMM;
            vectorContent = aiDesign.contentType !== 'complex_design';
            quality = aiDesign.aiConfidence > 0.8 ? 'high' : 'medium';
            console.log(`✅ AI boyutları kullanıldı: ${width}x${height}mm (güven: ${aiDesign.aiConfidence})`);
          }
        } else if (design.smartDimensions) {
          // Smart dimensions'dan boyutları al
          width = design.smartDimensions.width;
          height = design.smartDimensions.height;
          quality = design.smartDimensions.confidence > 0.7 ? 'high' : 'medium';
          console.log(`📐 Akıllı boyutlar kullanıldı: ${width}x${height}mm`);
        } else {
          // Geleneksel analiz yap
          const result = await this.analyzeDesignTraditional(design);
          width = result.width;
          height = result.height;
          vectorContent = result.vectorContent;
          quality = result.quality;
        }

        processed.push({
          id: design.id,
          name: design.originalName || design.name || design.filename || `Design_${design.id.slice(0,8)}`,
          width,
          height,
          filePath: design.filePath,
          vectorContent,
          quality
        });

        console.log(`✅ Tasarım hazır: ${design.name} (${width}x${height}mm)`);

      } catch (error) {
        console.warn(`⚠️ Tasarım analiz hatası ${design.name}:`, error);
        
        // Hata durumunda varsayılan değerlerle ekle
        processed.push({
          id: design.id,
          name: design.name || design.originalName,
          width: 50,
          height: 30,
          filePath: design.filePath,
          vectorContent: false,
          quality: 'low'
        });
      }
    }

    return processed;
  }

  private async analyzeDesignTraditional(design: any): Promise<{
    width: number;
    height: number;
    vectorContent: boolean;
    quality: 'low' | 'medium' | 'high';
  }> {
    try {
      console.log(`🔍 Geleneksel analiz: ${design.originalName || design.name}`);

      // Dosya boyutlarını tespit et
      let width = 50;
      let height = 30;
      let vectorContent = false;
      let quality: 'low' | 'medium' | 'high' = 'medium';

      // Dosya boyutlarını tespit et
      if (design.realDimensionsMM && design.realDimensionsMM !== 'Boyut tespit edilemedi') {
        const dimensionMatch = design.realDimensionsMM.match(/(\d+)x(\d+)mm/i);
        if (dimensionMatch) {
          width = parseInt(dimensionMatch[1]);
          height = parseInt(dimensionMatch[2]);
        }
      }

      // Vektör içerik analizi
      try {
        const vectorAnalysis = await fileProcessingService.verifyVectorContent(
          design.filePath, 
          design.mimeType || 'application/pdf'
        );
        vectorContent = vectorAnalysis.isVector;
        quality = vectorAnalysis.quality;
      } catch (error) {
        console.warn('Vektör analiz hatası:', error);
      }

      return { width, height, vectorContent, quality };
    } catch (error) {
      console.warn('Geleneksel analiz hatası:', error);
      return {
        width: 50,
        height: 30,
        vectorContent: false,
        quality: 'low'
      };
    }
  }

  private async analyzeAndProcessDesigns(designs: any[]): Promise<ProcessedDesign[]> {
    const processed: ProcessedDesign[] = [];

    for (const design of designs) {
      try {
        console.log(`🔍 Tasarım analiz ediliyor: ${design.originalName || design.name}`);

        // Dosya boyutlarını tespit et
        let width = 50;
        let height = 30;

        if (design.realDimensionsMM && design.realDimensionsMM !== 'Boyut tespit edilemedi') {
          const dimensionMatch = design.realDimensionsMM.match(/(\d+)x(\d+)mm/i);
          if (dimensionMatch) {
            width = parseInt(dimensionMatch[1]);
            height = parseInt(dimensionMatch[2]);
            console.log(`📏 Boyut tespit edildi: ${width}x${height}mm`);
          }
        }

        // Vektör içerik analizi
        const vectorAnalysis = await fileProcessingService.verifyVectorContent(
          design.filePath, 
          design.mimeType || 'application/pdf'
        );

        processed.push({
          id: design.id,
          name: design.originalName || design.name,
          width,
          height,
          filePath: design.filePath,
          vectorContent: vectorAnalysis.isVector,
          quality: vectorAnalysis.quality
        });

        console.log(`✅ Tasarım işlendi: ${design.name} (${width}x${height}mm, vektör: ${vectorAnalysis.isVector})`);

      } catch (error) {
        console.warn(`⚠️ Tasarım analiz hatası ${design.name}:`, error);
        
        // Hata durumunda varsayılan değerlerle ekle
        processed.push({
          id: design.id,
          name: design.originalName || design.name,
          width: 50,
          height: 30,
          filePath: design.filePath,
          vectorContent: false,
          quality: 'low'
        });
      }
    }

    return processed;
  }

  async validateDesignsForLayout(designs: any[]): Promise<{
    valid: any[];
    invalid: any[];
    warnings: string[];
  }> {
    const valid: any[] = [];
    const invalid: any[] = [];
    const warnings: string[] = [];

    for (const design of designs) {
      try {
        const validation = await fileProcessingService.validateFile(
          design.filePath, 
          design.mimeType || 'application/pdf'
        );

        if (validation.isValid) {
          valid.push(design);
        } else {
          invalid.push(design);
          warnings.push(`${design.name}: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        invalid.push(design);
        warnings.push(`${design.name}: Doğrulama hatası`);
      }
    }

    return { valid, invalid, warnings };
  }

  getOptimalSheetSettings(designs: ProcessedDesign[]): {
    recommendedWidth: number;
    recommendedHeight: number;
    efficiency: number;
    reasoning: string;
  } {
    // A3: 330x480mm (en yaygın)
    // A4: 210x297mm
    // A2: 480x640mm

    const sheetOptions = [
      { width: 330, height: 480, name: 'A3' },
      { width: 210, height: 297, name: 'A4' },
      { width: 480, height: 640, name: 'A2' }
    ];

    let bestOption = sheetOptions[0];
    let bestEfficiency = 0;

    for (const sheet of sheetOptions) {
      const testResult = advancedLayoutEngine.generateOptimalLayout(
        designs.map(d => ({
          id: d.id,
          width: d.width + 6, // 3mm kesim payı her yana
          height: d.height + 6,
          name: d.name,
          canRotate: true
        })),
        {
          sheetWidth: sheet.width,
          sheetHeight: sheet.height,
          margin: 10,
          spacing: 2,
          allowRotation: true,
          optimizeForWaste: true
        }
      );

      if (testResult.efficiency > bestEfficiency) {
        bestEfficiency = testResult.efficiency;
        bestOption = sheet;
      }
    }

    return {
      recommendedWidth: bestOption.width,
      recommendedHeight: bestOption.height,
      efficiency: bestEfficiency,
      reasoning: `${bestOption.name} (${bestOption.width}x${bestOption.height}mm) en iyi verimlilik: ${bestEfficiency.toFixed(1)}%`
    };
  }
}

export const oneClickLayoutSystem = new OneClickLayoutSystem();