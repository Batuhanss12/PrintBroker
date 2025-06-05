
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DesignAnalysisResponse(BaseModel):
    success: bool
    filename: str
    analysis: Dict[str, Any]
    message: str

class ArrangementRequest(BaseModel):
    designs: List['DesignItem']
    page_size: str = "A4"
    orientation: str = "portrait"  # portrait, landscape
    margin_mm: float = 5.0
    spacing_x_mm: float = 3.0
    spacing_y_mm: float = 3.0
    enable_rotation: bool = True
    optimize_efficiency: bool = True

class DesignItem(BaseModel):
    filename: str
    width_mm: float
    height_mm: float
    copies: int = 1
    priority: int = 1  # 1=high, 2=medium, 3=low
    rotation_allowed: bool = True

class AnalysisResult(BaseModel):
    success: bool
    dimensions: Dict[str, Any]
    content: Dict[str, Any]
    quality: Dict[str, Any]
    recommendations: List[str]
