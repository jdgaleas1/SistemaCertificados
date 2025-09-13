# app/dependencies.py - CERTIFICADOS SERVICE
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import verify_token

security = HTTPBearer()

def get_current_user_info(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Obtener información del usuario actual desde JWT token
    Retorna un diccionario con la info del usuario sin acceso a BD
    """
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido - sin user ID"
        )
    
    # Retornar info básica del usuario desde el token
    return {
        "id": user_id,
        "token_payload": payload
    }

def require_auth(
    user_info: dict = Depends(get_current_user_info)
) -> dict:
    """
    Dependency simple que requiere autenticación
    """
    return user_info