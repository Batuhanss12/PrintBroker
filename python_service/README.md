
# PDF Design Analysis & Arrangement Service

Bu mikroservis, PDF dosyalarının analizi, tasarım çıkarımı ve optimal dizilim oluşturma işlemlerini gerçekleştirir.

## Özellikler

### PDF Analiz Sistemi
- PDF dosyalarını yükleme ve açma
- Sayfa boyutlarını tespit etme (MediaBox, TrimBox, ArtBox)
- İçerideki tasarım alanını bulma
- Vektörel ve raster içerik analizi
- Kalite değerlendirmesi
- Kesim paylarını hesaplama

### Tasarım Çıkarma Sistemi
- PDF içindeki aktif tasarım alanını otomatik tespit
- Boş alanları temizleme
- Vektörel içeriği koruma
- Boyutları doğru şekilde çıkarma
- Optimize edilmiş PDF oluşturma

### Dizilim Sistemi
- Optimal yerleştirme algoritması
- Rotasyon desteği
- Boşluk kontrolü ve optimizasyon
- Verimlilik hesaplama
- Kesim payı ekleme
- Çoklu sayfa desteği

## Kurulum

### Gereksinimler
```bash
Python 3.8+
pip install -r requirements.txt
```

### Çalıştırma
```bash
cd python_service
python -m app.main
```

Servis `http://0.0.0.0:8000` adresinde çalışacaktır.

## API Endpoint'leri

### 1. Servis Durumu
```
GET /api/status
```

**Yanıt:**
```json
{
  "status": "healthy",
  "services": {
    "pdf_analyzer": "active",
    "design_extractor": "active",
    "arranger": "active"
  },
  "version": "1.0.0"
}
```

### 2. PDF Analizi
```
POST /api/analyze-pdf
Content-Type: multipart/form-data
Body: file (PDF dosyası)
```

**Yanıt:**
```json
{
  "success": true,
  "filename": "design.pdf",
  "analysis": {
    "basic": {
      "page_width_mm": 50.0,
      "page_height_mm": 30.0,
      "rotation": 0
    },
    "dimensions": {
      "effective_dimensions": {
        "width_mm": 48.0,
        "height_mm": 28.0,
        "aspect_ratio": 1.714
      },
      "confidence": 0.9
    },
    "content": {
      "has_vector_content": true,
      "is_vector_based": true,
      "complexity_score": 0.3
    },
    "quality": {
      "estimated_print_quality": "high",
      "has_quality_issues": false
    },
    "recommendations": []
  },
  "message": "PDF başarıyla analiz edildi"
}
```

### 3. Tasarım Çıkarma
```
POST /api/extract-design
Content-Type: multipart/form-data
Body: file (PDF dosyası)
```

### 4. Dizilim Oluşturma
```
POST /api/arrange-designs
Content-Type: application/json
```

**İstek Body:**
```json
{
  "designs": [
    {
      "filename": "design1.pdf",
      "width_mm": 50.0,
      "height_mm": 30.0,
      "copies": 2
    }
  ],
  "page_size": "A4",
  "orientation": "portrait",
  "margin_mm": 5.0,
  "spacing_x_mm": 3.0,
  "spacing_y_mm": 3.0,
  "enable_rotation": true
}
```

**Yanıt:**
```json
{
  "success": true,
  "arrangement": {
    "pdf_path": "/output/arrangement.pdf",
    "statistics": {
      "total_items": 4,
      "efficiency_percentage": 78.5,
      "waste_area_mm2": 125.3
    }
  },
  "message": "Dizilim başarıyla oluşturuldu"
}
```

## Kullanım Örnekleri

### Python Client
```python
import requests
import json

# PDF analizi
with open('design.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/analyze-pdf',
        files={'file': f}
    )
    result = response.json()
    print(f"Analiz sonucu: {result}")

# Dizilim oluşturma
arrangement_request = {
    "designs": [
        {
            "filename": "design1.pdf",
            "width_mm": 50.0,
            "height_mm": 30.0,
            "copies": 4
        }
    ],
    "page_size": "A4",
    "orientation": "portrait",
    "margin_mm": 5.0,
    "spacing_x_mm": 3.0,
    "spacing_y_mm": 3.0,
    "enable_rotation": true
}

response = requests.post(
    'http://localhost:8000/api/arrange-designs',
    json=arrangement_request
)
result = response.json()
print(f"Dizilim sonucu: {result}")
```

### JavaScript/React Integration
```javascript
// PDF yükleme ve analiz
const uploadAndAnalyzePDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/api/analyze-pdf', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// Dizilim oluşturma
const createArrangement = async (designs, settings) => {
  const response = await fetch('http://localhost:8000/api/arrange-designs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      designs,
      ...settings
    })
  });
  
  return await response.json();
};
```

## Hata Yönetimi

Servis aşağıdaki HTTP durum kodlarını kullanır:
- `200`: Başarılı
- `400`: Hatalı istek (dosya türü, boyut vb.)
- `404`: Dosya bulunamadı
- `500`: Sunucu hatası

Hata yanıtı formatı:
```json
{
  "detail": "Hata açıklaması"
}
```

## Performans Önerileri

1. **Dosya Boyutu**: 50MB'dan küçük PDF dosyaları kullanın
2. **Eş Zamanlılık**: Maximum 5 eş zamanlı işlem desteklenir
3. **Önbellekleme**: Analiz sonuçları 1 saat boyunca önbelleklenir
4. **Optimizasyon**: Vektörel tasarımlar daha hızlı işlenir

## Test Senaryoları

```bash
# Tüm testleri çalıştır
python -m pytest tests/

# Belirli bir testi çalıştır
python -m pytest tests/test_pdf_analyzer.py

# Kapsamlı test raporu
python -m pytest tests/ --cov=app --cov-report=html
```

## Geliştirme Notları

- Tüm işlemler asenkron olarak çalışır
- Detaylı logging sistemi mevcuttur
- Modüler yapı sayesinde kolay genişletilebilir
- Type hints kullanılarak kod kalitesi artırılmıştır
