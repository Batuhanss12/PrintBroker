
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Dosya yükleme ayarları
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "output"
    TEMP_DIR: str = "temp"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    
    # PDF analiz ayarları
    MIN_DPI: int = 150
    MAX_DPI: int = 600
    DEFAULT_DPI: int = 300
    
    # Dizilim ayarları
    DEFAULT_PAGE_SIZE: str = "A4"
    DEFAULT_MARGIN_MM: float = 5.0
    DEFAULT_SPACING_MM: float = 3.0
    
    # Performans ayarları
    MAX_CONCURRENT_JOBS: int = 5
    CACHE_TTL_SECONDS: int = 3600
    
    # Güvenlik ayarları
    ALLOWED_EXTENSIONS: list = [".pdf", ".eps", ".ai", ".svg"]
    
    class Config:
        env_file = ".env"

settings = Settings()
