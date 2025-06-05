
#!/usr/bin/env python3
"""
Profesyonel Otomatik Dizim Sistemi
Firma kalitesinde vektörel dosya işleme ve PDF üretimi
"""

import json
import sys
import os
import tempfile
import shutil
import logging
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from pathlib import Path

# PDF ve görsel işleme kütüphaneleri
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.renderPDF import drawToFile
from reportlab.platypus import SimpleDocTemplate, Spacer
from reportlab.lib import colors

# Vektörel dosya işleme
import fitz  # PyMuPDF
from PIL import Image, ImageDraw
import cairosvg
from svglib.svglib import renderSVG
import numpy as np
import cv2

# Loglama sistemi
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class DesignFile:
    """Tasarım dosyası bilgileri"""
    filepath: str
    filename: str
    width_mm: float
    height_mm: float
    file_type: str
    page_count: int = 1
    rotation: int = 0
    
@dataclass
class PageLayout:
    """Sayfa düzeni bilgileri"""
    width_mm: float
    height_mm: float
    margin_mm: float = 5.0
    cutting_space_mm: float = 5.0

@dataclass
class PlacedDesign:
    """Yerleştirilmiş tasarım"""
    design: DesignFile
    x_mm: float
    y_mm: float
    width_mm: float
    height_mm: float
    rotation: int = 0

