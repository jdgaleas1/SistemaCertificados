# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router
from app.database import create_tables

# Crear app FastAPI
app = FastAPI(
    title="Cursos Service",
    version="1.0.0",
    description="Microservicio de gestión de cursos e inscripciones",
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

@app.on_event("startup")
def startup_event():
    """Ejecutar al iniciar la aplicación"""
    create_tables()

@app.get("/")
def root():
    """Endpoint raíz"""
    return {
        "service": "cursos-service",
        "version": "1.0.0",
        "status": "running"
    }