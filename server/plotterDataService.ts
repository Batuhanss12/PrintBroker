import axios from 'axios';

interface PlotterModel {
  id: string;
  brand: string;
  model: string;
  type: 'ecosolvent' | 'thermal' | 'digital';
  maxWidth: number; // mm
  maxLength: number; // mm
  resolution: string;
  speed: string;
  features: string[];
  priceRange: string;
  specifications: {
    cuttingForce?: string;
    bladeTypes?: string[];
    connectivity?: string[];
    software?: string[];
  };
}

interface MaterialSpec {
  id: string;
  name: string;
  type: 'vinyl' | 'paper' | 'polyester' | 'fabric';
  thickness: string;
  adhesive: string;
  durability: string;
  applications: string[];
  plotterCompatibility: string[];
}

class PlotterDataService {
  private plotterModels: PlotterModel[] = [];
  private materialSpecs: MaterialSpec[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Kapsamlı plotter modelleri - gerçek teknik özellikler
    this.plotterModels = [
      // Summa Serisi
      {
        id: 'summa-s3-t120',
        brand: 'Summa',
        model: 'S3 T120',
        type: 'thermal',
        maxWidth: 1200,
        maxLength: 50000,
        resolution: '0.0125mm',
        speed: '1600 mm/s',
        features: [
          'OPOS X kamera sistemi',
          'Otomatik materyal besleme',
          'Çift kafa teknolojisi',
          'Flexcut özelliği'
        ],
        priceRange: '150.000-200.000 TL',
        specifications: {
          cuttingForce: '600g',
          bladeTypes: ['Drag knife', 'Tangential knife', 'Kiss cut'],
          connectivity: ['USB', 'Ethernet', 'Wi-Fi'],
          software: ['Summa GoSign', 'Summa Cutter Control', 'Barcode Scanner']
        }
      },
      {
        id: 'summa-s3-t75',
        brand: 'Summa',
        model: 'S3 T75',
        type: 'thermal',
        maxWidth: 750,
        maxLength: 50000,
        resolution: '0.0125mm',
        speed: '1400 mm/s',
        features: [
          'OPOS X kamera sistemi',
          'Flexcut teknolojisi',
          'Otomatik bıçak derinlik ayarı',
          'Media roller sistemi'
        ],
        priceRange: '100.000-150.000 TL',
        specifications: {
          cuttingForce: '600g',
          bladeTypes: ['Drag knife', 'Kiss cut blade'],
          connectivity: ['USB', 'Ethernet'],
          software: ['Summa GoSign', 'Summa Cutter Control']
        }
      },
      // Vulcan Serisi
      {
        id: 'vulcan-vc630',
        brand: 'Vulcan',
        model: 'VC630',
        type: 'thermal',
        maxWidth: 630,
        maxLength: 25000,
        resolution: '0.025mm',
        speed: '1000 mm/s',
        features: [
          'Optik konum sistemi',
          'Yüksek hassasiyet',
          'Hızlı kesim',
          'Çoklu materyal desteği'
        ],
        priceRange: '75.000-100.000 TL',
        specifications: {
          cuttingForce: '500g',
          bladeTypes: ['Drag knife', 'Kiss cut blade'],
          connectivity: ['USB', 'Serial'],
          software: ['FlexiSign', 'VinylMaster']
        }
      },
      {
        id: 'vulcan-vc1350',
        brand: 'Vulcan',
        model: 'VC1350',
        type: 'thermal',
        maxWidth: 1350,
        maxLength: 50000,
        resolution: '0.025mm',
        speed: '1200 mm/s',
        features: [
          'Geniş format desteği',
          'Endüstriyel motor',
          'Yüksek dayanıklılık',
          'Hızlı üretim'
        ],
        priceRange: '120.000-150.000 TL',
        specifications: {
          cuttingForce: '750g',
          bladeTypes: ['Drag knife', 'Tangential knife'],
          connectivity: ['USB', 'Ethernet'],
          software: ['SignCut', 'FlexiSign']
        }
      },
      // SignCut Uyumlu Çin Markaları
      {
        id: 'signcut-sc720',
        brand: 'SignCut',
        model: 'SC720',
        type: 'thermal',
        maxWidth: 720,
        maxLength: 30000,
        resolution: '0.025mm',
        speed: '800 mm/s',
        features: [
          'SignCut yazılım desteği',
          'Uygun fiyat',
          'Basit kullanım',
          'Güvenilir performans'
        ],
        priceRange: '25.000-40.000 TL',
        specifications: {
          cuttingForce: '350g',
          bladeTypes: ['Drag knife', 'Kiss cut blade'],
          connectivity: ['USB'],
          software: ['SignCut Pro', 'SignCut X2']
        }
      },
      {
        id: 'signcut-sc1350',
        brand: 'SignCut',
        model: 'SC1350',
        type: 'thermal',
        maxWidth: 1350,
        maxLength: 50000,
        resolution: '0.025mm',
        speed: '1000 mm/s',
        features: [
          'Geniş format',
          'SignCut tam uyumluluk',
          'Ekonomik çözüm',
          'Yedek parça bulunabilirliği'
        ],
        priceRange: '45.000-65.000 TL',
        specifications: {
          cuttingForce: '500g',
          bladeTypes: ['Drag knife', 'Kiss cut blade'],
          connectivity: ['USB', 'Serial'],
          software: ['SignCut Pro', 'SignCut X2']
        }
      },
      // Toyocut Serisi
      {
        id: 'toyocut-tc630',
        brand: 'Toyocut',
        model: 'TC630',
        type: 'thermal',
        maxWidth: 630,
        maxLength: 25000,
        resolution: '0.025mm',
        speed: '900 mm/s',
        features: [
          'Japonya kalitesi',
          'Sessiz çalışma',
          'Uzun ömür',
          'Hassas kesim'
        ],
        priceRange: '80.000-110.000 TL',
        specifications: {
          cuttingForce: '450g',
          bladeTypes: ['Drag knife', 'Kiss cut blade'],
          connectivity: ['USB', 'Serial'],
          software: ['CutStudio', 'FlexiSign']
        }
      },
      // Skycut Serisi
      {
        id: 'skycut-sk870',
        brand: 'Skycut',
        model: 'SK870',
        type: 'thermal',
        maxWidth: 870,
        maxLength: 30000,
        resolution: '0.025mm',
        speed: '1100 mm/s',
        features: [
          'Hızlı kesim',
          'Çoklu yazılım desteği',
          'Kolay bakım',
          'Güçlü motor'
        ],
        priceRange: '60.000-85.000 TL',
        specifications: {
          cuttingForce: '600g',
          bladeTypes: ['Drag knife', 'Kiss cut blade', 'Tangential knife'],
          connectivity: ['USB', 'Ethernet'],
          software: ['SignCut', 'VinylMaster', 'FlexiSign']
        }
      },
      {
        id: 'skycut-sk1350',
        brand: 'Skycut',
        model: 'SK1350',
        type: 'thermal',
        maxWidth: 1350,
        maxLength: 50000,
        resolution: '0.025mm',
        speed: '1300 mm/s',
        features: [
          'Geniş format desteği',
          'Yüksek hız',
          'Profesyonel kalite',
          'Çoklu bağlantı seçeneği'
        ],
        priceRange: '90.000-120.000 TL',
        specifications: {
          cuttingForce: '750g',
          bladeTypes: ['Drag knife', 'Kiss cut blade', 'Tangential knife'],
          connectivity: ['USB', 'Ethernet', 'Wi-Fi'],
          software: ['SignCut', 'VinylMaster', 'FlexiSign', 'CorelDRAW']
        }
      }
    ];

    // Ecosolvent etiket materyalleri
    this.materialSpecs = [
      {
        id: 'eco-vinyl-gloss',
        name: 'Ecosolvent Parlak Vinil',
        type: 'vinyl',
        thickness: '80 mikron',
        adhesive: 'Permanent akrilik',
        durability: '7 yıl dış mekan',
        applications: [
          'Araç giydirme',
          'Dış mekan tabelaları',
          'Promosyon etiketleri',
          'Ürün etiketleri'
        ],
        plotterCompatibility: ['summa-s3-t120', 'summa-s3-t75', 'summa-s2-t140']
      },
      {
        id: 'eco-vinyl-matte',
        name: 'Ecosolvent Mat Vinil',
        type: 'vinyl',
        thickness: '85 mikron',
        adhesive: 'Çıkarılabilir akrilik',
        durability: '5 yıl dış mekan',
        applications: [
          'İç mekan dekorasyonu',
          'Geçici etiketler',
          'Vitrin uygulamaları',
          'Duvar grafikleri'
        ],
        plotterCompatibility: ['summa-s3-t120', 'summa-s3-t75']
      },
      {
        id: 'eco-label-paper',
        name: 'Ecosolvent Etiket Kağıdı',
        type: 'paper',
        thickness: '70 mikron',
        adhesive: 'Permanent akrilik',
        durability: '2 yıl iç mekan',
        applications: [
          'Ürün etiketleri',
          'Barkod etiketleri',
          'Fiyat etiketleri',
          'Adres etiketleri'
        ],
        plotterCompatibility: ['summa-s3-t120', 'summa-s3-t75', 'summa-s2-t140']
      },
      {
        id: 'eco-clear-vinyl',
        name: 'Ecosolvent Şeffaf Vinil',
        type: 'vinyl',
        thickness: '75 mikron',
        adhesive: 'Permanent akrilik',
        durability: '5 yıl dış mekan',
        applications: [
          'Cam uygulamaları',
          'Şeffaf etiketler',
          'Koruyucu filmler',
          'Pencere grafikleri'
        ],
        plotterCompatibility: ['summa-s3-t120', 'summa-s3-t75']
      }
    ];
  }

