#!/usr/bin/env python3
import json
import sys
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
import PyPDF2
from PyPDF2 import PdfReader, PdfWriter
import io

def mm_to_points(mm_value):
    """Convert millimeters to points (PDF units)"""
    return mm_value * 2.834645669

def generate_layout_pdf(data):
    """Generate PDF with embedded designs"""
    try:
        arrangements = data.get('arrangements', [])
        design_files = data.get('designFiles', [])
        sheet_width = data.get('sheetWidth', 330)
        sheet_height = data.get('sheetHeight', 480)
        output_path = data.get('outputPath', 'output.pdf')
        
        # Convert dimensions to points
        page_width = mm_to_points(sheet_width)
        page_height = mm_to_points(sheet_height)
        
        # Create PDF
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=(page_width, page_height))
        
        # Draw cutting marks and guides
        c.setStrokeColorRGB(0, 0, 0)
        c.setLineWidth(0.5)
        c.rect(mm_to_points(10), mm_to_points(10), 
               mm_to_points(sheet_width-20), mm_to_points(sheet_height-20))
        
        # Process each arrangement
        for arrangement in arrangements:
            design_id = arrangement.get('designId')
            x = mm_to_points(arrangement.get('x', 0))
            y = mm_to_points(sheet_height - arrangement.get('y', 0) - arrangement.get('height', 0))
            width = mm_to_points(arrangement.get('width', 50))
            height = mm_to_points(arrangement.get('height', 30))
            
            # Find corresponding design file
            design_file = None
            for df in design_files:
                if df.get('id') == design_id:
                    design_file = df
                    break
            
            if design_file and design_file.get('filePath'):
                file_path = design_file['filePath']
                
                try:
                    if file_path.lower().endswith('.pdf'):
                        embed_pdf_design(c, file_path, x, y, width, height)
                    else:
                        # Draw placeholder rectangle for non-PDF files
                        c.setStrokeColorRGB(0.5, 0.5, 0.5)
                        c.setFillColorRGB(0.9, 0.9, 0.9)
                        c.rect(x, y, width, height, fill=1, stroke=1)
                        
                        # Add text label
                        c.setFillColorRGB(0, 0, 0)
                        c.setFont("Helvetica", 8)
                        text = design_file.get('name', 'Design')
                        c.drawString(x + 5, y + height/2, text)
                        
                except Exception as e:
                    print(f"Error embedding design {design_id}: {e}", file=sys.stderr)
                    # Draw error placeholder
                    c.setStrokeColorRGB(1, 0, 0)
                    c.setFillColorRGB(1, 0.9, 0.9)
                    c.rect(x, y, width, height, fill=1, stroke=1)
            else:
                # Draw placeholder
                c.setStrokeColorRGB(0.7, 0.7, 0.7)
                c.rect(x, y, width, height, fill=0, stroke=1)
        
        c.save()
        
        # Write to file
        pdf_buffer.seek(0)
        with open(output_path, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        return {
            "success": True,
            "output_path": output_path,
            "message": f"PDF generated successfully with {len(arrangements)} designs"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"PDF generation failed: {str(e)}"
        }

def embed_pdf_design(canvas_obj, pdf_path, x, y, width, height):
    """Embed PDF design into canvas"""
    try:
        # For now, draw a placeholder rectangle
        # In production, you would use a library like pdfrw or PyPDF2
        canvas_obj.setStrokeColorRGB(0, 0, 1)
        canvas_obj.setFillColorRGB(0.9, 0.9, 1)
        canvas_obj.rect(x, y, width, height, fill=1, stroke=1)
        
        # Add filename
        canvas_obj.setFillColorRGB(0, 0, 0)
        canvas_obj.setFont("Helvetica", 6)
        filename = os.path.basename(pdf_path)
        canvas_obj.drawString(x + 2, y + height - 10, filename)
        
    except Exception as e:
        print(f"Error embedding PDF: {e}", file=sys.stderr)

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        # Generate PDF
        result = generate_layout_pdf(data)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Main process error: {str(e)}"
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()