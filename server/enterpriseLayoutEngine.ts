import * as fs from 'fs';
import * as path from 'path';

interface DesignItem {
  id: string;
  name: string;
  width: number;  // mm
  height: number; // mm
  filePath: string;
  canRotate: boolean;
}

interface PlacedDesign extends DesignItem {
  x: number;
  y: number;
  rotation: number; // 0 or 90
}

interface LayoutSettings {
  sheetWidth: number;   // mm (330)
  sheetHeight: number;  // mm (480)
  margin: number;       // mm (10)
  bleedMargin: number;  // mm (3)
  spacing: number;      // mm (5)
}

interface LayoutResult {
  success: boolean;
  placements: PlacedDesign[];
  efficiency: number;
  wasteArea: number;
  totalDesigns: number;
  placedDesigns: number;
  statistics: {
    totalArea: number;
    usedArea: number;
    wastePercentage: number;
  };
  message?: string;
}

export class EnterpriseLayoutEngine {
  
  async generateOptimalLayout(
    designs: DesignItem[], 
    settings: LayoutSettings
  ): Promise<LayoutResult> {
    console.log('🏭 Enterprise Layout Engine - Processing', designs.length, 'designs');
    
    if (!designs || designs.length === 0) {
      return {
        success: false,
        placements: [],
        efficiency: 0,
        wasteArea: 0,
        totalDesigns: 0,
        placedDesigns: 0,
        statistics: { totalArea: 0, usedArea: 0, wastePercentage: 100 },
        message: 'No designs provided'
      };
    }

    const placements: PlacedDesign[] = [];
    const usableWidth = settings.sheetWidth - (2 * settings.margin);
    const usableHeight = settings.sheetHeight - (2 * settings.margin);
    
    console.log(`📐 Usable area: ${usableWidth}x${usableHeight}mm`);

    // Sort designs by area (largest first) for better space utilization
    const sortedDesigns = [...designs].sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    // Simple but effective placement algorithm
    let currentX = settings.margin;
    let currentY = settings.margin;
    let rowHeight = 0;

    for (const design of sortedDesigns) {
      let placed = false;
      let finalWidth = design.width;
      let finalHeight = design.height;
      let rotation = 0;

      // Try original orientation
      if (this.canFitAt(currentX, currentY, finalWidth, finalHeight, usableWidth, usableHeight, settings.margin)) {
        placed = true;
      }
      // Try rotated orientation if rotation is allowed
      else if (design.canRotate && 
               this.canFitAt(currentX, currentY, finalHeight, finalWidth, usableWidth, usableHeight, settings.margin)) {
        finalWidth = design.height;
        finalHeight = design.width;
        rotation = 90;
        placed = true;
      }
      // Try new row
      else if (rowHeight > 0) {
        currentX = settings.margin;
        currentY += rowHeight + settings.spacing;
        rowHeight = 0;

        // Try again in new row
        if (this.canFitAt(currentX, currentY, design.width, design.height, usableWidth, usableHeight, settings.margin)) {
          finalWidth = design.width;
          finalHeight = design.height;
          rotation = 0;
          placed = true;
        } else if (design.canRotate && 
                   this.canFitAt(currentX, currentY, design.height, design.width, usableWidth, usableHeight, settings.margin)) {
          finalWidth = design.height;
          finalHeight = design.width;
          rotation = 90;
          placed = true;
        }
      }

      if (placed) {
        placements.push({
          ...design,
          x: currentX,
          y: currentY,
          rotation,
          width: finalWidth,
          height: finalHeight
        });

        console.log(`✅ Placed ${design.name}: ${finalWidth}x${finalHeight}mm at (${currentX}, ${currentY})`);

        // Update position for next design
        currentX += finalWidth + settings.spacing;
        rowHeight = Math.max(rowHeight, finalHeight);

        // Check if we need to move to next row
        if (currentX + settings.spacing > usableWidth + settings.margin) {
          currentX = settings.margin;
          currentY += rowHeight + settings.spacing;
          rowHeight = 0;
        }
      } else {
        console.warn(`❌ Could not place design: ${design.name} (${design.width}x${design.height}mm)`);
      }
    }

    // Calculate statistics
    const totalSheetArea = settings.sheetWidth * settings.sheetHeight;
    const usedArea = placements.reduce((sum, p) => sum + (p.width * p.height), 0);
    const efficiency = Math.round((usedArea / totalSheetArea) * 100);
    const wastePercentage = Math.round(((totalSheetArea - usedArea) / totalSheetArea) * 100);

    console.log(`📊 Layout Statistics: ${placements.length}/${designs.length} placed, ${efficiency}% efficiency`);

    return {
      success: placements.length > 0,
      placements,
      efficiency,
      wasteArea: totalSheetArea - usedArea,
      totalDesigns: designs.length,
      placedDesigns: placements.length,
      statistics: {
        totalArea: totalSheetArea,
        usedArea,
        wastePercentage
      },
      message: placements.length === 0 ? 'No designs could be placed on the sheet' : undefined
    };
  }

  private canFitAt(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    maxWidth: number, 
    maxHeight: number, 
    margin: number
  ): boolean {
    return (x + width <= maxWidth + margin) && (y + height <= maxHeight + margin);
  }

  async generatePDF(
    placements: PlacedDesign[], 
    settings: LayoutSettings
  ): Promise<string> {
    console.log('📄 Generating enterprise PDF layout');
    
    const outputFilename = `enterprise_layout_${Date.now()}.pdf`;
    const outputPath = path.join(process.cwd(), 'uploads', outputFilename);

    // Create Python script input for enterprise PDF generation
    const pdfInput = {
      placements: placements.map(p => ({
        id: p.id,
        name: p.name,
        filePath: p.filePath,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        rotation: p.rotation
      })),
      settings: {
        sheetWidth: settings.sheetWidth,
        sheetHeight: settings.sheetHeight,
        margin: settings.margin,
        bleedMargin: settings.bleedMargin
      },
      outputPath,
      quality: {
        dpi: 300,
        vectorPreservation: true,
        cuttingMarks: true,
        bleedLines: true
      }
    };

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const pythonScript = path.join(process.cwd(), 'server', 'enterprisePDFGenerator.py');
      const command = `python3 "${pythonScript}" '${JSON.stringify(pdfInput)}'`;

      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });

      if (stderr && !stderr.includes('WARNING')) {
        console.error('PDF generation error:', stderr);
      }

      console.log('PDF generation output:', stdout);

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Enterprise PDF generated: ${(stats.size / 1024).toFixed(1)}KB`);
        return outputFilename;
      } else {
        throw new Error('PDF file was not created');
      }

    } catch (error) {
      console.error('Enterprise PDF generation failed:', error);
      throw error;
    }
  }
}

export const enterpriseLayoutEngine = new EnterpriseLayoutEngine();