interface DesignItem {
  id: string;
  width: number;
  height: number;
  name: string;
  canRotate?: boolean;
}

interface PlacedItem extends DesignItem {
  x: number;
  y: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
}

interface LayoutSettings {
  sheetWidth: number;
  sheetHeight: number;
  margin: number;
  spacing: number;
  allowRotation: boolean;
  optimizeForWaste: boolean;
}

export class AdvancedLayoutEngine {
  private occupiedAreas: Array<{x: number, y: number, width: number, height: number}> = [];

  private isAreaOccupied(x: number, y: number, width: number, height: number): boolean {
    return this.occupiedAreas.some(area => 
      !(x >= area.x + area.width || 
        x + width <= area.x || 
        y >= area.y + area.height || 
        y + height <= area.y)
    );
  }

  private addOccupiedArea(x: number, y: number, width: number, height: number): void {
    this.occupiedAreas.push({ x, y, width, height });
  }

  private findOptimalPosition(
    item: DesignItem,
    settings: LayoutSettings,
    rotation: number = 0
  ): { x: number; y: number; found: boolean } {
    const itemWidth = rotation === 90 ? item.height : item.width;
    const itemHeight = rotation === 90 ? item.width : item.height;
    
    const maxX = settings.sheetWidth - settings.margin - itemWidth;
    const maxY = settings.sheetHeight - settings.margin - itemHeight;
    
    // Grid-based positioning for better packing
    const gridSize = Math.min(5, settings.spacing);
    
    for (let y = settings.margin; y <= maxY; y += gridSize) {
      for (let x = settings.margin; x <= maxX; x += gridSize) {
        if (!this.isAreaOccupied(x - settings.spacing, y - settings.spacing, 
                                 itemWidth + 2 * settings.spacing, 
                                 itemHeight + 2 * settings.spacing)) {
          return { x, y, found: true };
        }
      }
    }
    
    return { x: 0, y: 0, found: false };
  }

  private calculateWasteScore(
    item: DesignItem,
    x: number,
    y: number,
    rotation: number,
    settings: LayoutSettings
  ): number {
    const itemWidth = rotation === 90 ? item.height : item.width;
    const itemHeight = rotation === 90 ? item.width : item.height;
    
    // Calculate space utilization in surrounding area
    const checkRadius = 50; // mm
    const checkArea = Math.PI * checkRadius * checkRadius;
    
    // Simplified waste calculation - distance from edges
    const edgeDistanceX = Math.min(x - settings.margin, settings.sheetWidth - x - itemWidth - settings.margin);
    const edgeDistanceY = Math.min(y - settings.margin, settings.sheetHeight - y - itemHeight - settings.margin);
    
    return Math.max(0, Math.min(edgeDistanceX, edgeDistanceY));
  }

  public generateOptimalLayout(designs: DesignItem[], settings: LayoutSettings): {
    arrangements: PlacedItem[];
    efficiency: number;
    totalArranged: number;
    statistics: {
      rotatedItems: number;
      wasteArea: number;
      utilizationRate: number;
    };
  } {
    this.occupiedAreas = [];
    const arrangements: PlacedItem[] = [];
    let rotatedItems = 0;

    // Sort designs by area (largest first) for better packing
    const sortedDesigns = [...designs].sort((a, b) => (b.width * b.height) - (a.width * a.height));

    for (const design of sortedDesigns) {
      let placed = false;
      let bestPosition: { x: number; y: number; rotation: number; score: number } | null = null;

      // Try normal orientation
      const normalPos = this.findOptimalPosition(design, settings, 0);
      if (normalPos.found) {
        const wasteScore = this.calculateWasteScore(design, normalPos.x, normalPos.y, 0, settings);
        bestPosition = { ...normalPos, rotation: 0, score: wasteScore };
      }

      // Try rotated orientation if allowed
      if (settings.allowRotation && design.canRotate !== false) {
        const rotatedPos = this.findOptimalPosition(design, settings, 90);
        if (rotatedPos.found) {
          const wasteScore = this.calculateWasteScore(design, rotatedPos.x, rotatedPos.y, 90, settings);
          if (!bestPosition || wasteScore > bestPosition.score) {
            bestPosition = { ...rotatedPos, rotation: 90, score: wasteScore };
          }
        }
      }

      if (bestPosition) {
        const itemWidth = bestPosition.rotation === 90 ? design.height : design.width;
        const itemHeight = bestPosition.rotation === 90 ? design.width : design.height;
        
        const placedItem: PlacedItem = {
          ...design,
          x: bestPosition.x,
          y: bestPosition.y,
          rotation: bestPosition.rotation,
          originalWidth: design.width,
          originalHeight: design.height,
          width: itemWidth,
          height: itemHeight
        };

        arrangements.push(placedItem);
        this.addOccupiedArea(
          bestPosition.x - settings.spacing,
          bestPosition.y - settings.spacing,
          itemWidth + 2 * settings.spacing,
          itemHeight + 2 * settings.spacing
        );

        if (bestPosition.rotation === 90) {
          rotatedItems++;
        }
        placed = true;
      }

      if (!placed) {
        console.log(`⚠️ Could not place design: ${design.name} (${design.width}x${design.height}mm)`);
      }
    }

    // Calculate statistics
    const totalDesignArea = arrangements.reduce((sum, item) => 
      sum + (item.originalWidth * item.originalHeight), 0);
    const sheetArea = settings.sheetWidth * settings.sheetHeight;
    const efficiency = (totalDesignArea / sheetArea) * 100;
    const wasteArea = sheetArea - totalDesignArea;

    return {
      arrangements,
      efficiency: Math.round(efficiency * 100) / 100,
      totalArranged: arrangements.length,
      statistics: {
        rotatedItems,
        wasteArea,
        utilizationRate: Math.round((arrangements.length / designs.length) * 100)
      }
    };
  }

  public optimizeLayout(
    designs: DesignItem[],
    settings: LayoutSettings,
    maxIterations: number = 3
  ): ReturnType<typeof this.generateOptimalLayout> {
    let bestResult = this.generateOptimalLayout(designs, settings);

    // Try different approaches for optimization
    for (let i = 0; i < maxIterations; i++) {
      // Shuffle designs for different placement order
      const shuffledDesigns = [...designs].sort(() => Math.random() - 0.5);
      const currentResult = this.generateOptimalLayout(shuffledDesigns, settings);
      
      if (currentResult.efficiency > bestResult.efficiency) {
        bestResult = currentResult;
      }
    }

    return bestResult;
  }
}

export const advancedLayoutEngine = new AdvancedLayoutEngine();