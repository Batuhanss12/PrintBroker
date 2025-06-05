
import numpy as np
import math
from typing import List, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class VectorUtils:
    @staticmethod
    def calculate_area(width: float, height: float) -> float:
        """Alan hesaplar"""
        return width * height
    
    @staticmethod
    def calculate_aspect_ratio(width: float, height: float) -> float:
        """En boy oranını hesaplar"""
        return width / height if height > 0 else 1.0
    
    @staticmethod
    def rotate_dimensions(width: float, height: float) -> Tuple[float, float]:
        """Boyutları 90 derece döndürür"""
        return height, width
    
    @staticmethod
    def calculate_optimal_rotation(item_width: float, item_height: float, 
                                 available_width: float, available_height: float) -> bool:
        """Optimal rotasyonu hesaplar"""
        # Normal yerleştirme
        fits_normal = item_width <= available_width and item_height <= available_height
        
        # Döndürülmüş yerleştirme
        fits_rotated = item_height <= available_width and item_width <= available_height
        
        if fits_normal and fits_rotated:
            # Her ikisi de sığıyorsa, daha verimli olanı seç
            normal_efficiency = (item_width * item_height) / (available_width * available_height)
            rotated_efficiency = (item_height * item_width) / (available_width * available_height)
            return rotated_efficiency > normal_efficiency
        elif fits_rotated and not fits_normal:
            return True
        else:
            return False
    
    @staticmethod
    def pack_rectangles(rectangles: List[Dict[str, float]], 
                       container_width: float, container_height: float,
                       spacing: float = 0) -> List[Dict[str, Any]]:
        """Dikdörtgenleri konteyner içinde optimal şekilde paketler"""
        packed = []
        current_x = 0
        current_y = 0
        row_height = 0
        
        # Yüksekliğe göre sırala (en yüksek önce)
        sorted_rectangles = sorted(rectangles, key=lambda r: r['height'], reverse=True)
        
        for i, rect in enumerate(sorted_rectangles):
            width = rect['width']
            height = rect['height']
            
            # Mevcut satıra sığar mı?
            if current_x + width > container_width:
                # Yeni satıra geç
                current_x = 0
                current_y += row_height + spacing
                row_height = 0
            
            # Konteyner yüksekliğini aşar mı?
            if current_y + height > container_height:
                logger.warning(f"Dikdörtgen {i} konteyner yüksekliğini aşıyor")
                break
            
            # Dikdörtgeni yerleştir
            packed.append({
                'index': i,
                'x': current_x,
                'y': current_y,
                'width': width,
                'height': height,
                'area': width * height
            })
            
            # Pozisyonu güncelle
            current_x += width + spacing
            row_height = max(row_height, height)
        
        return packed
    
    @staticmethod
    def calculate_packing_efficiency(packed_items: List[Dict], 
                                   container_width: float, container_height: float) -> float:
        """Paketleme verimliliğini hesaplar"""
        total_item_area = sum(item['area'] for item in packed_items)
        container_area = container_width * container_height
        
        return (total_item_area / container_area) * 100 if container_area > 0 else 0
    
    @staticmethod
    def optimize_layout(items: List[Dict], container_width: float, container_height: float,
                       spacing: float = 0, allow_rotation: bool = True) -> Dict[str, Any]:
        """Layout'u optimize eder"""
        if not items:
            return {"items": [], "efficiency": 0, "total_area": 0}
        
        best_layout = None
        best_efficiency = 0
        
        # Farklı sıralama stratejilerini dene
        strategies = [
            lambda x: sorted(x, key=lambda i: i['height'], reverse=True),  # Yükseklik
            lambda x: sorted(x, key=lambda i: i['width'], reverse=True),   # Genişlik
            lambda x: sorted(x, key=lambda i: i['area'], reverse=True),    # Alan
            lambda x: sorted(x, key=lambda i: i['area'])                   # Alan (küçükten büyüğe)
        ]
        
        for strategy in strategies:
            # Normal orientasyon
            sorted_items = strategy(items.copy())
            layout = VectorUtils.pack_rectangles(sorted_items, container_width, container_height, spacing)
            efficiency = VectorUtils.calculate_packing_efficiency(layout, container_width, container_height)
            
            if efficiency > best_efficiency:
                best_efficiency = efficiency
                best_layout = layout
            
            # Rotasyon ile (eğer izin verilmişse)
            if allow_rotation:
                rotated_items = []
                for item in items:
                    # Her item için hem normal hem döndürülmüş halini dene
                    normal_item = item.copy()
                    rotated_item = item.copy()
                    rotated_item['width'], rotated_item['height'] = item['height'], item['width']
                    rotated_item['rotated'] = True
                    
                    # Hangisi daha iyi sığıyorsa onu al
                    if VectorUtils.calculate_optimal_rotation(
                        item['width'], item['height'], container_width, container_height
                    ):
                        rotated_items.append(rotated_item)
                    else:
                        rotated_items.append(normal_item)
                
                sorted_rotated = strategy(rotated_items)
                rotated_layout = VectorUtils.pack_rectangles(sorted_rotated, container_width, container_height, spacing)
                rotated_efficiency = VectorUtils.calculate_packing_efficiency(rotated_layout, container_width, container_height)
                
                if rotated_efficiency > best_efficiency:
                    best_efficiency = rotated_efficiency
                    best_layout = rotated_layout
        
        total_area = sum(item['area'] for item in best_layout) if best_layout else 0
        
        return {
            "items": best_layout or [],
            "efficiency": best_efficiency,
            "total_area": total_area,
            "items_placed": len(best_layout) if best_layout else 0
        }
