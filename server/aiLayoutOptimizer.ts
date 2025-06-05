
import OpenAI from "openai";
import { advancedLayoutEngine } from "./advancedLayoutEngine";
import { fileProcessingService } from "./fileProcessingService";

interface DesignAnalysis {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  category: 'text-heavy' | 'logo' | 'complex-graphic' | 'simple-shape';
  priority: 'high' | 'medium' | 'low';
  rotationRecommendation: boolean;
  groupingTags: string[];
}

interface LayoutOptimizationResult {
  arrangements: any[];
  efficiency: number;
  aiRecommendations: string[];
  alternativeLayouts: {
    name: string;
    efficiency: number;
    description: string;
    arrangements: any[];
  }[];
  optimizationScore: number;
}

class AILayoutOptimizer {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }

  // Tasarımları AI ile analiz et
  async analyzeDesignsWithAI(designs: any[]): Promise<DesignAnalysis[]> {
    if (!this.openai) {
      console.log('🤖 AI kullanılamıyor, temel analiz yapılıyor...');
      return this.basicAnalysis(designs);
    }

    console.log('🤖 AI ile tasarım analizi başlatılıyor...');

    try {
      const designPrompt = `Aşağıdaki ${designs.length} tasarımı analiz et ve her biri için en uygun dizim önerilerini ver:

${designs.map((d, i) => `${i + 1}. ${d.originalName || d.name} - ${d.realDimensionsMM || 'boyut belirsiz'}`).join('\n')}

Her tasarım için şunları belirle:
- Kategori: text-heavy, logo, complex-graphic, simple-shape
- Öncelik: high, medium, low (kalite ve önem açısından)
- Döndürme önerisi: true/false
- Gruplama etiketleri: benzer tasarımları gruplamak için

JSON formatında döndür: { "analyses": [{"index": 0, "category": "...", "priority": "...", "rotationRecommendation": true/false, "groupingTags": ["tag1", "tag2"]}] }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Sen profesyonel bir grafik tasarım ve baskı uzmanısın. Tasarımları analiz ederek en verimli dizim önerileri veriyorsun." },
          { role: "user", content: designPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{"analyses": []}');
      
      return designs.map((design, index) => {
        const aiData = aiAnalysis.analyses.find((a: any) => a.index === index) || {};
        
        let width = 50, height = 30;
        if (design.realDimensionsMM && design.realDimensionsMM !== 'Boyut tespit edilemedi') {
          const match = design.realDimensionsMM.match(/(\d+)x(\d+)mm/i);
          if (match) {
            width = parseInt(match[1]);
            height = parseInt(match[2]);
          }
        }

        return {
          id: design.id,
          name: design.originalName || design.name,
          width,
          height,
          aspectRatio: width / height,
          category: aiData.category || 'simple-shape',
          priority: aiData.priority || 'medium',
          rotationRecommendation: aiData.rotationRecommendation || false,
          groupingTags: aiData.groupingTags || []
        };
      });

    } catch (error) {
      console.error('❌ AI analiz hatası:', error);
      return this.basicAnalysis(designs);
    }
  }

  // AI ile optimize edilmiş dizim
  async optimizeLayoutWithAI(
    designs: any[],
    sheetSettings: { width: number; height: number; margin: number; spacing: number }
  ): Promise<LayoutOptimizationResult> {
    console.log('🚀 AI destekli otomatik dizim başlatılıyor...');

    // 1. Tasarımları AI ile analiz et
    const analyzedDesigns = await this.analyzeDesignsWithAI(designs);

    // 2. AI önerilerine göre farklı yerleştirme stratejileri dene
    const layoutStrategies = [
      { name: 'Öncelik Sırası', sortBy: 'priority' },
      { name: 'Akıllı Gruplama', sortBy: 'grouping' },
      { name: 'Boyut Optimizasyonu', sortBy: 'size' },
      { name: 'Döndürme Optimizasyonu', sortBy: 'rotation' }
    ];

    const layoutResults = [];

    for (const strategy of layoutStrategies) {
      const sortedDesigns = this.sortDesignsByStrategy(analyzedDesigns, strategy.sortBy);
      
      const layoutResult = advancedLayoutEngine.optimizeLayout(
        sortedDesigns.map(d => ({
          id: d.id,
          width: d.width + (sheetSettings.spacing * 2),
          height: d.height + (sheetSettings.spacing * 2),
          name: d.name,
          canRotate: d.rotationRecommendation
        })),
        {
          sheetWidth: sheetSettings.width,
          sheetHeight: sheetSettings.height,
          margin: sheetSettings.margin,
          spacing: sheetSettings.spacing,
          allowRotation: true,
          optimizeForWaste: true
        }
      );

      layoutResults.push({
        name: strategy.name,
        efficiency: layoutResult.efficiency,
        description: this.getStrategyDescription(strategy.sortBy),
        arrangements: layoutResult.arrangements.map(item => ({
          designId: item.id,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          rotation: item.rotation,
          designName: item.rotation === 90 ? `${item.name} (döndürülmüş)` : item.name,
          withCuttingMarks: true,
          withMargins: { width: item.width, height: item.height }
        }))
      });
    }

    // 3. En iyi sonucu seç
    const bestLayout = layoutResults.reduce((best, current) => 
      current.efficiency > best.efficiency ? current : best
    );

    // 4. AI önerileri oluştur
    const aiRecommendations = await this.generateLayoutRecommendations(
      analyzedDesigns, 
      bestLayout, 
      sheetSettings
    );

    return {
      arrangements: bestLayout.arrangements,
      efficiency: bestLayout.efficiency,
      aiRecommendations,
      alternativeLayouts: layoutResults.filter(r => r.name !== bestLayout.name),
      optimizationScore: this.calculateOptimizationScore(bestLayout, analyzedDesigns)
    };
  }

  // AI önerileri oluştur
  private async generateLayoutRecommendations(
    designs: DesignAnalysis[],
    layout: any,
    sheetSettings: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Verimlilik analizi
    if (layout.efficiency > 85) {
      recommendations.push(`🎯 Mükemmel verimlilik: %${layout.efficiency.toFixed(1)} alan kullanımı`);
    } else if (layout.efficiency > 70) {
      recommendations.push(`✅ İyi verimlilik: %${layout.efficiency.toFixed(1)} alan kullanımı`);
    } else {
      recommendations.push(`⚠️ Düşük verimlilik: %${layout.efficiency.toFixed(1)} - daha büyük sayfa öneriliyor`);
    }

    // Döndürme analizi
    const rotatedItems = layout.arrangements.filter((a: any) => a.rotation === 90).length;
    if (rotatedItems > 0) {
      recommendations.push(`🔄 ${rotatedItems} tasarım verimlilik için döndürüldü`);
    }

    // Gruplama analizi
    const groupedDesigns = this.analyzeGrouping(designs, layout.arrangements);
    if (groupedDesigns.wellGrouped > 0) {
      recommendations.push(`📦 ${groupedDesigns.wellGrouped} benzer tasarım birlikte yerleştirildi`);
    }

    // Boyut önerileri
    if (layout.efficiency < 60) {
      const optimalSize = this.suggestOptimalSheetSize(designs);
      recommendations.push(`📏 Önerilen sayfa boyutu: ${optimalSize.width}×${optimalSize.height}mm`);
    }

    return recommendations;
  }

  // Basit analiz (AI olmadan)
  private basicAnalysis(designs: any[]): DesignAnalysis[] {
    return designs.map(design => {
      let width = 50, height = 30;
      if (design.realDimensionsMM && design.realDimensionsMM !== 'Boyut tespit edilemedi') {
        const match = design.realDimensionsMM.match(/(\d+)x(\d+)mm/i);
        if (match) {
          width = parseInt(match[1]);
          height = parseInt(match[2]);
        }
      }

      const aspectRatio = width / height;
      const area = width * height;

      return {
        id: design.id,
        name: design.originalName || design.name,
        width,
        height,
        aspectRatio,
        category: aspectRatio > 2 ? 'text-heavy' : area > 2000 ? 'complex-graphic' : 'simple-shape',
        priority: area > 2000 ? 'high' : 'medium',
        rotationRecommendation: aspectRatio > 1.5 || aspectRatio < 0.7,
        groupingTags: [design.name.includes('logo') ? 'logo' : 'general']
      };
    });
  }

  private sortDesignsByStrategy(designs: DesignAnalysis[], strategy: string): DesignAnalysis[] {
    switch (strategy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return [...designs].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      
      case 'grouping':
        return [...designs].sort((a, b) => {
          const aGroup = a.groupingTags[0] || 'z';
          const bGroup = b.groupingTags[0] || 'z';
          return aGroup.localeCompare(bGroup);
        });
      
      case 'size':
        return [...designs].sort((a, b) => (b.width * b.height) - (a.width * a.height));
      
      case 'rotation':
        return [...designs].sort((a, b) => Number(b.rotationRecommendation) - Number(a.rotationRecommendation));
      
      default:
        return designs;
    }
  }

  private getStrategyDescription(strategy: string): string {
    const descriptions = {
      priority: 'Yüksek öncelikli tasarımlar önce yerleştirildi',
      grouping: 'Benzer tasarımlar birlikte gruplandı',
      size: 'Büyük tasarımlar önce yerleştirildi',
      rotation: 'Döndürme gereken tasarımlar optimize edildi'
    };
    return descriptions[strategy] || 'Standart optimizasyon';
  }

  private analyzeGrouping(designs: DesignAnalysis[], arrangements: any[]): { wellGrouped: number } {
    // Basit gruplama analizi - aynı etiketli tasarımların yakınlığını kontrol et
    let wellGrouped = 0;
    const groupTolerance = 100; // mm

    for (let i = 0; i < arrangements.length; i++) {
      for (let j = i + 1; j < arrangements.length; j++) {
        const design1 = designs.find(d => d.id === arrangements[i].designId);
        const design2 = designs.find(d => d.id === arrangements[j].designId);
        
        if (design1 && design2) {
          const hasCommonTag = design1.groupingTags.some(tag => design2.groupingTags.includes(tag));
          const distance = Math.sqrt(
            Math.pow(arrangements[i].x - arrangements[j].x, 2) + 
            Math.pow(arrangements[i].y - arrangements[j].y, 2)
          );
          
          if (hasCommonTag && distance < groupTolerance) {
            wellGrouped++;
          }
        }
      }
    }

    return { wellGrouped };
  }

  private suggestOptimalSheetSize(designs: DesignAnalysis[]): { width: number; height: number } {
    const totalArea = designs.reduce((sum, d) => sum + (d.width * d.height), 0);
    const optimalArea = totalArea * 1.3; // %30 boşluk için
    
    // Standart sayfa boyutları
    const standardSizes = [
      { width: 210, height: 297, name: 'A4' },
      { width: 330, height: 480, name: 'A3' },
      { width: 480, height: 640, name: 'A2' }
    ];

    return standardSizes.find(size => size.width * size.height >= optimalArea) || standardSizes[2];
  }

  private calculateOptimizationScore(layout: any, designs: DesignAnalysis[]): number {
    let score = layout.efficiency; // Temel verimlilik skoru

    // AI önerilerine uyma bonusu
    const rotationBonus = layout.arrangements.filter((a: any) => {
      const design = designs.find(d => d.id === a.designId);
      return design?.rotationRecommendation === (a.rotation === 90);
    }).length * 5;

    return Math.min(100, score + rotationBonus);
  }
}

export const aiLayoutOptimizer = new AILayoutOptimizer();
export { DesignAnalysis, LayoutOptimizationResult };