class ProfessionalLayoutEngine:
    """Profesyonel otomatik dizim motoru"""
    
    def __init__(self):
        self.supported_formats = {'.pdf', '.svg', '.eps', '.ai', '.png', '.jpg', '.jpeg'}
        self.temp_dir = None
        
    def __enter__(self):
        self.temp_dir = tempfile.mkdtemp()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def analyze_design_file(self, filepath: str) -> Optional[DesignFile]:
        """Tasarım dosyasını analiz et ve gerçek boyutları al"""
        try:
            file_ext = Path(filepath).suffix.lower()
            filename = Path(filepath).name
            
            if file_ext == '.pdf':
                return self._analyze_pdf(filepath, filename)
            elif file_ext == '.svg':
                return self._analyze_svg(filepath, filename)
            elif file_ext in {'.eps', '.ai'}:
                return self._analyze_eps_ai(filepath, filename)
            elif file_ext in {'.png', '.jpg', '.jpeg'}:
                return self._analyze_raster(filepath, filename)
            else:
                logger.warning(f"Desteklenmeyen dosya formatı: {file_ext}")
                return None
                
        except Exception as e:
            logger.error(f"Dosya analiz hatası {filepath}: {e}")
            return None
    
    def _analyze_pdf(self, filepath: str, filename: str) -> DesignFile:
        """PDF dosyası analizi"""
        doc = fitz.open(filepath)
        page = doc[0]
        rect = page.rect
        
        # Point'i mm'ye çevir (1 point = 0.352778 mm)
        width_mm = rect.width * 0.352778
        height_mm = rect.height * 0.352778
        
        doc.close()
        
        return DesignFile(
            filepath=filepath,
            filename=filename,
            width_mm=width_mm,
            height_mm=height_mm,
            file_type='pdf',
            page_count=len(doc)
        )
    
    def _analyze_svg(self, filepath: str, filename: str) -> DesignFile:
        """SVG dosyası analizi"""
        try:
            # SVG'yi PNG'ye çevir ve boyutları al
            png_path = os.path.join(self.temp_dir, f"{filename}.png")
            cairosvg.svg2png(url=filepath, write_to=png_path, dpi=300)
            
            with Image.open(png_path) as img:
                # 300 DPI varsayarak mm hesapla
                width_mm = (img.width / 300) * 25.4
                height_mm = (img.height / 300) * 25.4
                
            return DesignFile(
                filepath=filepath,
                filename=filename,
                width_mm=width_mm,
                height_mm=height_mm,
                file_type='svg'
            )
        except Exception as e:
            logger.error(f"SVG analiz hatası: {e}")
            # Fallback boyutlar
            return DesignFile(
                filepath=filepath,
                filename=filename,
                width_mm=50.0,
                height_mm=30.0,
                file_type='svg'
            )
    
    def _analyze_eps_ai(self, filepath: str, filename: str) -> DesignFile:
        """EPS/AI dosyası analizi"""
        try:
            # Ghostscript ile PDF'ye çevir
            pdf_path = os.path.join(self.temp_dir, f"{filename}.pdf")
            os.system(f'gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile="{pdf_path}" "{filepath}"')
            
            if os.path.exists(pdf_path):
                return self._analyze_pdf(pdf_path, filename)
            else:
                raise Exception("Ghostscript dönüşümü başarısız")
                
        except Exception as e:
            logger.error(f"EPS/AI analiz hatası: {e}")
            return DesignFile(
                filepath=filepath,
                filename=filename,
                width_mm=50.0,
                height_mm=30.0,
                file_type='eps'
            )
    
    def _analyze_raster(self, filepath: str, filename: str) -> DesignFile:
        """Raster görüntü analizi"""
        with Image.open(filepath) as img:
            # DPI bilgisi varsa kullan, yoksa 300 DPI varsay
            dpi = img.info.get('dpi', (300, 300))
            dpi_x = dpi[0] if isinstance(dpi, tuple) else dpi
            
            width_mm = (img.width / dpi_x) * 25.4
            height_mm = (img.height / dpi_x) * 25.4
            
        return DesignFile(
            filepath=filepath,
            filename=filename,
            width_mm=width_mm,
            height_mm=height_mm,
            file_type='raster'
        )
    
    def calculate_optimal_layout(
        self, 
        designs: List[DesignFile], 
        page_layout: PageLayout
    ) -> List[List[PlacedDesign]]:
        """Optimal yerleşim hesapla"""
        
        if not designs:
            return []
        
        # Kullanılabilir alan hesapla
        usable_width = page_layout.width_mm - (2 * page_layout.margin_mm)
        usable_height = page_layout.height_mm - (2 * page_layout.margin_mm)
        
        logger.info(f"📏 Kullanılabilir alan: {usable_width:.1f}x{usable_height:.1f} mm")
        
        pages = []
        remaining_designs = designs.copy()
        
        while remaining_designs:
            page_designs = self._pack_designs_to_page(
                remaining_designs, usable_width, usable_height, page_layout
            )
            
            if not page_designs:
                # Yerleştirilemeyecek tasarımlar varsa uyarı ver
                logger.warning(f"⚠️  {len(remaining_designs)} tasarım sayfa boyutundan büyük")
                break
                
            pages.append(page_designs)
            
            # Yerleştirilen tasarımları listeden çıkar
            placed_designs = [pd.design for pd in page_designs]
            remaining_designs = [d for d in remaining_designs if d not in placed_designs]
        
        logger.info(f"📄 Toplam {len(pages)} sayfa oluşturuldu")
        return pages
    
    def _pack_designs_to_page(
        self, 
        designs: List[DesignFile], 
        page_width: float, 
        page_height: float,
        page_layout: PageLayout
    ) -> List[PlacedDesign]:
        """Bir sayfaya tasarımları yerleştir (Bottom-Left Fill algoritması)"""
        
        placed = []
        current_row_y = page_layout.margin_mm
        current_row_height = 0
        current_x = page_layout.margin_mm
        
        for design in designs[:]:  # Copy to iterate safely
            design_width = design.width_mm + page_layout.cutting_space_mm
            design_height = design.height_mm + page_layout.cutting_space_mm
            
            # Yeni satıra geçmek gerekiyor mu?
            if current_x + design_width > page_width + page_layout.margin_mm:
                current_row_y += current_row_height + page_layout.cutting_space_mm
                current_row_height = 0
                current_x = page_layout.margin_mm
            
            # Sayfa yüksekliğini aşıyor mu?
            if current_row_y + design_height > page_height + page_layout.margin_mm:
                break
            
            # Tasarımı yerleştir
            placed_design = PlacedDesign(
                design=design,
                x_mm=current_x,
                y_mm=current_row_y,
                width_mm=design.width_mm,
                height_mm=design.height_mm
            )
            
            placed.append(placed_design)
            current_x += design_width
            current_row_height = max(current_row_height, design_height)
            
            # Yerleştirilen tasarımı listeden çıkar
            designs.remove(design)
        
        return placed
    
    def generate_professional_pdf(
        self, 
        pages: List[List[PlacedDesign]], 
        page_layout: PageLayout,
        output_path: str
    ) -> bool:
        """Profesyonel PDF üret"""
        try:
            # ReportLab ile PDF oluştur
            c = canvas.Canvas(output_path, pagesize=(
                page_layout.width_mm * mm,
                page_layout.height_mm * mm
            ))
            
            for page_idx, page_designs in enumerate(pages):
                logger.info(f"📄 Sayfa {page_idx + 1} işleniyor ({len(page_designs)} tasarım)")
                
                if page_idx > 0:
                    c.showPage()
                
                self._render_page_designs(c, page_designs, page_layout)
            
            c.save()
            logger.info(f"✅ PDF başarıyla oluşturuldu: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ PDF oluşturma hatası: {e}")
            return False
    
    def _render_page_designs(
        self, 
        canvas_obj: canvas.Canvas, 
        designs: List[PlacedDesign],
        page_layout: PageLayout
    ):
        """Sayfadaki tasarımları render et"""
        
        for design in designs:
            try:
                x = design.x_mm * mm
                y = (page_layout.height_mm - design.y_mm - design.height_mm) * mm
                width = design.width_mm * mm
                height = design.height_mm * mm
                
                if design.design.file_type == 'pdf':
                    self._render_pdf_design(canvas_obj, design.design.filepath, x, y, width, height)
                elif design.design.file_type == 'svg':
                    self._render_svg_design(canvas_obj, design.design.filepath, x, y, width, height)
                else:
                    self._render_raster_design(canvas_obj, design.design.filepath, x, y, width, height)
                    
            except Exception as e:
                logger.error(f"Tasarım render hatası {design.design.filename}: {e}")
                # Hata durumunda placeholder çiz
                self._draw_placeholder(canvas_obj, x, y, width, height, design.design.filename)
    
    def _render_pdf_design(self, canvas_obj, filepath, x, y, width, height):
        """PDF tasarımını render et"""
        try:
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Dosya bulunamadı: {filepath}")
                
            doc = fitz.open(filepath)
            if len(doc) == 0:
                raise ValueError(f"PDF boş: {filepath}")
                
            page = doc[0]
            
            # PDF'yi PNG'ye çevir - daha yüksek kalite
            mat = fitz.Matrix(3, 3)  # 3x zoom for better quality
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img_data = pix.tobytes("png")
            
            # Geçici dosya oluştur
            temp_path = os.path.join(self.temp_dir, f"pdf_render_{os.getpid()}_{hash(filepath)}.png")
            with open(temp_path, "wb") as f:
                f.write(img_data)
            
            # Canvas'a çiz - preserveAspectRatio yerine mask kullan
            canvas_obj.drawImage(temp_path, x, y, width, height, mask='auto')
            
            doc.close()
            
            # Temizlik
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        except Exception as e:
            logger.error(f"PDF render hatası {filepath}: {e}")
            # Hata durumunda placeholder çiz
            self._draw_placeholder(canvas_obj, x, y, width, height, os.path.basename(filepath))
    
    def _render_svg_design(self, canvas_obj, filepath, x, y, width, height):
        """SVG tasarımını render et"""
        temp_path = os.path.join(self.temp_dir, f"svg_temp_{os.getpid()}.png")
        cairosvg.svg2png(url=filepath, write_to=temp_path, dpi=300)
        canvas_obj.drawImage(temp_path, x, y, width, height, preserveAspectRatio=True)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
    
    def _render_raster_design(self, canvas_obj, filepath, x, y, width, height):
        """Raster görüntüyü render et"""
        canvas_obj.drawImage(filepath, x, y, width, height, preserveAspectRatio=True)
    
    def _draw_placeholder(self, canvas_obj, x, y, width, height, filename):
        """Hata durumunda placeholder çiz"""
        canvas_obj.setStrokeColor(colors.red)
        canvas_obj.setFillColor(colors.lightgrey)
        canvas_obj.rect(x, y, width, height, fill=1, stroke=1)
        
        canvas_obj.setFillColor(colors.red)
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawString(x + 2, y + height/2, f"HATA: {filename}")

