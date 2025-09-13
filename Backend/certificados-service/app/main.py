# app/main.py - CERTIFICADOS SERVICE
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import router
from app.database import create_tables

# Crear app FastAPI
app = FastAPI(
    title="Certificados Service",
    version="1.0.0",
    description="Microservicio de gestión de plantillas de certificados y emails",
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

@app.on_event("startup")
def startup_event():
    """Ejecutar al iniciar la aplicación"""
    create_tables()