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
      console.log('🚀 OneClick layout processing started');
      console.log('Designs to process:', designs.length);
      console.log('Sheet settings:', settings.sheetSettings);

      if (!designs || designs.length === 0) {
        return {
          success: false,
          arrangements: [],
          efficiency: 0,
          statistics: {
            totalDesigns: 0,
            arrangedDesigns: 0,
            rotatedItems: 0,
            wastePercentage: 100
          },
          message: 'No designs provided for layout'
        };
      }

      // Convert designs to layout format with proper dimension extraction
      const layoutDesigns = designs.map(design => {
        // Try to get dimensions from various sources
        let width = 50; // default
        let height = 30; // default
        
        if (design.realDimensionsMM?.widthMM && design.realDimensionsMM?.heightMM) {
          width = design.realDimensionsMM.widthMM;
          height = design.realDimensionsMM.heightMM;
        } else if (design.widthMM && design.heightMM) {
          width = design.widthMM;
          height = design.heightMM;
        } else if (design.width && design.height) {
          width = design.width;
          height = design.height;
        }

        console.log(`Design ${design.id}: ${width}x${height}mm`);

        return {
          id: design.id,
          name: design.name || `Design_${design.id}`,
          width,
          height,
          canRotate: true
        };
      });

      console.log('Prepared layout designs:', layoutDesigns);

      // Layout settings
      const layoutSettings = {
        sheetWidth: settings.sheetSettings.width,
        sheetHeight: settings.sheetSettings.height,
        margin: settings.sheetSettings.margin,
        spacing: 5,
        allowRotation: true,
        optimizeForWaste: true
      };

      console.log('Layout settings:', layoutSettings);

      // Generate optimal layout using advanced engine
      const layoutResult = advancedLayoutEngine.generateOptimalLayout(
        layoutDesigns,
        layoutSettings
      );

      console.log('Layout result:', {
        arrangedCount: layoutResult.arrangements.length,
        efficiency: layoutResult.efficiency
      });

      // Calculate statistics
      const rotatedItems = layoutResult.arrangements.filter(item => item.rotation !== 0).length;
      const usedArea = layoutResult.arrangements.reduce((total, item) => 
        total + (item.width * item.height), 0);
      const totalSheetArea = settings.sheetSettings.width * settings.sheetSettings.height;
      const wastePercentage = Math.max(0, ((totalSheetArea - usedArea) / totalSheetArea) * 100);

      console.log('Statistics calculated:', {
        totalDesigns: designs.length,
        arrangedDesigns: layoutResult.arrangements.length,
        rotatedItems,
        wastePercentage: Math.round(wastePercentage * 100) / 100
      });

      return {
        success: true,
        arrangements: layoutResult.arrangements,
        efficiency: layoutResult.efficiency,
        statistics: {
          totalDesigns: designs.length,
          arrangedDesigns: layoutResult.arrangements.length,
          rotatedItems,
          wastePercentage: Math.round(wastePercentage * 100) / 100
        }
      };

    } catch (error) {
      console.error('OneClick layout processing error:', error);
      return {
        success: false,
        arrangements: [],
        efficiency: 0,
        statistics: {
          totalDesigns: designs.length,
          arrangedDesigns: 0,
          rotatedItems: 0,
          wastePercentage: 100
        },
        message: error instanceof Error ? error.message : 'Layout processing failed'
      };
    }
  }

  private async analyzeAndProcessDesignsWithAI(designs: any[]): Promise<ProcessedDesign[]> {
    const processedDesigns: ProcessedDesign[] = [];
    
    for (const design of designs) {
      try {
        const processed: ProcessedDesign = {
          id: design.id,
          name: design.name || `Design_${design.id}`,
          width: design.realDimensionsMM?.widthMM || design.widthMM || 50,
          height: design.realDimensionsMM?.heightMM || design.heightMM || 30,
          filePath: design.filePath || '',
          vectorContent: design.mimeType?.includes('pdf') || design.mimeType?.includes('svg') || false,
          quality: design.status === 'ready' ? 'high' : 'medium'
        };
        processedDesigns.push(processed);
      } catch (error) {
        console.error(`Error processing design ${design.id}:`, error);
      }
    }
    
    return processedDesigns;
  }
}

export const oneClickLayoutSystem = new OneClickLayoutSystem();