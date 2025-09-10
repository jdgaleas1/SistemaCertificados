# app/routes.py
from typing import List
import pandas as pd
import io
import math
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from app.database import get_db
from app.models import Usuario, Curso, Inscripcion, RolUsuario
from app.schemas import (
    CursoCreate, CursoUpdate, CursoResponse, 
    InscripcionCreate, InscripcionResponse,
    UsuarioResponse, CSVImportResponse, PaginatedResponse,
    EstudianteCSV
)
from app.dependencies import get_current_user, get_admin_user, get_teacher_or_admin
from app.auth import get_password_hash

router = APIRouter()

# CURSOS CRUD
@router.get("/cursos")
def get_cursos(
    skip: int = 0,
    limit: int = 25,
    search: str = None,
    instructor_id: str = None,
    activos: bool = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar cursos con filtros"""
    query = db.query(Curso)
    
    # Filtros
    if search:
        query = query.filter(
            or_(
                Curso.nombre.ilike(f"%{search}%"),
                Curso.descripcion.ilike(f"%{search}%")
            )
        )
    
    if instructor_id:
        query = query.filter(Curso.instructor_id == instructor_id)
        
    if activos is not None:
        query = query.filter(Curso.is_active == activos)
    
    # Si es profesor, solo sus cursos
    if current_user.rol == RolUsuario.PROFESOR:
        query = query.filter(Curso.instructor_id == current_user.id)
    
    total = query.count()
    cursos = query.offset(skip).limit(limit).all()
    
    # Obtener nombres de instructores
    cursos_response = []
    for curso in cursos:
        instructor = db.query(Usuario).filter(Usuario.id == curso.instructor_id).first()
        curso_dict = CursoResponse.from_orm(curso).dict()
        curso_dict['instructor_nombre'] = instructor.nombre_completo if instructor else None
        cursos_response.append(curso_dict)
    
    return {
        "data": cursos_response,
        "total": total,
        "page": (skip // limit) + 1,
        "per_page": limit,
        "pages": math.ceil(total / limit) if total > 0 else 0
    }

@router.post("/cursos", response_model=CursoResponse, status_code=status.HTTP_201_CREATED)
def create_curso(
    curso: CursoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Crear nuevo curso"""
    
    # Verificar que el instructor existe
    instructor = db.query(Usuario).filter(Usuario.id == curso.instructor_id).first()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor no encontrado")
    
    # Solo admin puede asignar cualquier instructor, profesor solo se puede asignar a sí mismo
    if current_user.rol == RolUsuario.PROFESOR and str(curso.instructor_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Solo puede asignarse cursos a sí mismo")
    
    try:
        db_curso = Curso(
            nombre=curso.nombre,
            descripcion=curso.descripcion,
            duracion=curso.duracion,
            fecha_inicio=curso.fecha_inicio,
            fecha_fin=curso.fecha_fin,
            instructor_id=curso.instructor_id
        )
        
        db.add(db_curso)
        db.commit()
        db.refresh(db_curso)
        
        # Agregar nombre del instructor a la respuesta
        curso_response = CursoResponse.from_orm(db_curso).dict()
        curso_response['instructor_nombre'] = instructor.nombre_completo
        
        return curso_response
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear el curso")

@router.get("/cursos/{curso_id}", response_model=CursoResponse)
def get_curso(
    curso_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener curso por ID"""
    
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Profesor solo puede ver sus cursos
    if current_user.rol == RolUsuario.PROFESOR and str(curso.instructor_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Sin permisos para ver este curso")
    
    # Agregar nombre del instructor
    instructor = db.query(Usuario).filter(Usuario.id == curso.instructor_id).first()
    curso_response = CursoResponse.from_orm(curso).dict()
    curso_response['instructor_nombre'] = instructor.nombre_completo if instructor else None
    
    return curso_response

@router.put("/cursos/{curso_id}", response_model=CursoResponse)
def update_curso(
    curso_id: str,
    curso_update: CursoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Actualizar curso"""
    
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Profesor solo puede editar sus cursos
    if current_user.rol == RolUsuario.PROFESOR and str(curso.instructor_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Sin permisos para editar este curso")
    
    update_data = curso_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(curso, field, value)
    
    db.commit()
    db.refresh(curso)
    
    # Agregar nombre del instructor
    instructor = db.query(Usuario).filter(Usuario.id == curso.instructor_id).first()
    curso_response = CursoResponse.from_orm(curso).dict()
    curso_response['instructor_nombre'] = instructor.nombre_completo if instructor else None
    
    return curso_response

@router.delete("/cursos/{curso_id}")
def delete_curso(
    curso_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Eliminar curso (soft delete)"""
    
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    curso.is_active = False
    db.commit()
    
    return {"message": "Curso eliminado correctamente"}

# INSCRIPCIONES
@router.post("/cursos/{curso_id}/inscripciones", response_model=InscripcionResponse)
def inscribir_estudiante(
    curso_id: str,
    inscripcion: InscripcionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Inscribir estudiante a curso"""
    
    # Verificar que el curso existe
    curso = db.query(Curso).filter(Curso.id == curso_id, Curso.is_active == True).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar permisos de profesor
    if current_user.rol == RolUsuario.PROFESOR and str(curso.instructor_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Sin permisos para inscribir en este curso")
    
    # Verificar que el estudiante existe
    estudiante = db.query(Usuario).filter(Usuario.id == inscripcion.estudiante_id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Verificar que no esté ya inscrito
    inscripcion_existente = db.query(Inscripcion).filter(
        Inscripcion.curso_id == curso_id,
        Inscripcion.estudiante_id == inscripcion.estudiante_id,
        Inscripcion.is_active == True
    ).first()
    
    if inscripcion_existente:
        raise HTTPException(status_code=400, detail="El estudiante ya está inscrito en este curso")
    
    # Crear inscripción
    db_inscripcion = Inscripcion(
        curso_id=curso_id,
        estudiante_id=inscripcion.estudiante_id
    )
    
    db.add(db_inscripcion)
    db.commit()
    db.refresh(db_inscripcion)
    
    # Preparar respuesta con datos del estudiante
    inscripcion_response = InscripcionResponse.from_orm(db_inscripcion).dict()
    inscripcion_response['estudiante_nombre'] = estudiante.nombre_completo
    inscripcion_response['estudiante_email'] = estudiante.email
    
    return inscripcion_response

@router.get("/cursos/{curso_id}/estudiantes")
def get_estudiantes_curso(
    curso_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Listar estudiantes inscritos en un curso"""
    
    # Verificar curso
    curso = db.query(Curso).filter(Curso.id == curso_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar permisos
    if current_user.rol == RolUsuario.PROFESOR and str(curso.instructor_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Sin permisos para ver estudiantes de este curso")
    
    # Obtener inscripciones activas con datos del estudiante
    inscripciones = db.query(Inscripcion, Usuario).join(
        Usuario, Inscripcion.estudiante_id == Usuario.id
    ).filter(
        Inscripcion.curso_id == curso_id,
        Inscripcion.is_active == True,
        Usuario.is_active == True
    ).all()
    
    estudiantes = []
    for inscripcion, usuario in inscripciones:
        estudiante_data = {
            "inscripcion_id": inscripcion.id,
            "estudiante_id": usuario.id,
            "nombre_completo": usuario.nombre_completo,
            "email": usuario.email,
            "cedula": usuario.cedula,
            "fecha_inscripcion": inscripcion.fecha_inscripcion,
            "completado": inscripcion.completado
        }
        estudiantes.append(estudiante_data)
    
    return {
        "curso_id": curso_id,
        "curso_nombre": curso.nombre,
        "total_estudiantes": len(estudiantes),
        "estudiantes": estudiantes
    }

@router.post("/inscripciones/xlsx", response_model=CSVImportResponse)
async def import_xlsx_inscripciones(
    curso_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Importación masiva de estudiantes desde archivo XLSX"""
    
    # Verificar curso
    curso = db.query(Curso).filter(Curso.id == curso_id, Curso.is_active == True).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar permisos
    if current_user.rol == RolUsuario.PROFESOR and str(curso.instructor_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Sin permisos para inscribir en este curso")
    
    # Verificar formato del archivo
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser XLSX o XLS")
    
    try:
        # Leer archivo Excel
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # Validar headers
        required_columns = ['email', 'nombre', 'apellido', 'cedula']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400, 
                detail=f"El archivo debe contener las columnas: {', '.join(required_columns)}"
            )
        
        usuarios_creados = 0
        inscripciones_creadas = 0
        errores = []
        exitosos = []
        
        for index, row in df.iterrows():
            try:
                # Validar datos con Pydantic
                estudiante_data = EstudianteCSV(
                    email=row['email'],
                    nombre=row['nombre'],
                    apellido=row['apellido'],
                    cedula=row['cedula']
                )
                
                # Buscar o crear usuario
                usuario_existente = db.query(Usuario).filter(Usuario.email == estudiante_data.email).first()
                
                if not usuario_existente:
                    # Crear nuevo usuario
                    nuevo_usuario = Usuario(
                        email=estudiante_data.email,
                        nombre=estudiante_data.nombre,
                        apellido=estudiante_data.apellido,
                        cedula=estudiante_data.cedula,
                        rol=RolUsuario.ESTUDIANTE,
                        password_hash=get_password_hash("123456")  # Password temporal
                    )
                    db.add(nuevo_usuario)
                    db.commit()
                    db.refresh(nuevo_usuario)
                    usuarios_creados += 1
                    usuario_id = nuevo_usuario.id
                else:
                    usuario_id = usuario_existente.id
                
                # Verificar si ya está inscrito
                inscripcion_existente = db.query(Inscripcion).filter(
                    Inscripcion.curso_id == curso_id,
                    Inscripcion.estudiante_id == usuario_id,
                    Inscripcion.is_active == True
                ).first()
                
                if not inscripcion_existente:
                    # Crear inscripción
                    nueva_inscripcion = Inscripcion(
                        curso_id=curso_id,
                        estudiante_id=usuario_id
                    )
                    db.add(nueva_inscripcion)
                    db.commit()
                    inscripciones_creadas += 1
                    exitosos.append(f"{estudiante_data.nombre} {estudiante_data.apellido} - {estudiante_data.email}")
                else:
                    exitosos.append(f"{estudiante_data.nombre} {estudiante_data.apellido} - Ya inscrito")
                
            except Exception as e:
                errores.append(f"Fila {index + 2}: {str(e)}")  # +2 porque Excel empieza en 1 y hay header
                continue
        
        return CSVImportResponse(
            total_procesados=len(df),
            usuarios_creados=usuarios_creados,
            inscripciones_creadas=inscripciones_creadas,
            errores=errores,
            exitosos=exitosos
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando archivo XLSX: {str(e)}")

# GESTIÓN DE INSCRIPCIONES
@router.get("/inscripciones")
def get_inscripciones(
    skip: int = 0,
    limit: int = 25,
    search: str = None,
    curso_id: str = None,
    estudiante_id: str = None,
    completado: bool = None,
    activos: bool = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar inscripciones con filtros"""
    query = db.query(Inscripcion, Usuario, Curso).join(
        Usuario, Inscripcion.estudiante_id == Usuario.id
    ).join(
        Curso, Inscripcion.curso_id == Curso.id
    )
    
    # Filtros
    if search:
        query = query.filter(
            or_(
                Usuario.nombre.ilike(f"%{search}%"),
                Usuario.apellido.ilike(f"%{search}%"),
                Usuario.email.ilike(f"%{search}%"),
                Curso.nombre.ilike(f"%{search}%")
            )
        )
    
    if curso_id:
        query = query.filter(Inscripcion.curso_id == curso_id)
        
    if estudiante_id:
        query = query.filter(Inscripcion.estudiante_id == estudiante_id)
        
    if completado is not None:
        query = query.filter(Inscripcion.completado == completado)
        
    if activos is not None:
        query = query.filter(Inscripcion.is_active == activos)
    
    # Si es profesor, solo sus cursos
    if current_user.rol == RolUsuario.PROFESOR:
        query = query.filter(Curso.instructor_id == current_user.id)
    
    # Si es estudiante, solo sus inscripciones
    if current_user.rol == RolUsuario.ESTUDIANTE:
        query = query.filter(Inscripcion.estudiante_id == current_user.id)
    
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    # Preparar respuesta
    inscripciones_detalladas = []
    for inscripcion, usuario, curso in results:
        # Obtener instructor
        instructor = db.query(Usuario).filter(Usuario.id == curso.instructor_id).first()
        
        inscripcion_data = {
            "id": inscripcion.id,
            "curso_id": curso.id,
            "curso_nombre": curso.nombre,
            "curso_descripcion": curso.descripcion,
            "instructor_nombre": instructor.nombre_completo if instructor else None,
            "estudiante_id": usuario.id,
            "estudiante_nombre": usuario.nombre_completo,
            "estudiante_email": usuario.email,
            "estudiante_cedula": usuario.cedula,
            "fecha_inscripcion": inscripcion.fecha_inscripcion,
            "completado": inscripcion.completado,
            "is_active": inscripcion.is_active,
            "duracion": curso.duracion,
            "fecha_inicio": curso.fecha_inicio,
            "fecha_fin": curso.fecha_fin
        }
        inscripciones_detalladas.append(inscripcion_data)
    
    return {
        "data": inscripciones_detalladas,
        "total": total,
        "page": (skip // limit) + 1,
        "per_page": limit,
        "pages": math.ceil(total / limit) if total > 0 else 0
    }

@router.put("/inscripciones/{inscripcion_id}/completar")
def marcar_inscripcion_completada(
    inscripcion_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Marcar inscripción como completada"""
    
    inscripcion = db.query(Inscripcion).filter(Inscripcion.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Verificar permisos
    if current_user.rol == RolUsuario.PROFESOR:
        curso = db.query(Curso).filter(Curso.id == inscripcion.curso_id).first()
        if not curso or str(curso.instructor_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Sin permisos para modificar esta inscripción")
    
    inscripcion.completado = True
    db.commit()
    
    return {"message": "Inscripción marcada como completada"}

@router.delete("/inscripciones/{inscripcion_id}")
def desactivar_inscripcion(
    inscripcion_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Desactivar inscripción (soft delete)"""
    
    inscripcion = db.query(Inscripcion).filter(Inscripcion.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Verificar permisos
    if current_user.rol == RolUsuario.PROFESOR:
        curso = db.query(Curso).filter(Curso.id == inscripcion.curso_id).first()
        if not curso or str(curso.instructor_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Sin permisos para modificar esta inscripción")
    
    inscripcion.is_active = False
    db.commit()
    
    return {"message": "Inscripción desactivada correctamente"}

# HEALTH CHECK
@router.get("/health")
def health_check():
    """Health check del servicio"""
    return {"status": "healthy", "service": "cursos-service"}