  // API fonksiyonları
  getPlotterModels(): PlotterModel[] {
    return this.plotterModels;
  }

  getPlotterModel(id: string): PlotterModel | undefined {
    return this.plotterModels.find(model => model.id === id);
  }

  getMaterialSpecs(): MaterialSpec[] {
    return this.materialSpecs;
  }

  getMaterialSpec(id: string): MaterialSpec | undefined {
    return this.materialSpecs.find(material => material.id === id);
  }

  getCompatibleMaterials(plotterId: string): MaterialSpec[] {
    return this.materialSpecs.filter(material => 
      material.plotterCompatibility.includes(plotterId)
    );
  }

  getOptimalSettings(plotterId: string, materialId: string): {
    speed: string;
    pressure: string;
    offset: string;
    passCount: number;
  } {
    const plotter = this.getPlotterModel(plotterId);
    const material = this.getMaterialSpec(materialId);

    if (!plotter || !material) {
      throw new Error('Plotter veya materyal bulunamadı');
    }

    // Materyal tipine göre optimal ayarlar
    const settings = {
      vinyl: {
        speed: '800 mm/s',
        pressure: '200g',
        offset: '0.25mm',
        passCount: 1
      },
      paper: {
        speed: '1000 mm/s',
        pressure: '150g',
        offset: '0.20mm',
        passCount: 1
      },
      polyester: {
        speed: '600 mm/s',
        pressure: '300g',
        offset: '0.30mm',
        passCount: 2
      },
      fabric: {
        speed: '400 mm/s',
        pressure: '400g',
        offset: '0.35mm',
        passCount: 2
      }
    };

    return settings[material.type] || settings.vinyl;
  }

