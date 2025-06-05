
import asyncio
import logging
import fitz
from pathlib import Path
from typing import Dict, List, Any, Tuple
import math
from ..models.arrangement import ArrangementRequest, DesignItem, ArrangementResult

logger = logging.getLogger(__name__)

class DesignArranger:
    def __init__(self):
        self.page_sizes = {
            "A4": (210, 297),    # mm
            "A3": (297, 420),    # mm
            "A5": (148, 210),    # mm
            "Letter": (215.9, 279.4),  # mm
        }
        self.temp_dir = Path("temp")
        self.temp_dir.mkdir(exist_ok=True)
    
    async def create_arrangement(self, request: ArrangementRequest) -> ArrangementResult:
        """Tasarımları optimal şekilde dizilir"""
        try:
            # Sayfa boyutlarını al
            page_width, page_height = self.page_sizes.get(request.page_size, (210, 297))
            
            # Rotasyon uygula
            if request.orientation == "landscape":
                page_width, page_height = page_height, page_width
            
            # Kullanılabilir alanı hesapla
            available_width = page_width - (2 * request.margin_mm)
            available_height = page_height - (2 * request.margin_mm)
            
            # Optimal dizilimi hesapla
            arrangement = await self._calculate_optimal_arrangement(
                request.designs,
                available_width,
                available_height,
                request.spacing_x_mm,
                request.spacing_y_mm,
                request.enable_rotation
            )
            
            # PDF oluştur
            pdf_path = await self._generate_arrangement_pdf(
                arrangement,
                page_width,
                page_height,
                request.margin_mm,
                request.spacing_x_mm,
                request.spacing_y_mm
            )
            
            return ArrangementResult(
                success=True,
                pdf_path=str(pdf_path),
                arrangement=arrangement,
                statistics=self._calculate_statistics(arrangement, available_width * available_height),
                page_info={
                    "size": request.page_size,
                    "orientation": request.orientation,
                    "width_mm": page_width,
                    "height_mm": page_height,
                    "available_width_mm": available_width,
                    "available_height_mm": available_height
                }
            )
            
        except Exception as e:
            logger.error(f"Dizilim hatası: {str(e)}")
            raise
    
    async def _calculate_optimal_arrangement(
        self,
        designs: List[DesignItem],
        available_width: float,
        available_height: float,
        spacing_x: float,
        spacing_y: float,
        enable_rotation: bool
    ) -> Dict[str, Any]:
        """Optimal dizilimi hesaplar"""
        
        arranged_items = []
        current_x = 0
        current_y = 0
        row_height = 0
        total_used_area = 0
        
        for design in designs:
            for copy_index in range(design.copies):
                # Rotasyon kontrolü
                width = design.width_mm
                height = design.height_mm
                rotated = False
                
                if enable_rotation and width > height:
                    # Eğer genişlik yükseklikten büyükse ve rotate etmek daha verimli ise
                    if height <= available_width - current_x and width <= available_height:
                        width, height = height, width
                        rotated = True
                
                # Mevcut satıra sığar mı kontrol et
                if current_x + width > available_width:
                    # Yeni satıra geç
                    current_x = 0
                    current_y += row_height + spacing_y
                    row_height = 0
                
                # Sayfaya sığar mı kontrol et
                if current_y + height > available_height:
                    logger.warning(f"Tasarım sayfaya sığmıyor: {design.filename}")
                    break
                
                # Tasarımı yerleştir
                arranged_items.append({
                    "filename": design.filename,
                    "x": current_x,
                    "y": current_y,
                    "width": width,
                    "height": height,
                    "rotated": rotated,
                    "copy_number": copy_index + 1,
                    "area": width * height
                })
                
                # Pozisyonu güncelle
                current_x += width + spacing_x
                row_height = max(row_height, height)
                total_used_area += width * height
        
        return {
            "items": arranged_items,
            "total_items": len(arranged_items),
            "total_used_area": total_used_area,
            "rows_used": math.ceil(current_y / (row_height + spacing_y)) if row_height > 0 else 1
        }
    
    async def _generate_arrangement_pdf(
        self,
        arrangement: Dict[str, Any],
        page_width: float,
        page_height: float,
        margin: float,
        spacing_x: float,
        spacing_y: float
    ) -> Path:
        """Dizilim PDF'ini oluşturur"""
        
        # Yeni PDF oluştur
        doc = fitz.open()
        
        # Sayfa ekle (mm'yi points'e çevir)
        page_width_pt = page_width * 2.834645669
        page_height_pt = page_height * 2.834645669
        margin_pt = margin * 2.834645669
        
        page = doc.new_page(width=page_width_pt, height=page_height_pt)
        
        # Her tasarımı yerleştir
        for item in arrangement["items"]:
            try:
                # Tasarım dosyasını aç
                design_doc = fitz.open(item["filename"])
                design_page = design_doc[0]
                
                # Pozisyon hesapla (mm'yi points'e çevir)
                x_pt = (margin + item["x"]) * 2.834645669
                y_pt = (margin + item["y"]) * 2.834645669
                width_pt = item["width"] * 2.834645669
                height_pt = item["height"] * 2.834645669
                
                # Hedef rect
                target_rect = fitz.Rect(x_pt, y_pt, x_pt + width_pt, y_pt + height_pt)
                
                # Rotasyon matrisini uygula
                matrix = fitz.Identity
                if item["rotated"]:
                    # 90 derece döndür
                    matrix = fitz.Matrix(0, 1, -1, 0, width_pt, 0)
                
                # Tasarımı sayfaya yerleştir
                page.show_pdf_page(target_rect, design_doc, 0, matrix=matrix)
                
                design_doc.close()
                
            except Exception as e:
                logger.error(f"Tasarım yerleştirme hatası {item['filename']}: {str(e)}")
                continue
        
        # Kesim çizgilerini ekle (opsiyonel)
        await self._add_cutting_lines(page, arrangement, margin_pt)
        
        # PDF'yi kaydet
        output_path = self.temp_dir / f"arrangement_{len(arrangement['items'])}_items.pdf"
        doc.save(str(output_path))
        doc.close()
        
        return output_path
    
    async def _add_cutting_lines(self, page: fitz.Page, arrangement: Dict, margin_pt: float):
        """Kesim çizgilerini ekler"""
        try:
            # İnce kesim çizgileri için ayarlar
            line_color = (0.7, 0.7, 0.7)  # Açık gri
            line_width = 0.5
            
            for item in arrangement["items"]:
                x_pt = (margin_pt / 2.834645669 + item["x"]) * 2.834645669
                y_pt = (margin_pt / 2.834645669 + item["y"]) * 2.834645669
                width_pt = item["width"] * 2.834645669
                height_pt = item["height"] * 2.834645669
                
                # Kesim çerçevesi çiz
                rect = fitz.Rect(x_pt, y_pt, x_pt + width_pt, y_pt + height_pt)
                page.draw_rect(rect, color=line_color, width=line_width)
                
        except Exception as e:
            logger.warning(f"Kesim çizgileri eklenemedi: {str(e)}")
    
    def _calculate_statistics(self, arrangement: Dict, total_available_area: float) -> Dict[str, Any]:
        """Dizilim istatistiklerini hesaplar"""
        total_used_area = arrangement.get("total_used_area", 0)
        total_items = arrangement.get("total_items", 0)
        
        efficiency = (total_used_area / total_available_area * 100) if total_available_area > 0 else 0
        
        return {
            "total_items": total_items,
            "total_used_area_mm2": round(total_used_area, 2),
            "total_available_area_mm2": round(total_available_area, 2),
            "efficiency_percentage": round(efficiency, 1),
            "waste_area_mm2": round(total_available_area - total_used_area, 2),
            "average_item_area_mm2": round(total_used_area / total_items, 2) if total_items > 0 else 0
        }