def main():
    """Ana işlev - API çağrısından gelen verileri işle"""
    try:
        # Komut satırından JSON verisini al
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "error": "JSON verisi gerekli"}))
            return
        
        input_data = json.loads(sys.argv[1])
        
        files = input_data.get('files', [])
        page_width = float(input_data.get('pageWidth', 210))  # A4 default
        page_height = float(input_data.get('pageHeight', 297))
        cutting_space = float(input_data.get('cuttingSpace', 5))
        
        logger.info(f"🚀 Profesyonel dizim başlatılıyor...")
        logger.info(f"📁 {len(files)} dosya işlenecek")
        logger.info(f"📄 Sayfa boyutu: {page_width}x{page_height} mm")
        
        with ProfessionalLayoutEngine() as engine:
            # Dosyaları analiz et
            designs = []
            for file_path in files:
                if os.path.exists(file_path):
                    design = engine.analyze_design_file(file_path)
                    if design:
                        designs.append(design)
                        logger.info(f"✅ {design.filename}: {design.width_mm:.1f}x{design.height_mm:.1f} mm")
                else:
                    logger.warning(f"⚠️  Dosya bulunamadı: {file_path}")
            
            if not designs:
                print(json.dumps({"success": False, "error": "Hiç tasarım dosyası analiz edilemedi"}))
                return
            
            # Sayfa düzeni oluştur
            page_layout = PageLayout(
                width_mm=page_width,
                height_mm=page_height,
                cutting_space_mm=cutting_space
            )
            
            # Optimal dizimi hesapla
            pages = engine.calculate_optimal_layout(designs, page_layout)
            
            if not pages:
                print(json.dumps({"success": False, "error": "Hiçbir tasarım yerleştirilemedi"}))
                return
            
            # PDF oluştur
            output_path = input_data.get('outputPath', 'professional_layout.pdf')
            success = engine.generate_professional_pdf(pages, page_layout, output_path)
            
            if success:
                # İstatistikleri hesapla
                total_designs = sum(len(page) for page in pages)
                total_area = sum(
                    design.width_mm * design.height_mm 
                    for page in pages 
                    for design in page
                )
                page_area = page_width * page_height * len(pages)
                efficiency = (total_area / page_area) * 100 if page_area > 0 else 0
                
                result = {
                    "success": True,
                    "output_path": output_path,
                    "pages_created": len(pages),
                    "designs_placed": total_designs,
                    "total_designs": len(designs),
                    "efficiency_percent": round(efficiency, 2),
                    "statistics": {
                        "total_area_mm2": round(total_area, 2),
                        "page_area_mm2": round(page_area, 2),
                        "designs_per_page": round(total_designs / len(pages), 1)
                    }
                }
                
                logger.info(f"🎉 Başarıyla tamamlandı!")
                logger.info(f"📊 {total_designs}/{len(designs)} tasarım, {len(pages)} sayfa, %{efficiency:.1f} verimlilik")
                
                print(json.dumps(result))
            else:
                print(json.dumps({"success": False, "error": "PDF oluşturulamadı"}))
                
    except Exception as e:
        logger.error(f"❌ Ana işlev hatası: {e}")
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
