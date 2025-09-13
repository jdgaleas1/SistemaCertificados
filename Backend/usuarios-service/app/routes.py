# app/routes.py
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioLogin, Token, TokenRefresh, PasswordChange
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
    users = db.query(Usuario).filter(Usuario.is_active == True).offset(skip).limit(limit).all()
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
    
    # Validación especial: Un admin no puede quitarse su propio rol de administrador
    if (str(current_user.id) == user_id and 
        current_user.rol.value == "ADMIN" and 
        usuario_update.rol is not None and 
        usuario_update.rol.value != "ADMIN"):
        raise HTTPException(
            status_code=400, 
            detail="No puedes quitarte tu propio rol de administrador"
        )
    
    # Validación especial: Un usuario no puede desactivarse a sí mismo
    if (str(current_user.id) == user_id and 
        usuario_update.is_active is not None and 
        usuario_update.is_active == False):
        raise HTTPException(
            status_code=400, 
            detail="No puedes desactivar tu propia cuenta"
        )
    
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
    """Eliminar usuario (hard delete) - solo admin"""
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar que el admin no se esté eliminando a sí mismo
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=400, 
            detail="No puedes eliminar tu propia cuenta de administrador"
        )
    
    # Eliminar el usuario completamente de la base de datos
    db.delete(user)
    db.commit()
    
    return {"message": "Usuario eliminado correctamente"}

@router.put("/usuarios/{user_id}/password")
def change_user_password(
    user_id: str,
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user)
):
    """Cambiar contraseña de usuario - solo admin"""
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente"}

# HEALTH CHECK
@router.get("/health")
def health_check():
    """Health check del servicio"""
    return {"status": "healthy", "service": "usuarios-service"}