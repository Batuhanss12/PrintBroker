import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface ArrangementItem {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  withMargins?: {
    width: number;
    height: number;
  };
}

interface PlotterSettings {
  sheetWidth: number;
  sheetHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelWidth: number;
  labelHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

interface PdfGenerationData {
  plotterSettings: PlotterSettings;
  arrangements: ArrangementItem[];
}

export class NodePDFGenerator {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async generateArrangementPDF(data: PdfGenerationData): Promise<{ success: boolean; filePath?: string; message?: string }> {
    try {
      console.log('📄 Starting Node.js PDF generation');
      console.log(`📋 Processing ${data.arrangements.length} arrangements`);

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Set page size (convert mm to points: 1mm = 2.834645669 points)
      const mmToPoints = 2.834645669;
      const pageWidth = data.plotterSettings.sheetWidth * mmToPoints;
      const pageHeight = data.plotterSettings.sheetHeight * mmToPoints;
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const { width, height } = page.getSize();

      // Load font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      console.log(`📐 Page size: ${width}x${height} points (${data.plotterSettings.sheetWidth}x${data.plotterSettings.sheetHeight}mm)`);

      // Draw page border
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      // Draw grid (10mm grid)
      const gridSpacing = 10 * mmToPoints;
      
      // Vertical grid lines
      for (let x = 0; x <= width; x += gridSpacing) {
        page.drawLine({
          start: { x, y: 0 },
          end: { x, y: height },
          color: rgb(0.9, 0.9, 0.9),
        });
      }

      // Horizontal grid lines
      for (let y = 0; y <= height; y += gridSpacing) {
        page.drawLine({
          start: { x: 0, y },
          end: { x: width, y },
          color: rgb(0.9, 0.9, 0.9),
        });
      }

      // Process each arrangement
      for (let i = 0; i < data.arrangements.length; i++) {
        const arrangement = data.arrangements[i];
        
        // Convert mm to points
        const x = arrangement.x * mmToPoints;
        const y = (data.plotterSettings.sheetHeight - arrangement.y - arrangement.height) * mmToPoints; // PDF coordinates are bottom-up
        const rectWidth = arrangement.width * mmToPoints;
        const rectHeight = arrangement.height * mmToPoints;

        console.log(`📦 Drawing arrangement ${i + 1}: ${arrangement.width}x${arrangement.height}mm at (${arrangement.x}, ${arrangement.y})`);

        // Draw design rectangle
        const hue = (i * 137.5) % 360;
        const color = this.hslToRgb(hue, 0.7, 0.8);
        
        page.drawRectangle({
          x,
          y,
          width: rectWidth,
          height: rectHeight,
          color: rgb(color.r, color.g, color.b),
          borderColor: rgb(color.r * 0.7, color.g * 0.7, color.b * 0.7),
          borderWidth: 2,
        });

        // Draw margins if available
        if (arrangement.withMargins) {
          const marginWidth = arrangement.withMargins.width * mmToPoints;
          const marginHeight = arrangement.withMargins.height * mmToPoints;
          const marginX = x - (marginWidth - rectWidth) / 2;
          const marginY = y - (marginHeight - rectHeight) / 2;

          page.drawRectangle({
            x: marginX,
            y: marginY,
            width: marginWidth,
            height: marginHeight,
            borderColor: rgb(1, 0.2, 0.2),
            borderWidth: 1,
            borderDashArray: [3, 3],
          });
        }

        // Add text labels
        const fontSize = 8;
        page.drawText(`Design ${i + 1}`, {
          x: x + 5,
          y: y + rectHeight - 15,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });

        page.drawText(`${arrangement.width}×${arrangement.height}mm`, {
          x: x + 5,
          y: y + rectHeight - 30,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      // Add header information
      const headerFontSize = 12;
      page.drawText('Matbixx Otomatik Tasarım Dizimi', {
        x: 20,
        y: height - 30,
        size: headerFontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(`Sayfa: ${data.plotterSettings.sheetWidth}×${data.plotterSettings.sheetHeight}mm`, {
        x: 20,
        y: height - 50,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText(`Tasarım Sayısı: ${data.arrangements.length}`, {
        x: 20,
        y: height - 70,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFileName = `matbixx-layout-${timestamp}.pdf`;
      const outputPath = path.join(this.uploadDir, outputFileName);

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      console.log(`✅ PDF generated successfully: ${outputFileName}`);
      console.log(`📁 File path: ${outputPath}`);
      console.log(`📊 File size: ${pdfBytes.length} bytes`);

      return {
        success: true,
        filePath: `/uploads/${outputFileName}`,
        message: `PDF successfully generated: ${outputFileName}`
      };

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      return {
        success: false,
        message: `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return { r: f(0), g: f(8), b: f(4) };
  }

  async embedExistingPDF(filePath: string): Promise<Uint8Array | null> {
    try {
      const existingPdfBytes = await fs.readFile(filePath);
      return existingPdfBytes;
    } catch (error) {
      console.error('Error reading existing PDF:', error);
      return null;
    }
  }
}

export const nodePDFGenerator = new NodePDFGenerator();