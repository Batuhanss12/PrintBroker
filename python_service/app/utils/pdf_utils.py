
import fitz
import logging
from typing import Dict, Any, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

class PDFUtils:
    @staticmethod
    def points_to_mm(points: float) -> float:
        """Points'i milimetreye çevirir"""
        return points * 0.352778
    
    @staticmethod
    def mm_to_points(mm: float) -> float:
        """Milimetreyi points'e çevirir"""
        return mm * 2.834645669
    
    @staticmethod
    def get_pdf_info(file_path: str) -> Dict[str, Any]:
        """PDF hakkında temel bilgileri alır"""
        try:
            doc = fitz.open(file_path)
            
            if len(doc) == 0:
                return {"error": "PDF boş"}
            
            page = doc[0]
            rect = page.rect
            
            info = {
                "page_count": len(doc),
                "page_width_pt": rect.width,
                "page_height_pt": rect.height,
                "page_width_mm": PDFUtils.points_to_mm(rect.width),
                "page_height_mm": PDFUtils.points_to_mm(rect.height),
                "rotation": page.rotation,
                "has_content": bool(page.get_text().strip() or page.get_images() or page.get_drawings())
            }
            
            doc.close()
            return info
            
        except Exception as e:
            logger.error(f"PDF info hatası: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    def validate_pdf(file_path: str) -> Tuple[bool, str]:
        """PDF dosyasını doğrular"""
        try:
            if not Path(file_path).exists():
                return False, "Dosya bulunamadı"
            
            doc = fitz.open(file_path)
            
            if len(doc) == 0:
                doc.close()
                return False, "PDF boş"
            
            # İlk sayfayı kontrol et
            page = doc[0]
            rect = page.rect
            
            if rect.width <= 0 or rect.height <= 0:
                doc.close()
                return False, "Geçersiz sayfa boyutları"
            
            doc.close()
            return True, "PDF geçerli"
            
        except Exception as e:
            return False, f"PDF doğrulama hatası: {str(e)}"
    
    @staticmethod
    def extract_text_content(file_path: str) -> str:
        """PDF'den metin içeriğini çıkarır"""
        try:
            doc = fitz.open(file_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                text += page.get_text()
            
            doc.close()
            return text.strip()
            
        except Exception as e:
            logger.error(f"Metin çıkarma hatası: {str(e)}")
            return ""
    
    @staticmethod
    def get_bounding_box(file_path: str) -> Optional[Dict[str, float]]:
        """PDF içeriğinin bounding box'ını bulur"""
        try:
            doc = fitz.open(file_path)
            page = doc[0]
            
            # Tüm içerik objelerini al
            drawings = page.get_drawings()
            images = page.get_images()
            text_dict = page.get_text("dict")
            
            min_x, min_y = float('inf'), float('inf')
            max_x, max_y = float('-inf'), float('-inf')
            
            # Çizimlerden koordinatları al
            for drawing in drawings:
                for item in drawing.get("items", []):
                    if "rect" in item:
                        rect = item["rect"]
                        min_x = min(min_x, rect.x0)
                        min_y = min(min_y, rect.y0)
                        max_x = max(max_x, rect.x1)
                        max_y = max(max_y, rect.y1)
            
            # Görüntülerden koordinatları al
            for img_index, img in enumerate(images):
                img_rects = page.get_image_rects(img[0])
                for rect in img_rects:
                    min_x = min(min_x, rect.x0)
                    min_y = min(min_y, rect.y0)
                    max_x = max(max_x, rect.x1)
                    max_y = max(max_y, rect.y1)
            
            # Metinlerden koordinatları al
            for block in text_dict.get("blocks", []):
                if "bbox" in block:
                    bbox = block["bbox"]
                    min_x = min(min_x, bbox[0])
                    min_y = min(min_y, bbox[1])
                    max_x = max(max_x, bbox[2])
                    max_y = max(max_y, bbox[3])
            
            doc.close()
            
            if min_x == float('inf'):
                return None
            
            return {
                "x0": min_x,
                "y0": min_y,
                "x1": max_x,
                "y1": max_y,
                "width": max_x - min_x,
                "height": max_y - min_y,
                "width_mm": PDFUtils.points_to_mm(max_x - min_x),
                "height_mm": PDFUtils.points_to_mm(max_y - min_y)
            }
            
        except Exception as e:
            logger.error(f"Bounding box hatası: {str(e)}")
            return None
