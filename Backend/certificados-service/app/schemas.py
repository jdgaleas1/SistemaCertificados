# app/schemas.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from app.models import RolUsuario, EstadoEmail

class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=2, max_length=100)
    apellido: str = Field(..., min_length=2, max_length=100)
    cedula: str = Field(..., min_length=5, max_length=20)
    rol: RolUsuario = RolUsuario.ESTUDIANTE

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password debe tener al menos 8 caracteres')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password debe tener al menos un número')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password debe tener al menos una letra')
        return v

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellido: Optional[str] = Field(None, min_length=2, max_length=100)
    cedula: Optional[str] = Field(None, min_length=5, max_length=20)
    rol: Optional[RolUsuario] = None
    is_active: Optional[bool] = None

class UsuarioResponse(UsuarioBase):
    id: UUID
    is_active: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    user: Optional['UsuarioResponse'] = None

class TokenRefresh(BaseModel):
    access_token: str

# Plantillas de Certificados
class PlantillaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    background_image_url: str
    canvas: Optional[Any] = None
    fields: Optional[Any] = None

class PlantillaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    background_image_url: Optional[str] = None
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

# ==================== SCHEMAS DE EMAIL ====================

# Plantillas de Email
class PlantillaEmailCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    asunto: str = Field(..., min_length=5, max_length=255)
    contenido_html: str = Field(..., min_length=50)
    variables_disponibles: Optional[List[str]] = None
    
    @validator('contenido_html')
    def validate_html(cls, v):
        # Validación básica de HTML
        if not v.strip():
            raise ValueError('El contenido HTML no puede estar vacío')
        return v

class PlantillaEmailUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=255)
    asunto: Optional[str] = Field(None, min_length=5, max_length=255)
    contenido_html: Optional[str] = Field(None, min_length=50)
    variables_disponibles: Optional[List[str]] = None
    is_active: Optional[bool] = None

class PlantillaEmailResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str]
    asunto: str
    contenido_html: str
    variables_disponibles: Optional[List[str]]
    is_active: bool
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True

# Log de Email
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

# Envío individual
class EnvioEmailIndividual(BaseModel):
    destinatario_email: EmailStr
    destinatario_nombre: Optional[str] = None
    asunto: str
    contenido_html: str
    plantilla_certificado_id: Optional[UUID] = None
    variables: Optional[dict] = None

# Envío masivo
class EnvioEmailMasivo(BaseModel):
    plantilla_email_id: UUID
    destinatarios: List[UUID]  # IDs de usuarios
    plantilla_certificado_id: Optional[UUID] = None
    variables_globales: Optional[dict] = None

class DestinatarioMasivo(BaseModel):
    usuario_id: UUID
    email: EmailStr
    nombre_completo: str
    variables_personalizadas: Optional[dict] = None

# Respuesta de envío masivo
class EnvioMasivoResponse(BaseModel):
    total_destinatarios: int
    enviados_exitosos: int
    errores: int
    log_ids: List[UUID]
    errores_detalle: List[str]

# Vista previa de email
class VistaPreviaEmail(BaseModel):
    plantilla_email_id: UUID
    variables: Optional[dict] = None

class VistaPreviaEmailResponse(BaseModel):
    asunto_procesado: str
    contenido_html_procesado: str
    variables_utilizadas: List[str]

# Estadísticas de emails
class EstadisticasEmail(BaseModel):
    total_enviados: int
    total_entregados: int
    total_errores: int
    total_pendientes: int
    emails_hoy: int
    emails_esta_semana: int
    emails_este_mes: int
    plantilla_mas_usada: Optional[str]