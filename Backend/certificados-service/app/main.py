# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import router
from app.database import create_tables, SessionLocal
from app.models import Usuario, RolUsuario
from app.auth import get_password_hash

# Crear app FastAPI
app = FastAPI(
    title="Certificados Service",
    version="1.0.0",
    description="Microservicio de gestión de certificados y plantillas",
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

# Servir archivos estáticos
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=uploads_dir), name="static")

def create_default_admin():
    """Crear usuario administrador por defecto"""
    db = SessionLocal()
    try:
        # Verificar si ya existe el admin
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

@app.on_event("startup")
def startup_event():
    """Ejecutar al iniciar la aplicación"""
    create_tables()
    create_default_admin()

@app.get("/")
def root():
    """Endpoint raíz"""
    return {
        "service": "certificados-service",
        "version": "1.0.0",
        "status": "running"
    }