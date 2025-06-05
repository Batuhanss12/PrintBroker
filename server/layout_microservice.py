#!/usr/bin/env python3
"""
FastAPI Mikroservis - Otomatik Dizilim Sistemi
Enterprise düzeyinde PDF tasarım dizilimi
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
import os
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import fitz  # PyMuPDF
import logging

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Matbixx Layout Engine", version="1.0.0")

class DesignItem(BaseModel):
    id: str
    name: str
    width: float  # mm
    height: float  # mm
    filePath: str
    canRotate: bool = True

class LayoutSettings(BaseModel):
    sheetWidth: float = 330.0  # mm
    sheetHeight: float = 480.0  # mm
    margin: float = 10.0  # mm
    spacing: float = 5.0  # mm

class LayoutRequest(BaseModel):
    designs: List[DesignItem]
    settings: LayoutSettings
    outputPath: str

class PlacedDesign(BaseModel):
    designId: str
    x: float
    y: float
    width: float
    height: float
    rotation: int = 0

class LayoutResponse(BaseModel):
    success: bool
    arrangements: List[PlacedDesign]
    pdfPath: Optional[str] = None
    message: str
    statistics: dict

def mm_to_points(mm_value: float) -> float:
    """MM'yi PDF point'e çevir"""
    return mm_value * 2.834645669

def calculate_optimal_layout(designs: List[DesignItem], settings: LayoutSettings) -> List[PlacedDesign]:
    """Optimal dizilim hesapla"""
    arrangements = []
    
    current_x = settings.margin
    current_y = settings.margin
    row_height = 0
    
    for design in designs:
        width = design.width
        height = design.height
        
        # Mevcut satırda yer var mı kontrol et
        if current_x + width + settings.margin <= settings.sheetWidth:
            arrangements.append(PlacedDesign(
                designId=design.id,
                x=current_x,
                y=current_y,
                width=width,
                height=height,
                rotation=0
            ))
            
            current_x += width + settings.spacing
            row_height = max(row_height, height)
            
        else:
            # Yeni satıra geç
            current_y += row_height + settings.spacing
            current_x = settings.margin
            row_height = height
            
            # Yeni satırda yer var mı kontrol et
            if (current_y + height + settings.margin <= settings.sheetHeight and 
                current_x + width + settings.margin <= settings.sheetWidth):
                
                arrangements.append(PlacedDesign(
                    designId=design.id,
                    x=current_x,
                    y=current_y,
                    width=width,
                    height=height,
                    rotation=0
                ))
                
                current_x += width + settings.spacing
    
    return arrangements

def generate_layout_pdf(arrangements: List[PlacedDesign], designs: List[DesignItem], 
                       settings: LayoutSettings, output_path: str) -> bool:
    """PDF oluştur"""
    try:
        # PDF boyutları
        page_width = mm_to_points(settings.sheetWidth)
        page_height = mm_to_points(settings.sheetHeight)
        
        # PDF oluştur
        c = canvas.Canvas(output_path, pagesize=(page_width, page_height))
        
        # Kesim çizgileri
        c.setStrokeColorRGB(0, 0, 0)
        c.setLineWidth(0.5)
        margin_points = mm_to_points(settings.margin)
        c.rect(margin_points, margin_points, 
               page_width - 2*margin_points, page_height - 2*margin_points)
        
        # Design'ları yerleştir
        design_map = {d.id: d for d in designs}
        
        for arrangement in arrangements:
            design = design_map.get(arrangement.designId)
            if not design:
                continue
                
            x = mm_to_points(arrangement.x)
            y = mm_to_points(settings.sheetHeight - arrangement.y - arrangement.height)
            width = mm_to_points(arrangement.width)
            height = mm_to_points(arrangement.height)
            
            try:
                if design.filePath.lower().endswith('.pdf'):
                    embed_pdf_content(c, design.filePath, x, y, width, height)
                else:
                    # Diğer formatlar için placeholder
                    draw_placeholder(c, x, y, width, height, design.name)
                    
            except Exception as e:
                logger.error(f"Design embedding error for {design.id}: {e}")
                draw_error_placeholder(c, x, y, width, height, design.name)
        
        c.save()
        logger.info(f"PDF generated successfully: {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        return False

def embed_pdf_content(canvas_obj, pdf_path: str, x: float, y: float, width: float, height: float):
    """PDF içeriğini embed et"""
    try:
        # PyMuPDF ile PDF aç
        doc = fitz.open(pdf_path)
        page = doc[0]
        
        # PDF'i bitmap'e çevir
        mat = fitz.Matrix(2, 2)  # 2x zoom
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # Geçici dosya oluştur
        temp_img = f"/tmp/temp_{os.getpid()}.png"
        with open(temp_img, "wb") as f:
            f.write(img_data)
        
        # Canvas'a ekle
        canvas_obj.drawImage(temp_img, x, y, width=width, height=height)
        
        # Geçici dosyayı sil
        os.unlink(temp_img)
        doc.close()
        
    except Exception as e:
        logger.error(f"PDF embedding failed: {e}")
        draw_placeholder(canvas_obj, x, y, width, height, os.path.basename(pdf_path))

def draw_placeholder(canvas_obj, x: float, y: float, width: float, height: float, name: str):
    """Placeholder çiz"""
    canvas_obj.setStrokeColorRGB(0, 0, 1)
    canvas_obj.setFillColorRGB(0.9, 0.9, 1)
    canvas_obj.rect(x, y, width, height, fill=1, stroke=1)
    
    canvas_obj.setFillColorRGB(0, 0, 0)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.drawString(x + 2, y + height - 12, name[:20])

def draw_error_placeholder(canvas_obj, x: float, y: float, width: float, height: float, name: str):
    """Hata placeholder'ı çiz"""
    canvas_obj.setStrokeColorRGB(1, 0, 0)
    canvas_obj.setFillColorRGB(1, 0.9, 0.9)
    canvas_obj.rect(x, y, width, height, fill=1, stroke=1)
    
    canvas_obj.setFillColorRGB(1, 0, 0)
    canvas_obj.setFont("Helvetica", 6)
    canvas_obj.drawString(x + 2, y + height - 10, f"ERROR: {name[:15]}")

