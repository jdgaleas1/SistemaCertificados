# app/schemas.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
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
    nombre_completo: str

    class Config:
        from_attributes = True

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UsuarioResponse

class TokenRefresh(BaseModel):
    access_token: str
    token_type: str

class PasswordChange(BaseModel):
    new_password: str = Field(..., min_length=6)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v