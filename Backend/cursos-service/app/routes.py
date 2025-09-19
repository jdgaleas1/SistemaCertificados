# app/routes.py
from typing import List
import pandas as pd
import io
import math
import re
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

@router.post("/admin/limpiar-datos")
def limpiar_datos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Limpiar datos del sistema (solo administradores)"""
    
    try:
        # 1. Desactivar inscripciones
        inscripciones_count = db.query(Inscripcion).filter(Inscripcion.is_active == True).update(
            {"is_active": False}, synchronize_session=False
        )
        
        # 2. Desactivar cursos (excepto los predeterminados si existen)
        cursos_count = db.query(Curso).filter(Curso.is_active == True).update(
            {"is_active": False}, synchronize_session=False
        )
        
        # Commit los cambios
        db.commit()
        
        # 3. Para usuarios, necesitamos llamar al servicio de usuarios
        # Esto se manejará desde el frontend para mantener la separación de servicios
        
        return {
            "message": "Limpieza de datos completada",
            "inscripciones_desactivadas": inscripciones_count,
            "cursos_desactivados": cursos_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error al limpiar datos: {str(e)}"
        )

@router.post("/inscripciones/xlsx", response_model=CSVImportResponse)
async def import_xlsx_estructura_cdp(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_teacher_or_admin)
):
    """Importación completa CDP desde Excel con estructura específica"""
    
    # Verificar formato del archivo
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser XLSX o XLS")
    
    try:
        # Leer archivo Excel
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # Log para debugging
        print(f"Columnas encontradas en el Excel: {list(df.columns)}")
        print(f"Primeras 3 filas del Excel: {df.head(3).to_dict()}")
        
        # Mapeo flexible de columnas (buscar por coincidencia parcial)
        column_mapping = {}
        expected_columns = {
            'nombres': ['Nombres Estudiante', 'nombres estudiante', 'Nombres', 'nombres'],
            'apellidos': ['Apellidos Estudiante', 'apellidos estudiante', 'Apellidos', 'apellidos'],
            'cedula': ['Número de cédula estudiante', 'Numero de cedula estudiante', 'Cédula', 'Cedula', 'cedula'],
            'email': ['Correo estudiante', 'correo estudiante', 'Email', 'email', 'Correo', 'correo'],
            'curso': ['Curso', 'curso'],
            'estado': ['Estudiante Activo/Inactivo', 'estudiante activo/inactivo', 'Estado', 'estado'],
            'instructor': ['Instructor a cargo del curso', 'instructor a cargo del curso', 'Instructor', 'instructor']
        }
        
        # Buscar columnas por coincidencia
        for key, possible_names in expected_columns.items():
            found = False
            for col in df.columns:
                if any(name.lower() in col.lower() for name in possible_names):
                    column_mapping[key] = col
                    found = True
                    break
            if not found:
                print(f"No se encontró columna para: {key}")
                print(f"Buscando: {possible_names}")
                print(f"Columnas disponibles: {list(df.columns)}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"No se encontró columna para {key}. Buscando: {possible_names}. Columnas disponibles: {', '.join(df.columns)}"
                )
        
        print(f"Mapeo de columnas: {column_mapping}")
        
        # Limpiar datos
        df = df.fillna('')
        
        # Contadores para el reporte
        usuarios_creados = 0
        cursos_creados = 0
        inscripciones_creadas = 0
        errores = []
        exitosos = []
        
        # Cache para evitar consultas repetidas
        instructores_cache = {}
        cursos_cache = {}
        estudiantes_procesados = {}  # Para manejar cédulas duplicadas
        inscripciones_procesadas = set()  # Para evitar duplicados en el mismo curso
        
        for index, row in df.iterrows():
            try:
                # Limpiar datos de la fila usando el mapeo de columnas
                nombres = str(row[column_mapping['nombres']]).strip()
                apellidos = str(row[column_mapping['apellidos']]).strip()
                cedula = str(row[column_mapping['cedula']]).strip()
                email = str(row[column_mapping['email']]).strip().lower()
                curso_nombre = str(row[column_mapping['curso']]).strip()
                estado_texto = str(row[column_mapping['estado']]).strip()
                instructor_email = str(row[column_mapping['instructor']]).strip().lower()
                
                # Validar datos obligatorios
                if not all([nombres, apellidos, cedula, email, curso_nombre]):
                    errores.append(f"Fila {index + 2}: Datos incompletos")
                    continue
                
                # Validar formato de email
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_pattern, email):
                    errores.append(f"Fila {index + 2}: Email inválido: {email}")
                    continue
                
                # Validar cédula (solo números, mínimo 5 dígitos)
                if not cedula.isdigit() or len(cedula) < 5:
                    errores.append(f"Fila {index + 2}: Cédula inválida: {cedula}")
                    continue
                
                # Convertir estado Activo/Inactivo
                is_active = estado_texto.lower() == 'activo'
                
                # 1. PROCESAR INSTRUCTOR (siempre usar instructor por defecto)
                if "instructorDefaul@gmail.com" not in instructores_cache:
                    # Buscar el instructor por defecto
                    instructor = db.query(Usuario).filter(
                        Usuario.email == "instructorDefaul@gmail.com"
                    ).first()
                    
                    if not instructor:
                        errores.append(f"Fila {index + 2}: No se encontró instructor por defecto")
                        continue
                    
                    instructores_cache["instructorDefaul@gmail.com"] = instructor.id
                
                instructor_id = instructores_cache["instructorDefaul@gmail.com"]
                
                # 2. PROCESAR CURSO
                curso_key = f"{curso_nombre}_{instructor_id}"
                if curso_key not in cursos_cache:
                    # Buscar curso existente
                    curso = db.query(Curso).filter(
                        Curso.nombre == curso_nombre,
                        Curso.instructor_id == instructor_id
                    ).first()
                    
                    if not curso:
                        # Crear nuevo curso
                        curso = Curso(
                            nombre=curso_nombre,
                            instructor_id=instructor_id,
                            is_active=True  # Asegurar que esté activo
                        )
                        db.add(curso)
                        db.flush()  # Para obtener el ID
                        cursos_creados += 1
                    else:
                        # NUEVO: Reactivar curso si estaba desactivado
                        if not curso.is_active:
                            curso.is_active = True
                            print(f"🔄 Reactivando curso: {curso.nombre}")
                    
                    cursos_cache[curso_key] = curso.id
                
                curso_id = cursos_cache[curso_key]
                
                # 3. PROCESAR ESTUDIANTE (manejar duplicados por cédula o email)
                # Buscar estudiante existente por cédula o email
                estudiante = db.query(Usuario).filter(
                    or_(Usuario.cedula == cedula, Usuario.email == email)
                ).first()
                
                if not estudiante:
                    # Crear nuevo estudiante
                    estudiante = Usuario(
                        email=email,
                        nombre=nombres,
                        apellido=apellidos,
                        cedula=cedula,
                        rol=RolUsuario.ESTUDIANTE,
                        password_hash=get_password_hash("123456")  # Password temporal
                    )
                    db.add(estudiante)
                    db.flush()
                    usuarios_creados += 1
                else:
                    # Actualizar datos del estudiante existente (Excel prevalece)
                    estudiante.email = email
                    estudiante.nombre = nombres
                    estudiante.apellido = apellidos
                    estudiante.cedula = cedula
                    estudiante.is_active = True  # ← AGREGAR ESTA LÍNEA
                    db.flush()
                
                estudiante_id = estudiante.id
                
                # 4. CREAR/ACTUALIZAR INSCRIPCIÓN
                # Crear clave única para esta combinación estudiante-curso
                inscripcion_key = f"{estudiante_id}_{curso_id}"
                
                # Verificar si ya procesamos esta combinación en este Excel
                if inscripcion_key in inscripciones_procesadas:
                    print(f"⚠️ Duplicado en Excel: {nombres} {apellidos} ya está en {curso_nombre}")
                    errores.append(f"Fila {index + 2}: {nombres} {apellidos} ya está inscrito en {curso_nombre} (duplicado en el Excel)")
                    continue
                
                # Marcar como procesado
                inscripciones_procesadas.add(inscripcion_key)
                
                # Buscar inscripción existente en la base de datos
                inscripcion_existente = db.query(Inscripcion).filter(
                    Inscripcion.curso_id == curso_id,
                    Inscripcion.estudiante_id == estudiante_id
                ).first()
                
                if inscripcion_existente:
                    # Actualizar inscripción existente
                    inscripcion_existente.is_active = is_active
                    inscripcion_existente.completado = False  # Reset por si cambió estado
                    print(f"🔄 Actualizada inscripción: {nombres} {apellidos} en {curso_nombre}")
                else:
                    # Crear nueva inscripción
                    inscripcion = Inscripcion(
                        curso_id=curso_id,
                        estudiante_id=estudiante_id,
                        is_active=is_active
                    )
                    db.add(inscripcion)
                    inscripciones_creadas += 1
                    print(f"✅ Nueva inscripción: {nombres} {apellidos} en {curso_nombre}")
                
                # Registro exitoso
                estado_str = "Activo" if is_active else "Inactivo"
                exitosos.append(f"{nombres} {apellidos} → {curso_nombre} ({estado_str})")
                
            except Exception as e:
                errores.append(f"Fila {index + 2}: {str(e)}")
                continue
        
        # Confirmar todos los cambios
        db.commit()
        
        # Estadísticas adicionales
        estudiantes_unicos = len(estudiantes_procesados)
        cursos_unicos = len(cursos_cache)
        
        print(f"📊 Resumen de importación:")
        print(f"  - Filas procesadas: {len(df)}")
        print(f"  - Estudiantes únicos: {estudiantes_unicos}")
        print(f"  - Cursos únicos: {cursos_unicos}")
        print(f"  - Inscripciones creadas: {inscripciones_creadas}")
        print(f"  - Errores: {len(errores)}")
        
        return CSVImportResponse(
            total_procesados=len(df),
            usuarios_creados=usuarios_creados,
            inscripciones_creadas=inscripciones_creadas,
            errores=errores,
            exitosos=exitosos
        )
        
    except Exception as e:
        db.rollback()
        print(f"Error completo al procesar Excel: {str(e)}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Error procesando archivo Excel: {str(e)}")

# OBTENER INSCRIPCIONES DE UN ESTUDIANTE
@router.get("/estudiantes/{estudiante_id}/inscripciones")
def get_inscripciones_estudiante(
    estudiante_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener todas las inscripciones de un estudiante específico"""
    
    # Verificar que el estudiante existe
    estudiante = db.query(Usuario).filter(Usuario.id == estudiante_id).first()
    if not estudiante:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Verificar permisos (estudiante solo puede ver sus propias inscripciones)
    if current_user.rol == RolUsuario.ESTUDIANTE and str(current_user.id) != str(estudiante_id):
        raise HTTPException(status_code=403, detail="Sin permisos para ver inscripciones de otros estudiantes")
    
    # Obtener inscripciones con datos del curso
    inscripciones = db.query(Inscripcion, Curso, Usuario).join(
        Curso, Inscripcion.curso_id == Curso.id
    ).join(
        Usuario, Curso.instructor_id == Usuario.id
    ).filter(
        Inscripcion.estudiante_id == estudiante_id,
        Inscripcion.is_active == True
    ).all()
    
    inscripciones_detalladas = []
    for inscripcion, curso, instructor in inscripciones:
        inscripcion_data = {
            "inscripcion_id": inscripcion.id,
            "curso_id": curso.id,
            "curso_nombre": curso.nombre,
            "instructor_nombre": instructor.nombre_completo,
            "fecha_inscripcion": inscripcion.fecha_inscripcion,
            "completado": inscripcion.completado,
            "is_active": inscripcion.is_active
        }
        inscripciones_detalladas.append(inscripcion_data)
    
    return {
        "estudiante_id": estudiante_id,
        "estudiante_nombre": estudiante.nombre_completo,
        "total_inscripciones": len(inscripciones_detalladas),
        "inscripciones": inscripciones_detalladas
    }

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