@app.get("/health")
async def health_check():
    """Sağlık kontrolü"""
    return {"status": "healthy", "service": "layout-engine"}

@app.post("/generate-layout", response_model=LayoutResponse)
async def generate_layout(request: LayoutRequest):
    """Otomatik dizilim oluştur"""
    try:
        logger.info(f"Layout request received for {len(request.designs)} designs")
        
        if not request.designs:
            raise HTTPException(status_code=400, detail="No designs provided")
        
        # Dizilimi hesapla
        arrangements = calculate_optimal_layout(request.designs, request.settings)
        
        if not arrangements:
            return LayoutResponse(
                success=False,
                arrangements=[],
                message="No designs could be arranged on the sheet",
                statistics={
                    "totalDesigns": len(request.designs),
                    "arrangedDesigns": 0,
                    "efficiency": 0
                }
            )
        
        # PDF oluştur
        pdf_success = generate_layout_pdf(arrangements, request.designs, request.settings, request.outputPath)
        
        if not pdf_success:
            raise HTTPException(status_code=500, detail="PDF generation failed")
        
        # İstatistikleri hesapla
        efficiency = round((len(arrangements) / len(request.designs)) * 100)
        
        return LayoutResponse(
            success=True,
            arrangements=arrangements,
            pdfPath=request.outputPath,
            message=f"Successfully arranged {len(arrangements)} designs",
            statistics={
                "totalDesigns": len(request.designs),
                "arrangedDesigns": len(arrangements),
                "efficiency": efficiency
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Layout generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8001, help="Port number")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host")
    args = parser.parse_args()
    
    logger.info(f"Starting Matbixx Layout Engine on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)