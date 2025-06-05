#!/usr/bin/env python3
import sys
import json
import os
from pathlib import Path

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

class EnhancedPDFAnalyzer:
    def __init__(self):
        self.mm_per_point = 25.4 / 72.0
        self.point_per_mm = 72.0 / 25.4
        
    def analyze_pdf(self, file_path, file_name):
        """Gelişmiş PDF analizi - çoklu yöntem"""
        result = {
            'success': False,
            'dimensions': {
                'widthMM': 50,
                'heightMM': 30,
                'confidence': 0.1,
                'method': 'manual',
                'description': 'Analysis failed'
            },
            'boxes': {},
            'contentAnalysis': {
                'hasVectorContent': False,
                'hasRasterContent': False,
                'hasText': False,
                'isEmpty': True,
                'contentBounds': None
            },
            'qualityReport': {
                'isVectorBased': False,
                'hasProperBoxes': False,
                'needsOptimization': True,
                'warnings': [],
                'recommendations': []
            },
            'processingNotes': [],
            'error': None
        }
        
        if not PYMUPDF_AVAILABLE:
            result['error'] = 'PyMuPDF not available'
            result['processingNotes'].append('Missing required library: PyMuPDF')
            result['qualityReport']['recommendations'].append('Install PyMuPDF for PDF analysis')
            return result
            
        try:
            # Ana PDF analizi
            doc = fitz.open(file_path)
            if len(doc) == 0:
                result['error'] = 'PDF contains no pages'
                result['processingNotes'].append('Empty PDF file')
                return result
                
            page = doc[0]  # İlk sayfa
            result['processingNotes'].append(f'Analyzing page 1 of {len(doc)}')
            
            # 1. PDF Kutuları Analizi
            boxes_result = self.analyze_pdf_boxes(page)
            result['boxes'] = boxes_result['boxes']
            result['qualityReport']['hasProperBoxes'] = boxes_result['hasProperBoxes']
            
            # 2. İçerik Analizi
            content_result = self.analyze_content(page)
            result['contentAnalysis'] = content_result
            
            # 3. Boyut Tespiti - Çoklu Yöntem
            dimension_result = self.determine_dimensions(page, boxes_result, content_result)
            result['dimensions'] = dimension_result
            result['success'] = dimension_result['confidence'] > 0.3
            
            # 4. Kalite Değerlendirmesi
            quality_result = self.evaluate_quality(page, boxes_result, content_result, dimension_result)
            result['qualityReport'].update(quality_result)
            
            # 5. İşleme Notları
            result['processingNotes'].extend(self.generate_processing_notes(
                boxes_result, content_result, dimension_result, quality_result
            ))
            
            doc.close()
            
        except Exception as e:
            result['error'] = str(e)
            result['processingNotes'].append(f'Analysis failed: {str(e)}')
            
        return result
    
    def analyze_pdf_boxes(self, page):
        """PDF kutuları analizi (MediaBox, TrimBox, ArtBox, BleedBox)"""
        boxes = {}
        has_proper_boxes = False
        
        try:
            # MediaBox (sayfa boyutu)
            media_box = page.mediabox
            boxes['mediaBox'] = {
                'x': float(media_box.x0),
                'y': float(media_box.y0),
                'width': float(media_box.width),
                'height': float(media_box.height)
            }
            
            # TrimBox (kesim alanı)
            if hasattr(page, 'trimbox') and page.trimbox:
                trim_box = page.trimbox
                boxes['trimBox'] = {
                    'x': float(trim_box.x0),
                    'y': float(trim_box.y0),
                    'width': float(trim_box.width),
                    'height': float(trim_box.height)
                }
                has_proper_boxes = True
            
            # ArtBox (sanat alanı)
            if hasattr(page, 'artbox') and page.artbox:
                art_box = page.artbox
                boxes['artBox'] = {
                    'x': float(art_box.x0),
                    'y': float(art_box.y0),
                    'width': float(art_box.width),
                    'height': float(art_box.height)
                }
                has_proper_boxes = True
            
            # BleedBox (taşma alanı)
            if hasattr(page, 'bleedbox') and page.bleedbox:
                bleed_box = page.bleedbox
                boxes['bleedBox'] = {
                    'x': float(bleed_box.x0),
                    'y': float(bleed_box.y0),
                    'width': float(bleed_box.width),
                    'height': float(bleed_box.height)
                }
                
        except Exception as e:
            print(f"Box analysis error: {e}", file=sys.stderr)
            
        return {
            'boxes': boxes,
            'hasProperBoxes': has_proper_boxes
        }
    
    def analyze_content(self, page):
        """İçerik analizi - vektör, raster, metin tespiti"""
        content_analysis = {
            'hasVectorContent': False,
            'hasRasterContent': False,
            'hasText': False,
            'isEmpty': True,
            'contentBounds': None
        }
        
        try:
            # Metin kontrolü
            text = page.get_text().strip()
            content_analysis['hasText'] = len(text) > 0
            
            # Vektör içerik kontrolü (çizimler, yollar)
            drawings = page.get_drawings()
            content_analysis['hasVectorContent'] = len(drawings) > 0
            
            # Raster içerik kontrolü (resimler)
            images = page.get_images()
            content_analysis['hasRasterContent'] = len(images) > 0
            
            # İçerik sınırları tespiti
            if drawings or images or content_analysis['hasText']:
                content_analysis['isEmpty'] = False
                content_bounds = self.calculate_content_bounds(page, drawings)
                if content_bounds:
                    content_analysis['contentBounds'] = content_bounds
                    
        except Exception as e:
            print(f"Content analysis error: {e}", file=sys.stderr)
            
        return content_analysis
    
    def calculate_content_bounds(self, page, drawings):
        """İçeriğin gerçek sınırlarını hesapla"""
        try:
            xs = []
            ys = []
            
            # Çizim nesnelerinden koordinatları topla
            for drawing in drawings:
                for item in drawing.get('items', []):
                    if 'rect' in item:
                        rect = item['rect']
                        xs.extend([rect.x0, rect.x1])
                        ys.extend([rect.y0, rect.y1])
                    elif 'quad' in item:
                        quad = item['quad']
                        xs.extend([quad.x0, quad.x1, quad.x2, quad.x3])
                        ys.extend([quad.y0, quad.y1, quad.y2, quad.y3])
            
            # Metin bloklarından koordinatları topla
            text_blocks = page.get_text("dict")
            for block in text_blocks.get("blocks", []):
                if "bbox" in block:
                    bbox = block["bbox"]
                    xs.extend([bbox[0], bbox[2]])
                    ys.extend([bbox[1], bbox[3]])
            
            if xs and ys:
                return {
                    'x': float(min(xs)),
                    'y': float(min(ys)),
                    'width': float(max(xs) - min(xs)),
                    'height': float(max(ys) - min(ys))
                }
                
        except Exception as e:
            print(f"Content bounds calculation error: {e}", file=sys.stderr)
            
        return None
    
    def determine_dimensions(self, page, boxes_result, content_result):
        """Boyut tespiti - çoklu yöntem ile en iyi sonucu bul"""
        candidates = []
        
        # Yöntem 1: TrimBox kullan (en güvenilir)
        if 'trimBox' in boxes_result['boxes']:
            trim_box = boxes_result['boxes']['trimBox']
            width_mm = round(trim_box['width'] * self.mm_per_point, 1)
            height_mm = round(trim_box['height'] * self.mm_per_point, 1)
            candidates.append({
                'widthMM': width_mm,
                'heightMM': height_mm,
                'confidence': 0.95,
                'method': 'trimbox',
                'description': f'TrimBox analysis: {width_mm}x{height_mm}mm'
            })
        
        # Yöntem 2: ArtBox kullan
        if 'artBox' in boxes_result['boxes']:
            art_box = boxes_result['boxes']['artBox']
            width_mm = round(art_box['width'] * self.mm_per_point, 1)
            height_mm = round(art_box['height'] * self.mm_per_point, 1)
            candidates.append({
                'widthMM': width_mm,
                'heightMM': height_mm,
                'confidence': 0.85,
                'method': 'artbox',
                'description': f'ArtBox analysis: {width_mm}x{height_mm}mm'
            })
        
        # Yöntem 3: İçerik sınırları kullan
        if content_result['contentBounds']:
            bounds = content_result['contentBounds']
            width_mm = round(bounds['width'] * self.mm_per_point, 1)
            height_mm = round(bounds['height'] * self.mm_per_point, 1)
            
            # Küçük tasarımları tespit et (5x2cm gibi)
            confidence = 0.7 if width_mm >= 10 and height_mm >= 10 else 0.6
            
            candidates.append({
                'widthMM': max(width_mm, 5),  # Minimum 5mm
                'heightMM': max(height_mm, 5),
                'confidence': confidence,
                'method': 'content',
                'description': f'Content bounds analysis: {width_mm}x{height_mm}mm'
            })
        
        # Yöntem 4: MediaBox kullan (son çare)
        if 'mediaBox' in boxes_result['boxes'] and not candidates:
            media_box = boxes_result['boxes']['mediaBox']
            width_mm = round(media_box['width'] * self.mm_per_point, 1)
            height_mm = round(media_box['height'] * self.mm_per_point, 1)
            
            # Büyük sayfa boyutlarını otomatik ölçekle
            if width_mm > 300 or height_mm > 400:
                # A4+ boyutları tespit edilirse içerik analizi yap
                scale_factor = min(300 / width_mm, 400 / height_mm) if width_mm > 300 or height_mm > 400 else 1
                width_mm = round(width_mm * scale_factor, 1)
                height_mm = round(height_mm * scale_factor, 1)
                
            candidates.append({
                'widthMM': width_mm,
                'heightMM': height_mm,
                'confidence': 0.4,
                'method': 'mediabox',
                'description': f'MediaBox analysis (scaled): {width_mm}x{height_mm}mm'
            })
        
        # En iyi adayı seç
        if candidates:
            best = max(candidates, key=lambda x: x['confidence'])
            return best
        else:
            # Fallback - varsayılan boyutlar
            return {
                'widthMM': 50,
                'heightMM': 30,
                'confidence': 0.1,
                'method': 'manual',
                'description': 'Manual input required - analysis failed'
            }
    
    def evaluate_quality(self, page, boxes_result, content_result, dimension_result):
        """PDF kalitesi değerlendirmesi"""
        warnings = []
        recommendations = []
        is_vector_based = content_result['hasVectorContent']
        needs_optimization = False
        
        # Kutu kontrolları
        if not boxes_result['hasProperBoxes']:
            warnings.append('Missing TrimBox and ArtBox definitions')
            recommendations.append('Add proper PDF boxes for accurate cutting')
            needs_optimization = True
        
        # İçerik kontrolları
        if content_result['isEmpty']:
            warnings.append('No visible content detected')
            recommendations.append('Verify PDF contains actual design elements')
        
        if content_result['hasRasterContent'] and not content_result['hasVectorContent']:
            warnings.append('PDF contains only raster content')
            recommendations.append('Use vector-based designs for better print quality')
            is_vector_based = False
        
        # Boyut kontrolları
        if dimension_result['confidence'] < 0.5:
            warnings.append('Low confidence in dimension detection')
            recommendations.append('Consider manual dimension verification')
            needs_optimization = True
        
        # Çok küçük tasarımlar
        if dimension_result['widthMM'] < 10 or dimension_result['heightMM'] < 10:
            warnings.append('Very small design detected')
            recommendations.append('Verify minimum size requirements for printing')
        
        # Çok büyük tasarımlar
        if dimension_result['widthMM'] > 350 or dimension_result['heightMM'] > 500:
            warnings.append('Large design may need scaling')
            recommendations.append('Consider optimizing for standard sheet sizes')
            needs_optimization = True
        
        return {
            'isVectorBased': is_vector_based,
            'hasProperBoxes': boxes_result['hasProperBoxes'],
            'needsOptimization': needs_optimization,
            'warnings': warnings,
            'recommendations': recommendations
        }
    
    def generate_processing_notes(self, boxes_result, content_result, dimension_result, quality_result):
        """İşleme notları oluştur"""
        notes = []
        
        # Analiz yöntemi
        notes.append(f"Dimension detection: {dimension_result['method']} method")
        notes.append(f"Confidence level: {dimension_result['confidence']:.1%}")
        
        # İçerik özeti
        content_types = []
        if content_result['hasVectorContent']:
            content_types.append('vector graphics')
        if content_result['hasRasterContent']:
            content_types.append('raster images')
        if content_result['hasText']:
            content_types.append('text')
        
        if content_types:
            notes.append(f"Content detected: {', '.join(content_types)}")
        else:
            notes.append("No content detected")
        
        # Kutu bilgisi
        box_count = len(boxes_result['boxes'])
        notes.append(f"PDF boxes found: {box_count}")
        
        # Kalite özeti
        if quality_result['needsOptimization']:
            notes.append("Optimization recommended")
        else:
            notes.append("PDF quality acceptable")
        
        return notes

def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Invalid arguments. Usage: python enhancedPDFAnalysis.py <file_path> <file_name>'
        }))
        return
    
    file_path = sys.argv[1]
    file_name = sys.argv[2]
    
    if not os.path.exists(file_path):
        print(json.dumps({
            'success': False,
            'error': f'File not found: {file_path}'
        }))
        return
    
    analyzer = EnhancedPDFAnalyzer()
    result = analyzer.analyze_pdf(file_path, file_name)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()