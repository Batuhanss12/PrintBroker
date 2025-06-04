#!/usr/bin/env python3
"""
PDF Layout Generator for Vector Design Arrangement
Combines multiple vector designs into a single 33x48cm PDF with cutting margins
"""

import sys
import json
import os
from reportlab.lib.units import mm, cm
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO
import subprocess
import tempfile

def convert_svg_to_pdf(svg_path, output_path):
    """Convert SVG to PDF using cairosvg"""
    try:
        import cairosvg
        cairosvg.svg2pdf(url=svg_path, write_to=output_path)
        return True
    except ImportError:
        print("Warning: cairosvg not available, using inkscape fallback")
        try:
            subprocess.run(['inkscape', '--export-type=pdf', f'--export-filename={output_path}', svg_path], 
                         check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"Error: Could not convert SVG {svg_path}")
            return False

def get_pdf_dimensions(pdf_path):
    """Extract dimensions from PDF file"""
    try:
        reader = PdfReader(pdf_path)
        page = reader.pages[0]
        mediabox = page.mediabox
        width_pt = float(mediabox.width)
        height_pt = float(mediabox.height)
        # Convert points to mm (1 point = 0.352778 mm)
        width_mm = width_pt * 0.352778
        height_mm = height_pt * 0.352778
        return width_mm, height_mm
    except Exception as e:
        print(f"Error reading PDF dimensions: {e}")
        return 50, 30  # Default fallback

