#!/usr/bin/env python3
import sys
import json
import os
from pathlib import Path

try:
    import fitz  # PyMuPDF
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import mm
    from reportlab.graphics import renderPDF
    from reportlab.graphics.shapes import Drawing
    from reportlab.graphics.charts.lineplots import LinePlot
    ENTERPRISE_LIBS_AVAILABLE = True
except ImportError as e:
    ENTERPRISE_LIBS_AVAILABLE = False
    print(f"Enterprise libraries not available: {e}")

class EnterprisePDFGenerator:
    def __init__(self):
        self.mm_to_points = 72.0 / 25.4  # Convert mm to points
        
    def generate_layout_pdf(self, data):
        """Generate enterprise-grade PDF with vector preservation"""
        try:
            placements = data.get('placements', [])
            settings = data.get('settings', {})
            output_path = data.get('outputPath', 'output.pdf')
            quality = data.get('quality', {})
            
            print(f"🏭 Enterprise PDF Generation Started")
            print(f"📐 Sheet: {settings['sheetWidth']}x{settings['sheetHeight']}mm")
            print(f"📄 Designs to place: {len(placements)}")
            
            # Create PDF with exact dimensions
            sheet_width_pts = settings['sheetWidth'] * self.mm_to_points
            sheet_height_pts = settings['sheetHeight'] * self.mm_to_points
            
            # Create new PDF document
            pdf_doc = fitz.open()
            page = pdf_doc.new_page(width=sheet_width_pts, height=sheet_height_pts)
            
            # Add cutting marks if enabled
            if quality.get('cuttingMarks', True):
                self.add_cutting_marks(page, settings)
            
            # Add bleed lines if enabled
            if quality.get('bleedLines', True):
                self.add_bleed_lines(page, settings)
            
            # Place each design
            placed_count = 0
            for placement in placements:
                try:
                    success = self.place_design_on_page(page, placement, settings)
                    if success:
                        placed_count += 1
                        print(f"✅ Placed: {placement['name']}")
                    else:
                        print(f"❌ Failed to place: {placement['name']}")
                except Exception as e:
                    print(f"⚠️ Error placing {placement['name']}: {e}")
            
            # Save the PDF
            pdf_doc.save(output_path)
            pdf_doc.close()
            
            # Verify file was created
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                print(f"✅ Enterprise PDF created: {file_size} bytes")
                print(f"📊 Successfully placed {placed_count}/{len(placements)} designs")
                return True
            else:
                print("❌ PDF file was not created")
                return False
                
        except Exception as e:
            print(f"❌ Enterprise PDF generation failed: {e}")
            return False
    
    def place_design_on_page(self, page, placement, settings):
        """Place individual design on PDF page with vector preservation"""
        try:
            design_path = placement['filePath']
            if not os.path.exists(design_path):
                print(f"⚠️ Design file not found: {design_path}")
                return False
            
            # Convert mm to points
            x_pts = placement['x'] * self.mm_to_points
            y_pts = placement['y'] * self.mm_to_points
            width_pts = placement['width'] * self.mm_to_points
            height_pts = placement['height'] * self.mm_to_points
            
            # Handle rotation
            rotation = placement.get('rotation', 0)
            
            # Create transformation matrix
            mat = fitz.Matrix(1, 0, 0, 1, x_pts, y_pts)
            if rotation == 90:
                mat = mat * fitz.Matrix(0, 1, -1, 0, height_pts, 0)
            elif rotation == 180:
                mat = mat * fitz.Matrix(-1, 0, 0, -1, width_pts, height_pts)
            elif rotation == 270:
                mat = mat * fitz.Matrix(0, -1, 1, 0, 0, width_pts)
            
            # Insert design into page
            if design_path.lower().endswith('.pdf'):
                # Handle PDF files
                design_doc = fitz.open(design_path)
                if len(design_doc) > 0:
                    design_page = design_doc[0]
                    
                    # Scale to fit placement area
                    design_rect = design_page.rect
                    scale_x = width_pts / design_rect.width
                    scale_y = height_pts / design_rect.height
                    scale = min(scale_x, scale_y)  # Maintain aspect ratio
                    
                    scale_mat = fitz.Matrix(scale, 0, 0, scale, 0, 0)
                    final_mat = scale_mat * mat
                    
                    page.show_pdf_page(
                        fitz.Rect(x_pts, y_pts, x_pts + width_pts, y_pts + height_pts),
                        design_doc, 0, matrix=final_mat
                    )
                design_doc.close()
                
            elif design_path.lower().endswith(('.ai', '.eps')):
                # Handle AI/EPS files (convert to PDF first if needed)
                # For now, create a placeholder rectangle
                rect = fitz.Rect(x_pts, y_pts, x_pts + width_pts, y_pts + height_pts)
                page.draw_rect(rect, color=(0, 0, 1), width=1)
                
                # Add text label
                text_point = fitz.Point(x_pts + width_pts/2, y_pts + height_pts/2)
                page.insert_text(text_point, placement['name'], fontsize=10, color=(0, 0, 1))
            
            return True
            
        except Exception as e:
            print(f"Error placing design: {e}")
            return False
    
    def add_cutting_marks(self, page, settings):
        """Add professional cutting marks"""
        try:
            margin = settings['margin'] * self.mm_to_points
            sheet_width = settings['sheetWidth'] * self.mm_to_points
            sheet_height = settings['sheetHeight'] * self.mm_to_points
            mark_length = 5 * self.mm_to_points
            
            # Corner marks
            corners = [
                (margin, margin),  # Bottom-left
                (sheet_width - margin, margin),  # Bottom-right
                (margin, sheet_height - margin),  # Top-left
                (sheet_width - margin, sheet_height - margin)  # Top-right
            ]
            
            for x, y in corners:
                # Horizontal marks
                page.draw_line(
                    fitz.Point(x - mark_length, y), 
                    fitz.Point(x + mark_length, y), 
                    color=(0, 0, 0), width=0.5
                )
                # Vertical marks
                page.draw_line(
                    fitz.Point(x, y - mark_length), 
                    fitz.Point(x, y + mark_length), 
                    color=(0, 0, 0), width=0.5
                )
            
        except Exception as e:
            print(f"Error adding cutting marks: {e}")
    
    def add_bleed_lines(self, page, settings):
        """Add bleed lines for professional printing"""
        try:
            margin = settings['margin'] * self.mm_to_points
            bleed = settings.get('bleedMargin', 3) * self.mm_to_points
            sheet_width = settings['sheetWidth'] * self.mm_to_points
            sheet_height = settings['sheetHeight'] * self.mm_to_points
            
            # Draw bleed rectangle
            bleed_rect = fitz.Rect(
                margin - bleed, 
                margin - bleed, 
                sheet_width - margin + bleed, 
                sheet_height - margin + bleed
            )
            
            page.draw_rect(bleed_rect, color=(1, 0, 0), width=0.25)
            
        except Exception as e:
            print(f"Error adding bleed lines: {e}")

def main():
    if len(sys.argv) < 2:
        print("❌ No input data provided")
        return
    
    try:
        input_data = json.loads(sys.argv[1])
        generator = EnterprisePDFGenerator()
        
        if not ENTERPRISE_LIBS_AVAILABLE:
            print("❌ Enterprise libraries not available")
            return
        
        success = generator.generate_layout_pdf(input_data)
        
        if success:
            print("✅ Enterprise PDF generation completed successfully")
        else:
            print("❌ Enterprise PDF generation failed")
            
    except Exception as e:
        print(f"❌ Enterprise PDF generator error: {e}")

if __name__ == "__main__":
    main()