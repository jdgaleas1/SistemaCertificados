# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from functools import wraps

from app.database import get_db
from app.auth import verify_token
from app.models import Usuario, RolUsuario

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """Obtener usuario actual desde JWT token"""
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    return user

def require_role(*allowed_roles: RolUsuario):
    """Decorator para requerir roles específicos"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                # Si no hay current_user en kwargs, buscar en dependencies
                for arg in args:
                    if isinstance(arg, Usuario):
                        current_user = arg
                        break
            
            if not current_user or current_user.rol not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Sin permisos suficientes"
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator

def get_admin_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Verificar que el usuario sea administrador"""
    if current_user.rol != RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user

def get_teacher_or_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """Verificar que el usuario sea profesor o administrador"""
    if current_user.rol not in [RolUsuario.ADMIN, RolUsuario.PROFESOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de profesor o administrador"
        )
    return current_user