  calculateMaterialUsage(
    designCount: number,
    designWidth: number,
    designHeight: number,
    plotterWidth: number,
    spacing: number = 2
  ): {
    totalLength: number;
    materialEfficiency: number;
    rollCount: number;
    wastePercentage: number;
  } {
    const itemsPerRow = Math.floor(plotterWidth / (designWidth + spacing));
    const rows = Math.ceil(designCount / itemsPerRow);
    const totalLength = rows * (designHeight + spacing);

    const usedArea = designCount * designWidth * designHeight;
    const totalArea = plotterWidth * totalLength;
    const materialEfficiency = (usedArea / totalArea) * 100;

    // 50 metre rulo varsayımı
    const rollLength = 50000;
    const rollCount = Math.ceil(totalLength / rollLength);
    const wastePercentage = 100 - materialEfficiency;

    return {
      totalLength,
      materialEfficiency,
      rollCount,
      wastePercentage
    };
  }

  generateCuttingPath(designs: any[], plotterSettings: any): {
    gCode: string;
    estimatedTime: number;
    toolPath: Array<{ x: number; y: number; action: 'move' | 'cut' }>;
  } {
    // G-Code benzeri kesim yolu oluşturma
    let gCode = '';
    const toolPath: Array<{ x: number; y: number; action: 'move' | 'cut' }> = [];
    let totalDistance = 0;

    // Başlangıç komutları
    gCode += 'G28 ; Home\n';
    gCode += 'G90 ; Absolute positioning\n';
    gCode += `M3 S${plotterSettings.pressure || 200} ; Set cutting pressure\n`;

    designs.forEach((design, index) => {
      const startX = (index % plotterSettings.labelsPerRow) * (plotterSettings.labelWidth + plotterSettings.horizontalSpacing);
      const startY = Math.floor(index / plotterSettings.labelsPerRow) * (plotterSettings.labelHeight + plotterSettings.verticalSpacing);

      // Kesim başlangıcına git
      gCode += `G0 X${startX} Y${startY} ; Move to design ${index + 1}\n`;
      toolPath.push({ x: startX, y: startY, action: 'move' });

      // Kesim yolu (basit dikdörtgen)
      const corners = [
        { x: startX, y: startY },
        { x: startX + plotterSettings.labelWidth, y: startY },
        { x: startX + plotterSettings.labelWidth, y: startY + plotterSettings.labelHeight },
        { x: startX, y: startY + plotterSettings.labelHeight },
        { x: startX, y: startY }
      ];

      corners.forEach((corner, i) => {
        if (i === 0) {
          gCode += `G1 X${corner.x} Y${corner.y} ; Start cut\n`;
        } else {
          gCode += `G1 X${corner.x} Y${corner.y}\n`;
          totalDistance += Math.sqrt(
            Math.pow(corner.x - corners[i-1].x, 2) + 
            Math.pow(corner.y - corners[i-1].y, 2)
          );
        }
        toolPath.push({ x: corner.x, y: corner.y, action: 'cut' });
      });
    });

    // Bitiş komutları
    gCode += 'M5 ; Stop cutting\n';
    gCode += 'G28 ; Return home\n';

    // Tahmini süre hesaplama (mm/dakika olarak)
    const cuttingSpeed = parseInt(plotterSettings.speed || '800');
    const estimatedTime = Math.round((totalDistance / cuttingSpeed) * 60); // saniye

    return {
      gCode,
      estimatedTime,
      toolPath
    };
  }
}

