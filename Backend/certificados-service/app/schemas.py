# app/schemas.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Any
from datetime import datetime
from uuid import UUID
from app.models import RolUsuario

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

# Plantillas
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