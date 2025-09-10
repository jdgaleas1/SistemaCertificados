#!/usr/bin/env python3
"""
Script de emergencia para restaurar el rol de administrador
Uso: python restore_admin.py
"""

import sys
import os

# Agregar el directorio de la app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.models import Usuario, RolUsuario

def restore_admin_role():
    """Restaurar rol de administrador al usuario admin@test.com"""
    db = SessionLocal()
    try:
        # Buscar el usuario admin
        admin = db.query(Usuario).filter(Usuario.email == "admin@test.com").first()
        
        if not admin:
            print("❌ Error: Usuario admin@test.com no encontrado")
            print("💡 Ejecutando creación de usuario admin...")
            
            # Crear usuario admin si no existe
            from app.auth import get_password_hash
            admin = Usuario(
                email="admin@test.com",
                nombre="Admin",
                apellido="Sistema", 
                cedula="0000000000",
                rol=RolUsuario.ADMIN,
                password_hash=get_password_hash("admin123"),
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✅ Usuario admin creado: admin@test.com / admin123")
            return
        
        # Verificar el rol actual
        print(f"📋 Usuario encontrado: {admin.email}")
        print(f"📋 Rol actual: {admin.rol.value}")
        print(f"📋 Estado activo: {admin.is_active}")
        
        # Restaurar rol de admin si no lo tiene
        if admin.rol != RolUsuario.ADMIN:
            admin.rol = RolUsuario.ADMIN
            print("🔧 Restaurando rol de administrador...")
        
        # Asegurar que esté activo
        if not admin.is_active:
            admin.is_active = True
            print("🔧 Activando usuario...")
        
        db.commit()
        print("✅ Rol de administrador restaurado exitosamente")
        print("✅ Credenciales: admin@test.com / admin123")
        print("✅ Ahora puedes acceder al panel de administración")
        
    except Exception as e:
        print(f"❌ Error al restaurar admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚨 Script de emergencia - Restaurar administrador")
    print("=" * 50)
    restore_admin_role()
    print("=" * 50)