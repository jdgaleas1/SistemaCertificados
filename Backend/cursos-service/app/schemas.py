# app/schemas.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from app.models import RolUsuario

# Schemas de Usuario (copiados para consultas)
class UsuarioResponse(BaseModel):
    id: UUID
    email: EmailStr
    nombre: str
    apellido: str
    cedula: str
    rol: RolUsuario
    is_active: bool
    fecha_creacion: datetime
    nombre_completo: str

    class Config:
        from_attributes = True

# Schemas de Curso
class CursoBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=200)
    descripcion: Optional[str] = None
    duracion: Optional[int] = Field(None, ge=1, le=1000)  # horas
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

class CursoCreate(CursoBase):
    instructor_id: UUID
    
    @validator('fecha_fin')
    def validate_fecha_fin(cls, v, values):
        if v and 'fecha_inicio' in values and values['fecha_inicio']:
            if v <= values['fecha_inicio']:
                raise ValueError('Fecha fin debe ser posterior a fecha inicio')
        return v

class CursoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=200)
    descripcion: Optional[str] = None
    duracion: Optional[int] = Field(None, ge=1, le=1000)
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    instructor_id: Optional[UUID] = None
    plantilla_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class CursoResponse(CursoBase):
    id: UUID
    instructor_id: UUID
    plantilla_id: Optional[UUID] = None
    is_active: bool
    fecha_creacion: datetime
    instructor_nombre: Optional[str] = None

    class Config:
        from_attributes = True

# Schemas de Inscripción
class InscripcionCreate(BaseModel):
    estudiante_id: UUID

class InscripcionResponse(BaseModel):
    id: UUID
    curso_id: UUID
    estudiante_id: UUID
    fecha_inscripcion: datetime
    completado: bool
    is_active: bool
    estudiante_nombre: Optional[str] = None
    estudiante_email: Optional[str] = None

    class Config:
        from_attributes = True

# Schema para CSV Import
class EstudianteCSV(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=2, max_length=100)
    apellido: str = Field(..., min_length=2, max_length=100)
    cedula: str = Field(..., min_length=5, max_length=20)

class CSVImportResponse(BaseModel):
    total_procesados: int
    usuarios_creados: int
    inscripciones_creadas: int
    errores: List[str]
    exitosos: List[str]

# Schema de paginación
class PaginatedResponse(BaseModel):
    data: List[dict]
    total: int
    page: int
    per_page: int
    pages: int