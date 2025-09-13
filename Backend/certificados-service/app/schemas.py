# app/schemas.py - CERTIFICADOS SERVICE
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from app.models import EstadoEmail
import re

# ==================== PLANTILLAS DE CERTIFICADOS ====================

class PlantillaCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    background_image_url: str = Field(..., min_length=10)
    canvas: Optional[Any] = None
    fields: Optional[Any] = None

class PlantillaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    background_image_url: Optional[str] = Field(None, min_length=10)
    canvas: Optional[Any] = None
    fields: Optional[Any] = None
    is_active: Optional[bool] = None

class PlantillaResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    background_image_url: str
    canvas: Optional[Any] = None
    fields: Optional[Any] = None
    is_active: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# ==================== PLANTILLAS DE EMAIL ====================

class PlantillaEmailCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    asunto: str = Field(..., min_length=5, max_length=255)
    contenido_html: str = Field(..., min_length=50)
    
    @validator('contenido_html')
    def validate_html(cls, v):
        if not v.strip():
            raise ValueError('El contenido HTML no puede estar vacío')
        return v

class PlantillaEmailUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    asunto: Optional[str] = Field(None, min_length=5, max_length=255)
    contenido_html: Optional[str] = Field(None, min_length=50)
    is_active: Optional[bool] = None

class PlantillaEmailResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str]
    asunto: str
    contenido_html: str
    variables_disponibles: Optional[List[str]] = None
    is_active: bool
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True

# ==================== LOG DE EMAIL ====================

class LogEmailResponse(BaseModel):
    id: UUID
    destinatario_email: str
    destinatario_nombre: Optional[str]
    asunto: str
    plantilla_email_id: Optional[UUID]
    plantilla_certificado_id: Optional[UUID]
    estado: EstadoEmail
    mensaje_error: Optional[str]
    fecha_envio: datetime
    fecha_entrega: Optional[datetime]
    metadatos: Optional[dict]

    class Config:
        from_attributes = True

# ==================== UTILIDADES ====================

def extraer_variables_plantilla(contenido_html: str) -> List[str]:
    """
    Extrae todas las variables {VARIABLE} del contenido HTML
    """
    patron = r'\{([A-Z_]+)\}'
    variables = re.findall(patron, contenido_html)
    return list(set(variables))  # Eliminar duplicados