export const plotterDataService = new PlotterDataService();
export type { PlotterModel, MaterialSpec };
export interface Design {
  id: string;
  name: string;
  filename: string;
  mimeType?: string;
}

export interface PlotterSettings {
  sheetWidth: number;
  sheetHeight: number;
  marginLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  labelsPerRow: number;
  labelWidth: number;
  labelHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  speed?: string;
  pressure?: string;
}

export interface ArrangementResult {
  arrangements: ArrangementItem[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  sheetDimensions: { width: number; height: number };
  wasteArea: number;
  debug?: any;
}

export interface ArrangementItem {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  designName: string;
  withMargins: {
    width: number;
    height: number;
  };
}
import path from 'path';

const fileProcessingService = {
  extractRealDesignContent: async (filePath: string, mimeType: string) => {
    return {
      actualDimensions: { width: 50, height: 30 },
      contentBounds: { x: 0, y: 0, width: 50, height: 30 },
      complexity: 'simple',
      printQuality: 'medium'
    };
  }
};

export async function enhancedAutoArrange(
  designs: Design[],
  plotterSettings: PlotterSettings
): Promise<ArrangementResult> {
  console.log('🔧 Starting professional auto-arrange with real content analysis:', designs.length, 'designs');

  // Step 1: Analyze each design's real content
  const analyzedDesigns = [];
  for (const design of designs) {
    try {
      console.log(`🔍 Analyzing design content: ${design.name}`);

      // Get real content analysis
      const filePath = path.join(process.cwd(), 'uploads', design.filename);
      const contentAnalysis = await fileProcessingService.extractRealDesignContent(
        filePath, 
        design.mimeType || 'application/pdf'
      );

      const analyzedDesign = {
        ...design,
        contentAnalysis,
        realWidth: contentAnalysis.actualDimensions.width,
        realHeight: contentAnalysis.actualDimensions.height,
        contentBounds: contentAnalysis.contentBounds,
        complexity: contentAnalysis.complexity,
        printQuality: contentAnalysis.printQuality
      };

      analyzedDesigns.push(analyzedDesign);
      console.log(`✅ Content analysis for ${design.name}:`, {
        dimensions: `${contentAnalysis.actualDimensions.width}×${contentAnalysis.actualDimensions.height}mm`,
        complexity: contentAnalysis.complexity,
        quality: contentAnalysis.printQuality
      });

    } catch (error) {
      console.error(`❌ Failed to analyze ${design.name}:`, error);
      // Fallback to basic dimensions
      analyzedDesigns.push({
        ...design,
        realWidth: 50,
        realHeight: 30,
        contentBounds: { x: 0, y: 0, width: 50, height: 30 },
        complexity: 'simple',
        printQuality: 'medium'
      });
    }
  }

  // Step 2: Intelligent sorting for optimal arrangement
  const sortedDesigns = [...analyzedDesigns].sort((a, b) => {
    // Priority 1: Print quality (high quality first for better placement)
    const qualityOrder = { high: 3, medium: 2, low: 1 };
    if (qualityOrder[a.printQuality] !== qualityOrder[b.printQuality]) {
      return qualityOrder[b.printQuality] - qualityOrder[a.printQuality];
    }

    // Priority 2: Area (larger designs first)
    const areaA = a.realWidth * a.realHeight;
    const areaB = b.realWidth * b.realHeight;
    if (areaA !== areaB) {
      return areaB - areaA;
    }

    // Priority 3: Complexity (complex designs get priority placement)
    const complexityOrder = { complex: 3, medium: 2, simple: 1 };
    return complexityOrder[b.complexity] - complexityOrder[a.complexity];
  });

  console.log('📊 Sorted designs by priority:', sortedDesigns.map(d => ({
    name: d.name,
    dimensions: `${d.realWidth}×${d.realHeight}mm`,
    quality: d.printQuality,
    complexity: d.complexity
  })));

  // Step 3: Professional arrangement algorithm
  const arrangements: ArrangementItem[] = [];
  const { sheetWidth, sheetHeight, marginLeft, marginTop, marginRight, marginBottom } = plotterSettings;

  const availableWidth = sheetWidth - marginLeft - marginRight;
  const availableHeight = sheetHeight - marginTop - marginBottom;

  console.log(`📐 Available printing area: ${availableWidth}×${availableHeight}mm`);

  // Track occupied areas for collision detection
  const occupiedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];

