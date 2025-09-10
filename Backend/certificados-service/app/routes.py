# app/routes.py
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.responses import JSONResponse
import os, uuid, json
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Usuario, Plantilla
from app.schemas import (
    UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioLogin, Token, TokenRefresh,
    PlantillaCreate, PlantillaUpdate, PlantillaResponse
)
from app.auth import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.dependencies import get_current_user, get_admin_user

router = APIRouter()

# AUTH ENDPOINTS
@router.post("/auth/login", response_model=Token)
def login(user_login: UsuarioLogin, db: Session = Depends(get_db)):
    """Login de usuario"""
    
    user = db.query(Usuario).filter(Usuario.email == user_login.email).first()
    
    if not user or not verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UsuarioResponse.from_orm(user)
    }

@router.post("/auth/refresh", response_model=TokenRefresh)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Renovar access token"""
    
    payload = verify_token(refresh_token, "refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )
    
    user_id = payload.get("sub")
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inválido"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/auth/me", response_model=UsuarioResponse)
def get_me(current_user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return UsuarioResponse.from_orm(current_user)

# USUARIOS CRUD
@router.get("/usuarios", response_model=List[UsuarioResponse])
def get_usuarios(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Obtener lista de usuarios (solo admin)"""
    users = db.query(Usuario).offset(skip).limit(limit).all()
    return [UsuarioResponse.from_orm(user) for user in users]

@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Crear nuevo usuario (solo admin)"""
    
    # Verificar si email ya existe
    if db.query(Usuario).filter(Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Verificar si cédula ya existe
    if db.query(Usuario).filter(Usuario.cedula == usuario.cedula).first():
        raise HTTPException(status_code=400, detail="Cédula ya registrada")
    
    try:
        db_user = Usuario(
            email=usuario.email,
            nombre=usuario.nombre,
            apellido=usuario.apellido,
            cedula=usuario.cedula,
            rol=usuario.rol,
            password_hash=get_password_hash(usuario.password)
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return UsuarioResponse.from_orm(db_user)
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error: datos duplicados")

@router.get("/usuarios/{user_id}", response_model=UsuarioResponse)
def get_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener usuario por ID"""
    
    # Admin puede ver cualquiera, usuarios normales solo a sí mismos
    if current_user.rol.value != "ADMIN" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return UsuarioResponse.from_orm(user)

@router.put("/usuarios/{user_id}", response_model=UsuarioResponse)
def update_usuario(
    user_id: str,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar usuario"""
    
    # Admin puede editar cualquiera, usuarios normales solo a sí mismos
    if current_user.rol.value != "ADMIN" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Solo admin puede cambiar rol y estado
    if current_user.rol.value != "ADMIN":
        usuario_update.rol = None
        usuario_update.is_active = None
    
    update_data = usuario_update.dict(exclude_unset=True)
    
    # Verificar email único
    if "email" in update_data:
        existing = db.query(Usuario).filter(
            Usuario.email == update_data["email"],
            Usuario.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email ya en uso")
    
    # Verificar cédula única
    if "cedula" in update_data:
        existing = db.query(Usuario).filter(
            Usuario.cedula == update_data["cedula"],
            Usuario.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cédula ya en uso")
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UsuarioResponse.from_orm(user)

@router.delete("/usuarios/{user_id}")
def delete_usuario(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Eliminar usuario (soft delete) - solo admin"""
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.is_active = False
    db.commit()
    
    return {"message": "Usuario eliminado correctamente"}

# HEALTH CHECK
@router.get("/health")
def health_check():
    """Health check del servicio"""
    return {"status": "healthy", "service": "certificados-service"}

@router.get("/debug/files")
def debug_files():
    """Debug endpoint para ver archivos en uploads"""
    try:
        files = []
        if os.path.exists(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                filepath = os.path.join(UPLOAD_DIR, filename)
                if os.path.isfile(filepath):
                    files.append({
                        "name": filename,
                        "size": os.path.getsize(filepath),
                        "path": filepath
                    })
        return {
            "upload_dir": UPLOAD_DIR,
            "dir_exists": os.path.exists(UPLOAD_DIR),
            "files": files
        }
    except Exception as e:
        return {"error": str(e)}


# ===================== TEMPLATES (PLANTILLAS) =====================
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "plantillas")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/templates/upload-image")
async def upload_template_image(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_admin_user)
):
    if not file.filename.lower().endswith(".png"):
        raise HTTPException(status_code=400, detail="El archivo debe ser PNG")

    unique_name = f"{uuid.uuid4()}.png"
    path = os.path.join(UPLOAD_DIR, unique_name)
    content = await file.read()
    
    # Debug: verificar que el directorio existe
    print(f"Upload directory: {UPLOAD_DIR}")
    print(f"Directory exists: {os.path.exists(UPLOAD_DIR)}")
    print(f"Full path: {path}")
    
    with open(path, "wb") as f:
        f.write(content)
    
    # Verificar que el archivo se guardó
    file_exists = os.path.exists(path)
    print(f"File saved successfully: {file_exists}")
    print(f"File size: {os.path.getsize(path) if file_exists else 'N/A'} bytes")

    # URL absoluta para el frontend
    base_url = "http://localhost:8003"  # En producción usar variable de entorno
    return {"url": f"{base_url}/static/plantillas/{unique_name}", "filename": unique_name}

@router.post("/templates", response_model=PlantillaResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: PlantillaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
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

@router.get("/templates", response_model=List[PlantillaResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    items = db.query(Plantilla).order_by(Plantilla.fecha_creacion.desc()).all()
    result: List[PlantillaResponse] = []
    for t in items:
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
    current_user: Usuario = Depends(get_current_user)
):
    t = db.query(Plantilla).filter(Plantilla.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return PlantillaResponse(
        id=t.id,
        nombre=t.nombre,
        descripcion=t.descripcion,
        background_image_url=t.background_image_url,
        canvas=json.loads(t.canvas_json) if t.canvas_json else None,
        fields=json.loads(t.fields_json) if t.fields_json else None,
        is_active=t.is_active,
        fecha_creacion=t.fecha_creacion,
    )

@router.put("/templates/{template_id}", response_model=PlantillaResponse)
def update_template(
    template_id: str,
    data: PlantillaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    t = db.query(Plantilla).filter(Plantilla.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    if data.nombre is not None:
        t.nombre = data.nombre
    if data.descripcion is not None:
        t.descripcion = data.descripcion
    if data.background_image_url is not None:
        t.background_image_url = data.background_image_url
    if data.canvas is not None:
        t.canvas_json = json.dumps(data.canvas)
    if data.fields is not None:
        t.fields_json = json.dumps(data.fields)
    if data.is_active is not None:
        t.is_active = data.is_active

    db.commit()
    db.refresh(t)
    return PlantillaResponse(
        id=t.id,
        nombre=t.nombre,
        descripcion=t.descripcion,
        background_image_url=t.background_image_url,
        canvas=json.loads(t.canvas_json) if t.canvas_json else None,
        fields=json.loads(t.fields_json) if t.fields_json else None,
        is_active=t.is_active,
        fecha_creacion=t.fecha_creacion,
    )

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    t = db.query(Plantilla).filter(Plantilla.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    db.delete(t)
    db.commit()
    return {"message": "Plantilla eliminada"}