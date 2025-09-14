# app/routes.py - CERTIFICADOS SERVICE
import os
import uuid
import json
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Plantilla, PlantillaEmail
from app.schemas import (
    PlantillaCreate, PlantillaUpdate, PlantillaResponse,
    PlantillaEmailCreate, PlantillaEmailUpdate, PlantillaEmailResponse,
    EnvioEmailIndividual, EnvioMasivoRequest, EnvioMasivoResponse,
    EstadisticasEmail, LogEmailResponse,
    extraer_variables_plantilla
)
from app.dependencies import require_auth
from app.email_service import EmailService

router = APIRouter()

# ===================== HEALTH CHECK =====================
@router.get("/health")
def health_check():
    """Health check del servicio"""
    return {"status": "healthy", "service": "certificados-service"}

# ===================== PLANTILLAS DE CERTIFICADOS =====================

# Directorio para uploads
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "plantillas")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/templates/upload-image")
async def upload_template_image(
    file: UploadFile = File(...),
    user_info: dict = Depends(require_auth)
):
    """Subir imagen para plantilla de certificado"""
    
    if not file.filename.lower().endswith(".png"):
        raise HTTPException(status_code=400, detail="El archivo debe ser PNG")

    # Generar nombre único
    unique_name = f"{uuid.uuid4()}.png"
    path = os.path.join(UPLOAD_DIR, unique_name)
    
    # Guardar archivo
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    
    # Verificar que se guardó
    if not os.path.exists(path):
        raise HTTPException(status_code=500, detail="Error al guardar la imagen")

    # URL absoluta para el frontend
    base_url = os.getenv("BASE_URL", "http://localhost:8003")
    return {"url": f"{base_url}/static/plantillas/{unique_name}", "filename": unique_name}

