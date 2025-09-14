# app/schemas.py - CERTIFICADOS SERVICE
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any, Dict
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
    contenido_html: str = Field(..., min_length=5)  
    is_active: Optional[bool] = Field(True) 
    
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

# ==================== ENVÍO DE CORREOS ====================

class EnvioEmailIndividual(BaseModel):
    destinatario_email: str   
    destinatario_nombre: Optional[str] = None
    asunto: str = Field(..., min_length=5, max_length=255)
    contenido_html: str = Field(..., min_length=50)
    plantilla_certificado_id: Optional[UUID] = None
    variables: Optional[Dict[str, str]] = None


class EnvioMasivoRequest(BaseModel):
    plantilla_email_id: UUID
    plantilla_certificado_id: Optional[UUID] = None
    curso_id: Optional[UUID] = None
    destinatarios_ids: Optional[List[UUID]] = None
    variables_globales: Optional[Dict[str, str]] = None
    configuracion_lotes: Optional[Dict[str, int]] = None

class EnvioMasivoResponse(BaseModel):
    total_destinatarios: int
    enviados_exitosos: int
    errores: int
    log_ids: List[UUID]
    errores_detalle: List[str]
    tiempo_total: Optional[float] = None

class ConfiguracionLotes(BaseModel):
    lote_size: int = Field(default=10, ge=1, le=50)
    pausa_lotes: int = Field(default=20, ge=0, le=300)
    pausa_individual: float = Field(default=1.0, ge=0.0, le=10.0)

class EstadisticasEmail(BaseModel):
    total_enviados: int
    total_entregados: int
    total_errores: int
    total_pendientes: int
    emails_hoy: int
    tasa_exito: float

# ==================== UTILIDADES ====================

def extraer_variables_plantilla(contenido_html: str) -> List[str]:
    """
    Extrae todas las variables {VARIABLE} del contenido HTML
    """
    patron = r'\{([A-Z_]+)\}'
    variables = re.findall(patron, contenido_html)
    return list(set(variables))  # Eliminar duplicados