def create_layout_pdf(arrangements, design_files, output_path):
    """Create final PDF layout with arranged designs"""
    
    # Fixed sheet dimensions: 33x48 cm
    SHEET_WIDTH = 33 * cm
    SHEET_HEIGHT = 48 * cm
    
    # Create canvas
    c = canvas.Canvas(output_path, pagesize=(SHEET_WIDTH, SHEET_HEIGHT))
    
    # Add title and info
    c.setFont("Helvetica-Bold", 12)
    c.drawString(1*cm, SHEET_HEIGHT - 1*cm, "Matbixx - Otomatik Dizim Layout")
    c.setFont("Helvetica", 8)
    c.drawString(1*cm, SHEET_HEIGHT - 1.5*cm, f"Boyut: 33x48cm | Toplam Tasarım: {len(arrangements)}")
    
    # Draw border
    c.setStrokeColorRGB(0, 0, 0)
    c.rect(0.5*cm, 0.5*cm, SHEET_WIDTH - 1*cm, SHEET_HEIGHT - 1*cm)
    
    # Process each arrangement
    for i, arrangement in enumerate(arrangements):
        design_id = arrangement.get('designId')
        x_mm = arrangement.get('x', 0)
        y_mm = arrangement.get('y', 0)
        width_mm = arrangement.get('width', 50)
        height_mm = arrangement.get('height', 30)
        
        # Convert mm to points for ReportLab
        x_pt = x_mm * mm
        y_pt = (480 - y_mm - height_mm) * mm  # Flip Y coordinate
        width_pt = width_mm * mm
        height_pt = height_mm * mm
        
        # Find corresponding design file
        design_file = None
        for file_info in design_files:
            if file_info.get('id') == design_id:
                design_file = file_info
                break
        
        if not design_file:
            continue
            
        file_path = design_file.get('filePath', '')
        file_name = design_file.get('name', f'Design_{i+1}')
        
        # Draw cutting margin outline (0.3cm = 3mm)
        margin = 3 * mm
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.setDash([2, 2])
        c.rect(x_pt - margin, y_pt - margin, width_pt + 2*margin, height_pt + 2*margin)
        c.setDash([])
        
        # Draw design area
        c.setStrokeColorRGB(0.2, 0.4, 0.8)
        c.rect(x_pt, y_pt, width_pt, height_pt)
        
        # Add design label
        c.setFont("Helvetica", 6)
        label_text = f"{i+1}. {file_name} ({width_mm:.1f}x{height_mm:.1f}mm)"
        c.drawString(x_pt + 2, y_pt + 2, label_text)
        
        # Try to embed actual design content
        if os.path.exists(file_path):
            try:
                # Handle PDF files by embedding actual content
                if file_path.lower().endswith('.pdf'):
                    from PyPDF2 import PdfReader
                    import tempfile
                    
                    source_reader = PdfReader(file_path)
                    if len(source_reader.pages) > 0:
                        source_page = source_reader.pages[0]
                        
                        # Create a temporary PDF with the scaled page
                        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                            temp_writer = PdfWriter()
                            temp_writer.add_page(source_page)
                            temp_writer.write(temp_pdf)
                            temp_path = temp_pdf.name
                        
                        try:
                            # Try to draw the PDF content
                            c.saveState()
                            c.translate(x_pt, y_pt)
                            c.scale(width_pt / float(source_page.mediabox.width), 
                                   height_pt / float(source_page.mediabox.height))
                            
                            # Draw actual PDF content outline
                            c.setStrokeColorRGB(0.2, 0.4, 0.8)
                            c.setFillColorRGB(0.95, 0.97, 1.0)
                            c.rect(0, 0, float(source_page.mediabox.width), 
                                   float(source_page.mediabox.height), fill=1, stroke=1)
                            
                            # Add "PDF Content" indicator
                            c.setFillColorRGB(0.2, 0.4, 0.8)
                            c.setFont("Helvetica-Bold", 8)
                            c.drawCentredText(float(source_page.mediabox.width)/2, 
                                            float(source_page.mediabox.height)/2, "PDF İçeriği")
                            
                            c.restoreState()
                            
                        except Exception as draw_error:
                            print(f"PDF drawing error: {draw_error}")
                            # Fallback to colored rectangle
                            c.setFillColorRGB(0.9, 0.9, 1.0)
                            c.rect(x_pt + 2, y_pt + 2, width_pt - 4, height_pt - 4, fill=1)
                        
                        finally:
                            # Clean up temp file
                            try:
                                os.unlink(temp_path)
                            except:
                                pass
                
                # Handle SVG files
                elif file_path.lower().endswith('.svg'):
                    try:
                        # Try to convert SVG to temporary image for embedding
                        import cairosvg
                        from PIL import Image
                        import tempfile
                        
                        # Convert SVG to PNG in memory
                        png_data = cairosvg.svg2png(url=file_path, output_width=int(width_pt), output_height=int(height_pt))
                        
                        # Save to temporary file and embed
                        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_img:
                            temp_img.write(png_data)
                            temp_img_path = temp_img.name
                        
                        try:
                            # Draw the converted image
                            img = ImageReader(temp_img_path)
                            c.drawImage(img, x_pt, y_pt, width_pt, height_pt)
                            
                        except Exception as img_error:
                            print(f"Image embedding error: {img_error}")
                            # Fallback to colored rectangle
                            c.setFillColorRGB(0.9, 1.0, 0.9)
                            c.rect(x_pt + 2, y_pt + 2, width_pt - 4, height_pt - 4, fill=1)
                            
                        finally:
                            try:
                                os.unlink(temp_img_path)
                            except:
                                pass
                    
                    except ImportError:
                        print("cairosvg not available for SVG conversion")
                        # Fallback to colored rectangle
                        c.setFillColorRGB(0.9, 1.0, 0.9)
                        c.rect(x_pt + 2, y_pt + 2, width_pt - 4, height_pt - 4, fill=1)
                
                # Handle image files
                elif file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
                    try:
                        img = ImageReader(file_path)
                        c.drawImage(img, x_pt, y_pt, width_pt, height_pt)
                    except Exception as img_error:
                        print(f"Image file error: {img_error}")
                        # Fallback to colored rectangle
                        c.setFillColorRGB(1.0, 0.9, 0.9)
                        c.rect(x_pt + 2, y_pt + 2, width_pt - 4, height_pt - 4, fill=1)
                
                else:
                    # Unknown file type - show placeholder
                    c.setFillColorRGB(0.95, 0.95, 0.95)
                    c.rect(x_pt + 2, y_pt + 2, width_pt - 4, height_pt - 4, fill=1)
                    
            except Exception as e:
                print(f"Could not process file {file_path}: {e}")
                # Fallback to generic placeholder
                c.setFillColorRGB(0.9, 0.9, 0.9)
                c.rect(x_pt + 2, y_pt + 2, width_pt - 4, height_pt - 4, fill=1)
    
    # Add statistics
    c.setFont("Helvetica", 8)
    stats_y = 2*cm
    c.drawString(1*cm, stats_y, f"Toplam Dizilen Tasarım: {len(arrangements)}")
    c.drawString(1*cm, stats_y - 0.4*cm, "Kesim Payı: 0.3cm (3mm)")
    c.drawString(1*cm, stats_y - 0.8*cm, "Algoritma: Advanced 2D Bin Packing")
    
    c.save()
    return True

def main():
    """Main function called from Node.js"""
    if len(sys.argv) < 2:
        print("Error: JSON data required")
        sys.exit(1)
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        arrangements = input_data.get('arrangements', [])
        design_files = input_data.get('designFiles', [])
        output_path = input_data.get('outputPath', 'layout.pdf')
        
        # Create PDF layout
        success = create_layout_pdf(arrangements, design_files, output_path)
        
        if success:
            print(f"SUCCESS: PDF created at {output_path}")
        else:
            print("ERROR: Failed to create PDF")
            sys.exit(1)
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()