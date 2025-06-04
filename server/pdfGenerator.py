#!/usr/bin/env python3
"""
PDF Layout Generator for Vector Design Arrangement
"""

import sys
import json
import os

def create_simple_layout_pdf(arrangements, design_files, output_path):
    """Create simple PDF layout without external dependencies"""

    try:
        from reportlab.lib.units import mm, cm
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        # Fixed sheet dimensions: 33x48 cm
        SHEET_WIDTH = 33 * cm
        SHEET_HEIGHT = 48 * cm

        # Create canvas
        c = canvas.Canvas(output_path, pagesize=(SHEET_WIDTH, SHEET_HEIGHT))

        # Add title and info
        c.setFont("Helvetica-Bold", 12)
        c.drawString(1*cm, SHEET_HEIGHT - 1*cm, "Matbixx - Layout")
        c.setFont("Helvetica", 8)
        c.drawString(1*cm, SHEET_HEIGHT - 1.5*cm, f"Toplam: {len(arrangements)}")

        # Draw border
        c.setStrokeColorRGB(0, 0, 0)
        c.rect(0.5*cm, 0.5*cm, SHEET_WIDTH - 1*cm, SHEET_HEIGHT - 1*cm)

        # Process each arrangement
        for i, arrangement in enumerate(arrangements):
            x_mm = arrangement.get('x', 0)
            y_mm = arrangement.get('y', 0)
            width_mm = arrangement.get('width', 50)
            height_mm = arrangement.get('height', 30)

            # Convert mm to points for ReportLab
            x_pt = x_mm * mm
            y_pt = (480 - y_mm - height_mm) * mm
            width_pt = width_mm * mm
            height_pt = height_mm * mm

            # Draw design area
            c.setStrokeColorRGB(0.2, 0.4, 0.8)
            c.setFillColorRGB(0.9, 0.95, 1.0)
            c.rect(x_pt, y_pt, width_pt, height_pt, fill=1, stroke=1)

            # Add design label
            c.setFont("Helvetica", 8)
            c.setFillColorRGB(0, 0, 0)
            c.drawString(x_pt + 2, y_pt + height_pt - 15, f"Design {i+1}")
            c.drawString(x_pt + 2, y_pt + height_pt - 30, f"{width_mm}x{height_mm}mm")

        c.save()
        return True

    except ImportError as e:
        print(f"ERROR: Missing Python packages: {e}")
        return False
    except Exception as e:
        print(f"ERROR: PDF creation failed: {e}")
        return False

def main():
    """Main function called from Node.js"""
    if len(sys.argv) < 2:
        print("ERROR: JSON data required")
        sys.exit(1)

    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        arrangements = input_data.get('arrangements', [])
        design_files = input_data.get('designFiles', [])
        output_path = input_data.get('outputPath', 'layout.pdf')

        # Create PDF layout
        success = create_simple_layout_pdf(arrangements, design_files, output_path)

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