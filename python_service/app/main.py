
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import logging
from pathlib import Path
import os
from .config import settings
from .services.pdf_analyzer import PDFAnalyzer
from .services.design_extractor import DesignExtractor
from .services.arranger import DesignArranger
from .models.design import DesignAnalysisResponse, ArrangementRequest
from .models.arrangement import ArrangementResponse

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PDF Design Analysis & Arrangement Service",
    description="Professional PDF analysis and design arrangement microservice",
    version="1.0.0"
)

# CORS yapılandırması
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da specific domains kullanın
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload dizini oluştur
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

# Service instances
pdf_analyzer = PDFAnalyzer()
design_extractor = DesignExtractor()
design_arranger = DesignArranger()

@app.get("/")
async def root():
    return {"message": "PDF Design Analysis Service", "status": "active"}

@app.get("/api/status")
async def get_status():
    """Servis durumu kontrol endpoint'i"""
    return {
        "status": "healthy",
        "services": {
            "pdf_analyzer": "active",
            "design_extractor": "active",
            "arranger": "active"
        },
        "version": "1.0.0"
    }

@app.post("/api/analyze-pdf", response_model=DesignAnalysisResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    """PDF dosyası analiz endpoint'i"""
    try:
        # Dosya türü kontrolü
        if not file.content_type == "application/pdf":
            raise HTTPException(status_code=400, detail="Sadece PDF dosyaları kabul edilir")
        
        # Dosya boyutu kontrolü
        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Dosya boyutu çok büyük")
        
        # Dosyayı kaydet
        file_path = Path(settings.UPLOAD_DIR) / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"PDF analizi başlıyor: {file.filename}")
        
        # PDF analizi
        analysis_result = await pdf_analyzer.analyze_pdf(str(file_path))
        
        logger.info(f"PDF analizi tamamlandı: {file.filename}")
        
        return DesignAnalysisResponse(
            success=True,
            filename=file.filename,
            analysis=analysis_result,
            message="PDF başarıyla analiz edildi"
        )
        
    except Exception as e:
        logger.error(f"PDF analiz hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analiz hatası: {str(e)}")

@app.post("/api/extract-design")
async def extract_design(file: UploadFile = File(...)):
    """Tasarım çıkarma endpoint'i"""
    try:
        file_path = Path(settings.UPLOAD_DIR) / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Tasarım çıkarma başlıyor: {file.filename}")
        
        # Tasarım çıkarma
        extraction_result = await design_extractor.extract_design(str(file_path))
        
        return {
            "success": True,
            "filename": file.filename,
            "extracted_design": extraction_result,
            "message": "Tasarım başarıyla çıkarıldı"
        }
        
    except Exception as e:
        logger.error(f"Tasarım çıkarma hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Çıkarma hatası: {str(e)}")

@app.post("/api/arrange-designs", response_model=ArrangementResponse)
async def arrange_designs(request: ArrangementRequest):
    """Dizilim oluşturma endpoint'i"""
    try:
        logger.info(f"Dizilim oluşturuluyor: {len(request.designs)} tasarım")
        
        # Dizilim oluştur
        arrangement_result = await design_arranger.create_arrangement(request)
        
        logger.info("Dizilim başarıyla oluşturuldu")
        
        return ArrangementResponse(
            success=True,
            arrangement=arrangement_result,
            message="Dizilim başarıyla oluşturuldu"
        )
        
    except Exception as e:
        logger.error(f"Dizilim hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dizilim hatası: {str(e)}")

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Dosya indirme endpoint'i"""
    file_path = Path(settings.OUTPUT_DIR) / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type='application/pdf'
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
