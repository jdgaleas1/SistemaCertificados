# app/models.py - CERTIFICADOS SERVICE
from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid
import enum

Base = declarative_base()

class EstadoEmail(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    ENVIADO = "ENVIADO"
    ERROR = "ERROR"
    ENTREGADO = "ENTREGADO"

class Plantilla(Base):
    """Plantillas de certificados"""
    __tablename__ = "plantillas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(String(255), nullable=True)
    background_image_url = Column(String(500), nullable=False)
    canvas_json = Column(Text, nullable=True)  # configuración del canvas (tamaño, dpi)
    fields_json = Column(Text, nullable=True)  # definición de campos posicionado/estilos
    is_active = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PlantillaEmail(Base):
    """Plantillas HTML para correos electrónicos"""
    __tablename__ = "plantillas_email"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(String(255), nullable=True)
    asunto = Column(String(255), nullable=False)
    contenido_html = Column(Text, nullable=False)  # HTML del email
    variables_disponibles = Column(Text, nullable=True)  # JSON con variables como {NOMBRE}, {APELLIDO}, etc.
    is_active = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Usuario(Base):
    """Modelo de usuario para el servicio de certificados (referencia)"""
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    cedula = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"

class LogEmail(Base):
    """Log de todos los correos enviados"""
    __tablename__ = "logs_email"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    destinatario_email = Column(String(255), nullable=False, index=True)
    destinatario_nombre = Column(String(255), nullable=True)
    asunto = Column(String(255), nullable=False)
    plantilla_email_id = Column(UUID(as_uuid=True), nullable=True)  # FK a plantillas_email
    plantilla_certificado_id = Column(UUID(as_uuid=True), nullable=True)  # FK a plantillas (certificados)
    estado = Column(Enum(EstadoEmail), nullable=False, default=EstadoEmail.PENDIENTE)
    mensaje_error = Column(Text, nullable=True)
    fecha_envio = Column(DateTime(timezone=True), server_default=func.now())
    fecha_entrega = Column(DateTime(timezone=True), nullable=True)
    metadatos = Column(Text, nullable=True)  # JSON con info adicional del envío