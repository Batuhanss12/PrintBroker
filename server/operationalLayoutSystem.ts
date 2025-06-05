import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface DesignItem {
  id: string;
  name: string;
  width: number;
  height: number;
  filePath: string;
  canRotate: boolean;
}

interface LayoutSettings {
  sheetWidth: number;
  sheetHeight: number;
  margin: number;
  spacing: number;
}

interface LayoutResult {
  success: boolean;
  pdfPath?: string;
  arrangements: any[];
  message?: string;
}

export class OperationalLayoutSystem {
  async generateLayout(designs: DesignItem[], settings: LayoutSettings): Promise<LayoutResult> {
    try {
      console.log('🚀 Starting operational layout generation');
      
      // Simple arrangement calculation
      const arrangements = this.calculateArrangements(designs, settings);
      
      if (arrangements.length === 0) {
        return {
          success: false,
          arrangements: [],
          message: 'No designs could be arranged on the sheet'
        };
      }

      // Generate PDF using Python
      const pdfPath = await this.generatePDF(arrangements, designs, settings);
      
      return {
        success: true,
        pdfPath,
        arrangements,
        message: `Successfully arranged ${arrangements.length} designs`
      };
      
    } catch (error) {
      console.error('Layout generation error:', error);
      return {
        success: false,
        arrangements: [],
        message: `Layout generation failed: ${error.message}`
      };
    }
  }

  private calculateArrangements(designs: DesignItem[], settings: LayoutSettings): any[] {
    const arrangements = [];
    const { sheetWidth, sheetHeight, margin, spacing } = settings;
    
    let currentX = margin;
    let currentY = margin;
    let rowHeight = 0;

    for (const design of designs) {
      const { width, height } = design;
      
      // Check if design fits in current row
      if (currentX + width + margin <= sheetWidth) {
        arrangements.push({
          designId: design.id,
          x: currentX,
          y: currentY,
          width,
          height,
          rotation: 0
        });
        
        currentX += width + spacing;
        rowHeight = Math.max(rowHeight, height);
      } else {
        // Move to next row
        currentY += rowHeight + spacing;
        currentX = margin;
        rowHeight = height;
        
        // Check if design fits in new row
        if (currentY + height + margin <= sheetHeight && currentX + width + margin <= sheetWidth) {
          arrangements.push({
            designId: design.id,
            x: currentX,
            y: currentY,
            width,
            height,
            rotation: 0
          });
          
          currentX += width + spacing;
        }
      }
    }

    return arrangements;
  }

  private async generatePDF(arrangements: any[], designs: DesignItem[], settings: LayoutSettings): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(process.cwd(), 'uploads', `layout_${Date.now()}.pdf`);
      
      const pythonData = {
        arrangements,
        designFiles: designs.map(d => ({
          id: d.id,
          name: d.name,
          filePath: d.filePath,
          width: d.width,
          height: d.height
        })),
        sheetWidth: settings.sheetWidth,
        sheetHeight: settings.sheetHeight,
        margin: settings.margin,
        spacing: settings.spacing,
        outputPath
      };

      const pythonScript = path.join(__dirname, 'simplePDFGenerator.py');
      const python = spawn('python3', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      python.stdin.write(JSON.stringify(pythonData));
      python.stdin.end();

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.success) {
              resolve(result.output_path);
            } else {
              reject(new Error(result.error || 'PDF generation failed'));
            }
          } catch (e) {
            reject(new Error('Invalid Python response'));
          }
        } else {
          reject(new Error(`Python process failed: ${stderr}`));
        }
      });
    });
  }
}

export const operationalLayoutSystem = new OperationalLayoutSystem();