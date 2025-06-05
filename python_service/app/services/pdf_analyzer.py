
import fitz  # PyMuPDF
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
import numpy as np
from ..utils.pdf_utils import PDFUtils
from ..utils.vector_utils import VectorUtils

logger = logging.getLogger(__name__)

class PDFAnalyzer:
    def __init__(self):
        self.pdf_utils = PDFUtils()
        self.vector_utils = VectorUtils()
    
    async def analyze_pdf(self, file_path: str) -> Dict[str, Any]:
        """PDF dosyasını kapsamlı analiz eder"""
        try:
            # PDF'yi aç
            doc = fitz.open(file_path)
            
            if len(doc) == 0:
                raise ValueError("PDF boş veya bozuk")
            
            # İlk sayfayı analiz et
            page = doc[0]
            
            # Temel analiz
            basic_analysis = await self._analyze_basic_properties(page)
            
            # Boyut analizi
            dimension_analysis = await self._analyze_dimensions(page)
            
            # İçerik analizi
            content_analysis = await self._analyze_content(page)
            
            # Kalite analizi
            quality_analysis = await self._analyze_quality(page)
            
            doc.close()
            
            return {
                "basic": basic_analysis,
                "dimensions": dimension_analysis,
                "content": content_analysis,
                "quality": quality_analysis,
                "recommendations": self._generate_recommendations(
                    basic_analysis, dimension_analysis, content_analysis, quality_analysis
                )
            }
            
        except Exception as e:
            logger.error(f"PDF analiz hatası: {str(e)}")
            raise
    
    async def _analyze_basic_properties(self, page: fitz.Page) -> Dict[str, Any]:
        """Temel PDF özelliklerini analiz eder"""
        rect = page.rect
        
        return {
            "page_width_pt": rect.width,
            "page_height_pt": rect.height,
            "page_width_mm": rect.width * 0.352778,
            "page_height_mm": rect.height * 0.352778,
            "rotation": page.rotation,
            "has_mediabox": bool(page.mediabox),
            "has_cropbox": bool(page.cropbox),
            "has_trimbox": hasattr(page, 'trimbox') and bool(page.trimbox),
            "has_artbox": hasattr(page, 'artbox') and bool(page.artbox)
        }
    
    async def _analyze_dimensions(self, page: fitz.Page) -> Dict[str, Any]:
        """Boyut analizi yapar"""
        rect = page.rect
        
        # MediaBox
        mediabox = page.mediabox
        media_width_mm = mediabox.width * 0.352778 if mediabox else None
        media_height_mm = mediabox.height * 0.352778 if mediabox else None
        
        # CropBox
        cropbox = page.cropbox
        crop_width_mm = cropbox.width * 0.352778 if cropbox else None
        crop_height_mm = cropbox.height * 0.352778 if cropbox else None
        
        # TrimBox (eğer varsa)
        trim_width_mm = None
        trim_height_mm = None
        if hasattr(page, 'trimbox') and page.trimbox:
            trim_width_mm = page.trimbox.width * 0.352778
            trim_height_mm = page.trimbox.height * 0.352778
        
        # En uygun boyutları belirle
        effective_width_mm = trim_width_mm or crop_width_mm or media_width_mm
        effective_height_mm = trim_height_mm or crop_height_mm or media_height_mm
        
        return {
            "mediabox": {
                "width_mm": media_width_mm,
                "height_mm": media_height_mm
            },
            "cropbox": {
                "width_mm": crop_width_mm,
                "height_mm": crop_height_mm
            },
            "trimbox": {
                "width_mm": trim_width_mm,
                "height_mm": trim_height_mm
            },
            "effective_dimensions": {
                "width_mm": effective_width_mm,
                "height_mm": effective_height_mm,
                "aspect_ratio": effective_width_mm / effective_height_mm if effective_height_mm else 1.0
            },
            "confidence": 0.9 if trim_width_mm else 0.7 if crop_width_mm else 0.5
        }
    
    async def _analyze_content(self, page: fitz.Page) -> Dict[str, Any]:
        """İçerik analizi yapar"""
        # Metin analizi
        text_dict = page.get_text("dict")
        text_blocks = text_dict.get("blocks", [])
        text_content = page.get_text().strip()
        
        # Görsel objeler
        images = page.get_images()
        drawings = page.get_drawings()
        
        # Vektörel içerik analizi
        vector_content = len(drawings) > 0
        raster_content = len(images) > 0
        text_heavy = len(text_content) > 100
        
        return {
            "has_text": bool(text_content),
            "text_length": len(text_content),
            "text_blocks_count": len(text_blocks),
            "has_images": raster_content,
            "image_count": len(images),
            "has_vector_content": vector_content,
            "drawing_count": len(drawings),
            "is_text_heavy": text_heavy,
            "is_vector_based": vector_content and not raster_content,
            "is_empty": not (text_content or images or drawings),
            "complexity_score": self._calculate_complexity_score(
                len(text_blocks), len(images), len(drawings)
            )
        }
    
    async def _analyze_quality(self, page: fitz.Page) -> Dict[str, Any]:
        """Kalite analizi yapar"""
        images = page.get_images()
        
        # Görüntü kalitesi analizi
        low_res_images = 0
        total_image_area = 0
        
        for img_index, img in enumerate(images):
            try:
                # Görüntü bilgilerini al
                img_rect = page.get_image_rects(img[0])
                if img_rect:
                    for rect in img_rect:
                        area = rect.width * rect.height
                        total_image_area += area
                        
                        # DPI hesapla (yaklaşık)
                        estimated_dpi = (rect.width * 72) / (rect.width * 0.352778)
                        if estimated_dpi < 150:
                            low_res_images += 1
            except:
                continue
        
        return {
            "total_images": len(images),
            "low_resolution_images": low_res_images,
            "estimated_print_quality": "high" if low_res_images == 0 else "medium" if low_res_images < len(images)/2 else "low",
            "total_image_area_pt": total_image_area,
            "has_quality_issues": low_res_images > 0
        }
    
    def _calculate_complexity_score(self, text_blocks: int, images: int, drawings: int) -> float:
        """Karmaşıklık skoru hesaplar (0-1 arası)"""
        score = 0.0
        score += min(text_blocks / 10, 0.3)  # Metin karmaşıklığı
        score += min(images / 5, 0.3)       # Görüntü karmaşıklığı
        score += min(drawings / 20, 0.4)    # Vektörel karmaşıklık
        return min(score, 1.0)
    
    def _generate_recommendations(self, basic: Dict, dimensions: Dict, content: Dict, quality: Dict) -> List[str]:
        """Analiz sonuçlarına göre öneriler üretir"""
        recommendations = []
        
        # Boyut önerileri
        if dimensions["confidence"] < 0.7:
            recommendations.append("PDF'de trim box tanımlanmamış - manuel boyut kontrolü önerilir")
        
        # Kalite önerileri
        if quality["has_quality_issues"]:
            recommendations.append("Düşük çözünürlüklü görüntüler tespit edildi - baskı kalitesi etkilenebilir")
        
        # İçerik önerileri
        if content["is_empty"]:
            recommendations.append("PDF'de görünür içerik tespit edilmedi")
        elif not content["is_vector_based"] and content["has_images"]:
            recommendations.append("Vektörel tasarım önerilir - daha iyi baskı kalitesi için")
        
        # Boyut önerileri
        eff_dims = dimensions["effective_dimensions"]
        if eff_dims["width_mm"] < 10 or eff_dims["height_mm"] < 10:
            recommendations.append("Çok küçük boyutlar - minimum baskı boyutunu kontrol edin")
        elif eff_dims["width_mm"] > 350 or eff_dims["height_mm"] > 500:
            recommendations.append("Büyük boyutlar - standart kağıt boyutları için ölçeklendirme gerekebilir")
        
        return recommendations