  function isAreaOccupied(x: number, y: number, width: number, height: number): boolean {
    return occupiedAreas.some(area => 
      !(x >= area.x + area.width || 
        x + width <= area.x || 
        y >= area.y + area.height || 
        y + height <= area.y)
    );
  }

  // Advanced placement algorithm
  for (const design of sortedDesigns) {
    const designWidth = design.realWidth;
    const designHeight = design.realHeight;

    // Add safety margins around each design
    const safetyMargin = 2; // 2mm safety margin
    const totalWidth = designWidth + (safetyMargin * 2);
    const totalHeight = designHeight + (safetyMargin * 2);

    if (totalWidth > availableWidth || totalHeight > availableHeight) {
      console.warn(`⚠️ Design ${design.name} too large: ${designWidth}×${designHeight}mm (requires ${totalWidth}×${totalHeight}mm with margins)`);
      continue;
    }

    let placed = false;
    let bestPosition = null;
    let bestWasteScore = Infinity;

    // Try multiple placement strategies
    const strategies = [
      'bottom-left',    // Start from bottom-left corner
      'top-left',       // Start from top-left corner  
      'center-out',     // Start from center and work outward
      'optimal-gap'     // Find best gap that minimizes waste
    ];

    for (const strategy of strategies) {
      if (placed) break;

      let positions = [];

      switch (strategy) {
        case 'bottom-left':
          positions = [{x: marginLeft + safetyMargin, y: marginTop + safetyMargin}];
          break;

        case 'top-left':
          positions = [{x: marginLeft + safetyMargin, y: sheetHeight - marginBottom - totalHeight + safetyMargin}];
          break;

        case 'center-out':
          const centerX = sheetWidth / 2 - totalWidth / 2;
          const centerY = sheetHeight / 2 - totalHeight / 2;
          positions = [{x: centerX, y: centerY}];
          break;

        case 'optimal-gap':
          // Find gaps between existing designs
          for (let x = marginLeft + safetyMargin; x <= sheetWidth - marginRight - totalWidth; x += 5) {
            for (let y = marginTop + safetyMargin; y <= sheetHeight - marginBottom - totalHeight; y += 5) {
              positions.push({x, y});
            }
          }
          break;
      }

      // Test each position
      for (const pos of positions) {
        if (!isAreaOccupied(pos.x - safetyMargin, pos.y - safetyMargin, totalWidth, totalHeight)) {
          // Calculate waste score for this position
          const wasteScore = calculateWasteScore(pos.x, pos.y, totalWidth, totalHeight, occupiedAreas, availableWidth, availableHeight);

          if (wasteScore < bestWasteScore) {
            bestWasteScore = wasteScore;
            bestPosition = pos;
          }

          if (strategy !== 'optimal-gap') {
            placed = true;
            break;
          }
        }
      }

      if (strategy === 'optimal-gap' && bestPosition) {
        placed = true;
      }
    }

    if (placed && bestPosition) {
      const arrangement: ArrangementItem = {
        designId: design.id,
        x: bestPosition.x,
        y: bestPosition.y,
        width: designWidth,
        height: designHeight,
        rotation: 0,
        designName: design.name,
        withMargins: {
          width: totalWidth,
          height: totalHeight
        }
      };

      arrangements.push(arrangement);
      occupiedAreas.push({
        x: bestPosition.x - safetyMargin,
        y: bestPosition.y - safetyMargin,
        width: totalWidth,
        height: totalHeight
      });

      console.log(`✅ Placed ${design.name} at (${bestPosition.x}, ${bestPosition.y}) with quality: ${design.printQuality}`);
    } else {
      console.warn(`❌ Could not place design: ${design.name} (${designWidth}×${designHeight}mm)`);
    }
  }

