# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router
from app.database import create_tables, SessionLocal
from app.models import Usuario, RolUsuario
from app.auth import get_password_hash

# Crear app FastAPI
app = FastAPI(
    title="Usuarios Service",
    version="1.0.0",
    description="Microservicio de gestión de usuarios y autenticación",
    docs_url="/docs" if os.getenv("DEBUG", "True") == "True" else None
)

# CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(router)

def create_default_admin():
    """Crear usuario administrador por defecto"""
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.email == "admin@test.com").first()
        if not admin:
            admin = Usuario(
                email="admin@test.com",
                nombre="Admin",
                apellido="Sistema",
                cedula="0000000000",
                rol=RolUsuario.ADMIN,
                password_hash=get_password_hash("admin123")
            )
            db.add(admin)
            db.commit()
            print("✅ Usuario admin creado: admin@test.com / admin123")
        else:
            print("ℹ️  Usuario admin ya existe")
    finally:
        db.close()

def create_default_instructor():
    """Crear usuario instructor por defecto"""
    db = SessionLocal()
    try:
        instructor = db.query(Usuario).filter(Usuario.email == "instructorDefaul@gmail.com").first()
        if not instructor:
            instructor = Usuario(
                email="instructorDefaul@gmail.com",
                nombre="Instructor",
                apellido="Por Defecto",
                cedula="111111",
                rol=RolUsuario.PROFESOR,  
                password_hash=get_password_hash("123456")
            )
            db.add(instructor)
            db.commit()
            print("✅ Usuario instructor creado: instructorDefaul@gmail.com / 123456")
        else:
            print("ℹ️  Usuario instructor ya existe")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    """Ejecutar al iniciar la aplicación"""
    create_tables()
    create_default_admin()
    create_default_instructor()
