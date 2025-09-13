# app/auth.py - CERTIFICADOS SERVICE (SOLO VERIFICACIÓN)
import os
from typing import Optional
from jose import JWTError, jwt

# Configuración - debe coincidir con usuarios-service
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")
ALGORITHM = "HS256"

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verificar y decodificar token JWT
    Solo verifica tokens creados por usuarios-service
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verificar que sea del tipo correcto
        if payload.get("type") != token_type:
            return None
            
        return payload
        
    except JWTError:
        return None