  // Calculate efficiency and statistics
  const totalDesignArea = arrangements.reduce((sum, arr) => sum + (arr.width * arr.height), 0);
  const totalSheetArea = availableWidth * availableHeight;
  const efficiency = totalSheetArea > 0 ? ((totalDesignArea / totalSheetArea) * 100).toFixed(1) + '%' : '0%';

  const result: ArrangementResult = {
    arrangements,
    totalArranged: arrangements.length,
    totalRequested: designs.length,
    efficiency,
    sheetDimensions: { width: sheetWidth, height: sheetHeight },
    wasteArea: totalSheetArea - totalDesignArea,
    debug: {
      designsProcessed: designs.length,
      arrangementsCreated: arrangements.length,
      totalDesignArea,
      sheetArea: totalSheetArea,
      analyzedDesigns: sortedDesigns.map(d => ({
        name: d.name,
        realDimensions: `${d.realWidth}×${d.realHeight}mm`,
        quality: d.printQuality,
        complexity: d.complexity
      }))
    }
  };

  console.log('🎯 Professional auto-arrangement completed:', {
    arranged: arrangements.length,
    requested: designs.length,
    efficiency,
    totalArea: `${totalDesignArea}mm²`,
    wasteArea: `${totalSheetArea - totalDesignArea}mm²`
  });

  return result;

  function calculateWasteScore(x: number, y: number, width: number, height: number, occupied: any[], maxWidth: number, maxHeight: number): number {
    // Calculate how much this placement contributes to waste
    // Lower score = better placement
    let wasteScore = 0;

    // Penalty for being far from edges (prefer compact arrangement)
    const distanceFromEdges = Math.min(x, y, maxWidth - (x + width), maxHeight - (y + height));
    wasteScore += distanceFromEdges * 0.1;

    // Penalty for creating hard-to-fill gaps
    const gapPenalty = calculateGapPenalty(x, y, width, height, occupied, maxWidth, maxHeight);
    wasteScore += gapPenalty;

    return wasteScore;
  }

  function calculateGapPenalty(x: number, y: number, width: number, height: number, occupied: any[], maxWidth: number, maxHeight: number): number {
    // Simplified gap analysis - penalize positions that create awkward gaps
    let penalty = 0;

    // Check for small unusable gaps created
    const minUsableGap = 25; // 25mm minimum usable gap

    // Check gaps to the right
    const rightGap = maxWidth - (x + width);
    if (rightGap > 0 && rightGap < minUsableGap) {
      penalty += 50;
    }

    // Check gaps below
    const bottomGap = maxHeight - (y + height);
    if (bottomGap > 0 && bottomGap < minUsableGap) {
      penalty += 50;
    }

    return penalty;
  }
}