@router.post("/templates", response_model=PlantillaResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: PlantillaCreate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Crear nueva plantilla de certificado"""
    
    try:
        plantilla = Plantilla(
            nombre=data.nombre,
            descripcion=data.descripcion,
            background_image_url=data.background_image_url,
            canvas_json=json.dumps(data.canvas) if data.canvas is not None else None,
            fields_json=json.dumps(data.fields) if data.fields is not None else None,
        )
        
        db.add(plantilla)
        db.commit()
        db.refresh(plantilla)
        
        # Preparar respuesta
        return PlantillaResponse(
            id=plantilla.id,
            nombre=plantilla.nombre,
            descripcion=plantilla.descripcion,
            background_image_url=plantilla.background_image_url,
            canvas=json.loads(plantilla.canvas_json) if plantilla.canvas_json else None,
            fields=json.loads(plantilla.fields_json) if plantilla.fields_json else None,
            is_active=plantilla.is_active,
            fecha_creacion=plantilla.fecha_creacion,
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear la plantilla")

@router.get("/templates", response_model=List[PlantillaResponse])
def list_templates(
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Listar plantillas de certificados"""
    
    plantillas = db.query(Plantilla).order_by(Plantilla.fecha_creacion.desc()).all()
    
    result = []
    for t in plantillas:
        result.append(PlantillaResponse(
            id=t.id,
            nombre=t.nombre,
            descripcion=t.descripcion,
            background_image_url=t.background_image_url,
            canvas=json.loads(t.canvas_json) if t.canvas_json else None,
            fields=json.loads(t.fields_json) if t.fields_json else None,
            is_active=t.is_active,
            fecha_creacion=t.fecha_creacion,
        ))
    
    return result

@router.get("/templates/{template_id}", response_model=PlantillaResponse)
def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Obtener plantilla por ID"""
    
    plantilla = db.query(Plantilla).filter(Plantilla.id == template_id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    return PlantillaResponse(
        id=plantilla.id,
        nombre=plantilla.nombre,
        descripcion=plantilla.descripcion,
        background_image_url=plantilla.background_image_url,
        canvas=json.loads(plantilla.canvas_json) if plantilla.canvas_json else None,
        fields=json.loads(plantilla.fields_json) if plantilla.fields_json else None,
        is_active=plantilla.is_active,
        fecha_creacion=plantilla.fecha_creacion,
    )

@router.put("/templates/{template_id}", response_model=PlantillaResponse)
def update_template(
    template_id: str,
    data: PlantillaUpdate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Actualizar plantilla de certificado"""
    
    plantilla = db.query(Plantilla).filter(Plantilla.id == template_id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    # Actualizar campos
    if data.nombre is not None:
        plantilla.nombre = data.nombre
    if data.descripcion is not None:
        plantilla.descripcion = data.descripcion
    if data.background_image_url is not None:
        plantilla.background_image_url = data.background_image_url
    if data.canvas is not None:
        plantilla.canvas_json = json.dumps(data.canvas)
    if data.fields is not None:
        plantilla.fields_json = json.dumps(data.fields)
    if data.is_active is not None:
        plantilla.is_active = data.is_active

    db.commit()
    db.refresh(plantilla)
    
    return PlantillaResponse(
        id=plantilla.id,
        nombre=plantilla.nombre,
        descripcion=plantilla.descripcion,
        background_image_url=plantilla.background_image_url,
        canvas=json.loads(plantilla.canvas_json) if plantilla.canvas_json else None,
        fields=json.loads(plantilla.fields_json) if plantilla.fields_json else None,
        is_active=plantilla.is_active,
        fecha_creacion=plantilla.fecha_creacion,
    )

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Eliminar plantilla de certificado"""
    
    plantilla = db.query(Plantilla).filter(Plantilla.id == template_id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    
    db.delete(plantilla)
    db.commit()
    
    return {"message": "Plantilla eliminada correctamente"}

# ===================== PLANTILLAS DE EMAIL =====================

@router.get("/plantillas-email", response_model=List[PlantillaEmailResponse])
def get_plantillas_email(
    skip: int = 0,
    limit: int = 100,
    activas: bool = None,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Listar plantillas de email"""
    
    query = db.query(PlantillaEmail)
    
    if activas is not None:
        query = query.filter(PlantillaEmail.is_active == activas)
    
    plantillas = query.order_by(PlantillaEmail.fecha_creacion.desc()).offset(skip).limit(limit).all()
    
    result = []
    for plantilla in plantillas:
        # Extraer variables del contenido HTML
        variables = extraer_variables_plantilla(plantilla.contenido_html) if plantilla.contenido_html else []
        
        # Crear el diccionario manualmente para evitar problemas con from_orm
        plantilla_dict = {
            "id": plantilla.id,
            "nombre": plantilla.nombre,
            "descripcion": plantilla.descripcion,
            "asunto": plantilla.asunto,
            "contenido_html": plantilla.contenido_html,
            "variables_disponibles": variables,
            "is_active": plantilla.is_active,
            "fecha_creacion": plantilla.fecha_creacion,
            "fecha_actualizacion": plantilla.fecha_actualizacion
        }
        result.append(plantilla_dict)
    
    return result

@router.post("/plantillas-email", response_model=PlantillaEmailResponse, status_code=status.HTTP_201_CREATED)
def create_plantilla_email(
    plantilla: PlantillaEmailCreate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Crear nueva plantilla de email"""
    
    # Extraer variables del contenido HTML
    variables = extraer_variables_plantilla(plantilla.contenido_html)
    
    try:
        db_plantilla = PlantillaEmail(
            nombre=plantilla.nombre,
            descripcion=plantilla.descripcion,
            asunto=plantilla.asunto,
            contenido_html=plantilla.contenido_html,
            variables_disponibles=json.dumps(variables) if variables else None
        )
        
        db.add(db_plantilla)
        db.commit()
        db.refresh(db_plantilla)
        
        # Preparar respuesta
        plantilla_response = {
            "id": db_plantilla.id,
            "nombre": db_plantilla.nombre,
            "descripcion": db_plantilla.descripcion,
            "asunto": db_plantilla.asunto,
            "contenido_html": db_plantilla.contenido_html,
            "variables_disponibles": variables,
            "is_active": db_plantilla.is_active,
            "fecha_creacion": db_plantilla.fecha_creacion,
            "fecha_actualizacion": db_plantilla.fecha_actualizacion
        }
        
        return plantilla_response
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear la plantilla de email")

@router.get("/plantillas-email/{plantilla_id}", response_model=PlantillaEmailResponse)
def get_plantilla_email(
    plantilla_id: str,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Obtener plantilla de email por ID"""
    
    plantilla = db.query(PlantillaEmail).filter(PlantillaEmail.id == plantilla_id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla de email no encontrada")
    
    # Extraer variables del contenido HTML
    variables = extraer_variables_plantilla(plantilla.contenido_html) if plantilla.contenido_html else []
    
    # Crear el diccionario manualmente para evitar problemas con from_orm
    plantilla_response = {
        "id": plantilla.id,
        "nombre": plantilla.nombre,
        "descripcion": plantilla.descripcion,
        "asunto": plantilla.asunto,
        "contenido_html": plantilla.contenido_html,
        "variables_disponibles": variables,
        "is_active": plantilla.is_active,
        "fecha_creacion": plantilla.fecha_creacion,
        "fecha_actualizacion": plantilla.fecha_actualizacion
    }
    
    return plantilla_response

@router.put("/plantillas-email/{plantilla_id}", response_model=PlantillaEmailResponse)
def update_plantilla_email(
    plantilla_id: str,
    plantilla_update: PlantillaEmailUpdate,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Actualizar plantilla de email"""
    
    plantilla = db.query(PlantillaEmail).filter(PlantillaEmail.id == plantilla_id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla de email no encontrada")
    
    update_data = plantilla_update.dict(exclude_unset=True)
    
    # Si se actualiza el contenido, extraer nuevas variables
    if "contenido_html" in update_data:
        variables = extraer_variables_plantilla(update_data["contenido_html"])
        update_data["variables_disponibles"] = json.dumps(variables) if variables else None
    
    # Actualizar campos
    for field, value in update_data.items():
        if field != "variables_disponibles":  # Este lo manejamos especialmente
            setattr(plantilla, field, value)
    
    # Manejar variables_disponibles
    if "contenido_html" in update_data:
        variables = extraer_variables_plantilla(update_data["contenido_html"])
        plantilla.variables_disponibles = json.dumps(variables) if variables else None
    
    db.commit()
    db.refresh(plantilla)
    
    # Preparar respuesta
    variables = extraer_variables_plantilla(plantilla.contenido_html) if plantilla.contenido_html else []
    plantilla_response = {
        "id": plantilla.id,
        "nombre": plantilla.nombre,
        "descripcion": plantilla.descripcion,
        "asunto": plantilla.asunto,
        "contenido_html": plantilla.contenido_html,
        "variables_disponibles": variables,
        "is_active": plantilla.is_active,
        "fecha_creacion": plantilla.fecha_creacion,
        "fecha_actualizacion": plantilla.fecha_actualizacion
    }
    
    return plantilla_response

@router.delete("/plantillas-email/{plantilla_id}")
def delete_plantilla_email(
    plantilla_id: str,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Eliminar plantilla de email"""
    
    plantilla = db.query(PlantillaEmail).filter(PlantillaEmail.id == plantilla_id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla de email no encontrada")
    
    db.delete(plantilla)
    db.commit()
    
    return {"message": "Plantilla de email eliminada correctamente"}

# ===================== ENVÍO DE CORREOS =====================

@router.post("/enviar-individual", response_model=LogEmailResponse)
def enviar_email_individual(
    envio_data: EnvioEmailIndividual,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Enviar email individual"""
    
    email_service = EmailService(db)
    try:
        resultado = email_service.enviar_email_individual(envio_data)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error enviando email: {str(e)}")

@router.post("/enviar-masivo", response_model=EnvioMasivoResponse)
def enviar_email_masivo(
    envio_data: EnvioMasivoRequest,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Enviar emails masivos por lotes"""
    
    email_service = EmailService(db)
    
    try:
        # Validar que se proporcione curso_id o destinatarios_ids
        if not envio_data.curso_id and not envio_data.destinatarios_ids:
            raise HTTPException(status_code=400, detail="Debe proporcionar curso_id o destinatarios_ids")
        
        # Si se proporciona curso_id, obtener destinatarios del curso
        destinatarios_ids = envio_data.destinatarios_ids
        if envio_data.curso_id:
            # Aquí necesitarías hacer una consulta a la base de datos para obtener
            # los estudiantes inscritos en el curso. Por ahora usamos los IDs proporcionados
            if not destinatarios_ids:
                raise HTTPException(status_code=400, detail="Para envío por curso, debe proporcionar destinatarios_ids")
        
        resultado = email_service.enviar_email_masivo_lotes(
            plantilla_email_id=str(envio_data.plantilla_email_id),
            destinatarios_ids=[str(id) for id in destinatarios_ids],
            plantilla_certificado_id=str(envio_data.plantilla_certificado_id) if envio_data.plantilla_certificado_id else None,
            variables_globales=envio_data.variables_globales,
            configuracion_lotes=envio_data.configuracion_lotes
        )
        
        return EnvioMasivoResponse(**resultado)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error enviando emails masivos: {str(e)}")

@router.get("/estadisticas-email", response_model=EstadisticasEmail)
def obtener_estadisticas_email(
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Obtener estadísticas de envíos de email"""
    
    email_service = EmailService(db)
    try:
        estadisticas = email_service.obtener_estadisticas_email()
        return EstadisticasEmail(**estadisticas)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error obteniendo estadísticas: {str(e)}")

@router.get("/logs-email", response_model=List[LogEmailResponse])
def obtener_logs_email(
    skip: int = 0,
    limit: int = 100,
    estado: str = None,
    db: Session = Depends(get_db),
    user_info: dict = Depends(require_auth)
):
    """Obtener logs de envíos de email"""
    
    from app.models import LogEmail, EstadoEmail
    
    query = db.query(LogEmail)
    
    if estado:
        try:
            estado_enum = EstadoEmail(estado)
            query = query.filter(LogEmail.estado == estado_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Estado inválido")
    
    logs = query.order_by(LogEmail.fecha_envio.desc()).offset(skip).limit(limit).all()
    
    return [LogEmailResponse.from_orm(log) for log in logs]