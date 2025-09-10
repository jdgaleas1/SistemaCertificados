# app/models.py
from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

class RolUsuario(str, enum.Enum):
    ADMIN = "ADMIN"
    PROFESOR = "PROFESOR" 
    ESTUDIANTE = "ESTUDIANTE"

class Usuario(Base):
    """Importado desde usuarios-service para consultas directas"""
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    cedula = Column(String(20), unique=True, nullable=False, index=True)
    rol = Column(Enum(RolUsuario), nullable=False, default=RolUsuario.ESTUDIANTE)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"

class Curso(Base):
    __tablename__ = "cursos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    duracion = Column(Integer)  # horas
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    instructor_id = Column(UUID(as_uuid=True), nullable=False)  # FK a usuarios
    plantilla_id = Column(UUID(as_uuid=True))  # FK a plantillas (opcional)
    is_active = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

class Inscripcion(Base):
    __tablename__ = "inscripciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curso_id = Column(UUID(as_uuid=True), nullable=False)  # FK a cursos
    estudiante_id = Column(UUID(as_uuid=True), nullable=False)  # FK a usuarios
    fecha_inscripcion = Column(DateTime(timezone=True), server_default=func.now())
    completado = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)