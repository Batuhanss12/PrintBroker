
import fitz
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Tuple
import numpy as np
from PIL import Image
import io

logger = logging.getLogger(__name__)

class DesignExtractor:
    def __init__(self):
        self.temp_dir = Path("temp")
        self.temp_dir.mkdir(exist_ok=True)
    
    async def extract_design(self, file_path: str) -> Dict[str, Any]:
        """PDF'den tasarım çıkarır"""
        try:
            doc = fitz.open(file_path)
            page = doc[0]
            
            # İçerik sınırlarını tespit et
            content_bounds = await self._detect_content_bounds(page)
            
            # Temizlenmiş tasarımı çıkar
            extracted_design = await self._extract_clean_design(page, content_bounds)
            
            # Boyutları hesapla
            dimensions = await self._calculate_extracted_dimensions(content_bounds)
            
            doc.close()
            
            return {
                "success": True,
                "content_bounds": content_bounds,
                "dimensions": dimensions,
                "extracted_file_path": extracted_design["file_path"],
                "optimization_applied": extracted_design["optimized"],
                "extraction_notes": extracted_design["notes"]
            }
            
        except Exception as e:
            logger.error(f"Tasarım çıkarma hatası: {str(e)}")
            raise
    
    async def _detect_content_bounds(self, page: fitz.Page) -> Dict[str, float]:
        """Aktif içerik sınırlarını tespit eder"""
        # Tüm çizimleri ve nesneleri al
        drawings = page.get_drawings()
        images = page.get_images()
        text_dict = page.get_text("dict")
        
        # Koordinat sınırlarını başlat
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')
        
        # Çizimlerden sınırları hesapla
        for drawing in drawings:
            for item in drawing.get("items", []):
                if "rect" in item:
                    rect = item["rect"]
                    min_x = min(min_x, rect.x0)
                    min_y = min(min_y, rect.y0)
                    max_x = max(max_x, rect.x1)
                    max_y = max(max_y, rect.y1)
        
        # Görüntülerden sınırları hesapla
        for img_index, img in enumerate(images):
            img_rects = page.get_image_rects(img[0])
            for rect in img_rects:
                min_x = min(min_x, rect.x0)
                min_y = min(min_y, rect.y0)
                max_x = max(max_x, rect.x1)
                max_y = max(max_y, rect.y1)
        
        # Metinlerden sınırları hesapla
        for block in text_dict.get("blocks", []):
            if "bbox" in block:
                bbox = block["bbox"]
                min_x = min(min_x, bbox[0])
                min_y = min(min_y, bbox[1])
                max_x = max(max_x, bbox[2])
                max_y = max(max_y, bbox[3])
        
        # Sınırlar bulunamadıysa sayfa sınırlarını kullan
        if min_x == float('inf'):
            page_rect = page.rect
            min_x, min_y = page_rect.x0, page_rect.y0
            max_x, max_y = page_rect.x1, page_rect.y1
        
        # Küçük bir margin ekle
        margin = 2  # points
        min_x = max(0, min_x - margin)
        min_y = max(0, min_y - margin)
        max_x = min(page.rect.width, max_x + margin)
        max_y = min(page.rect.height, max_y + margin)
        
        return {
            "x0": min_x,
            "y0": min_y,
            "x1": max_x,
            "y1": max_y,
            "width": max_x - min_x,
            "height": max_y - min_y
        }
    
    async def _extract_clean_design(self, page: fitz.Page, content_bounds: Dict) -> Dict[str, Any]:
        """Temizlenmiş tasarımı çıkarır"""
        try:
            # Yeni PDF oluştur
            new_doc = fitz.open()
            
            # İçerik sınırlarına göre yeni sayfa boyutu
            new_width = content_bounds["width"]
            new_height = content_bounds["height"]
            
            # Yeni sayfa ekle
            new_page = new_doc.new_page(width=new_width, height=new_height)
            
            # Offset hesapla
            offset_x = -content_bounds["x0"]
            offset_y = -content_bounds["y0"]
            
            # İçeriği kopyala
            source_rect = fitz.Rect(
                content_bounds["x0"],
                content_bounds["y0"],
                content_bounds["x1"],
                content_bounds["y1"]
            )
            
            target_rect = fitz.Rect(0, 0, new_width, new_height)
            
            # Sayfayı kopyala
            new_page.show_pdf_page(target_rect, page.parent, page.number, clip=source_rect)
            
            # Çıktı dosyası kaydet
            output_path = self.temp_dir / f"extracted_{Path(page.parent.name).stem}.pdf"
            new_doc.save(str(output_path))
            new_doc.close()
            
            return {
                "file_path": str(output_path),
                "optimized": True,
                "notes": [
                    "Boş alanlar temizlendi",
                    "İçerik sınırlarına göre kırpıldı",
                    f"Yeni boyutlar: {new_width:.1f}x{new_height:.1f}pt"
                ]
            }
            
        except Exception as e:
            logger.error(f"Temizleme hatası: {str(e)}")
            return {
                "file_path": None,
                "optimized": False,
                "notes": [f"Temizleme başarısız: {str(e)}"]
            }
    
    async def _calculate_extracted_dimensions(self, content_bounds: Dict) -> Dict[str, Any]:
        """Çıkarılan tasarımın boyutlarını hesaplar"""
        width_pt = content_bounds["width"]
        height_pt = content_bounds["height"]
        
        # Points'i mm'ye çevir
        width_mm = width_pt * 0.352778
        height_mm = height_pt * 0.352778
        
        return {
            "width_pt": width_pt,
            "height_pt": height_pt,
            "width_mm": round(width_mm, 2),
            "height_mm": round(height_mm, 2),
            "aspect_ratio": round(width_mm / height_mm, 3) if height_mm > 0 else 1.0,
            "area_mm2": round(width_mm * height_mm, 2)
        }
