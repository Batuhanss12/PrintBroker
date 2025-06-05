
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ArrangementResult(BaseModel):
    success: bool
    pdf_path: str
    arrangement: Dict[str, Any]
    statistics: Dict[str, Any]
    page_info: Dict[str, Any]

class ArrangementResponse(BaseModel):
    success: bool
    arrangement: ArrangementResult
    message: str

class PlacedItem(BaseModel):
    filename: str
    x: float
    y: float
    width: float
    height: float
    rotated: bool
    copy_number: int
    area: float
