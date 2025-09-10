# Sistema CDP - Certificados Digitales

Sistema de gestión de certificados digitales con arquitectura de microservicios.

## Arquitectura

- **Frontend**: Next.js 15 con NextAuth.js para autenticación
- **Backend**: FastAPI con PostgreSQL
- **Autenticación**: JWT tokens con NextAuth.js

## Configuración y Ejecución

### Backend (FastAPI)

1. Navegar al directorio del backend:
```bash
cd Backend
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecutar con Docker Compose:
```bash
docker-compose up -d
```

El backend estará disponible en: http://localhost:8001

### Frontend (Next.js)

1. Navegar al directorio del frontend:
```bash
cd Frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Ejecutar en modo desarrollo:
```bash
npm run dev
```

El frontend estará disponible en: http://localhost:3000

## Usuarios de Prueba

El sistema crea automáticamente un usuario administrador:

- **Email**: admin@test.com
- **Contraseña**: admin123
- **Rol**: ADMIN

## Funcionalidades Implementadas

### Autenticación
- ✅ Login con email y contraseña
- ✅ Protección de rutas con middleware
- ✅ Manejo de sesiones con NextAuth.js
- ✅ Tokens JWT del backend
- ✅ Logout

### Dashboard
- ✅ Información del usuario autenticado
- ✅ Interfaz diferenciada por rol (Admin, Profesor, Estudiante)
- ✅ Lista de usuarios (solo Admin)
- ✅ Conexión con API del backend

### Backend API
- ✅ Autenticación JWT
- ✅ CRUD de usuarios
- ✅ Roles y permisos
- ✅ Base de datos PostgreSQL
- ✅ Validaciones con Pydantic

## Estructura del Proyecto

```
├── Backend/
│   ├── app/
│   │   ├── auth.py          # Autenticación JWT
│   │   ├── database.py      # Configuración DB
│   │   ├── dependencies.py  # Dependencias FastAPI
│   │   ├── main.py         # App principal
│   │   ├── models.py       # Modelos SQLAlchemy
│   │   ├── routes.py       # Endpoints API
│   │   └── schemas.py      # Esquemas Pydantic
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/auth/[...nextauth]/route.ts
│   │   │   ├── auth/login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── auth/SigninForm.tsx
│   │   │   ├── dashboard/UsersList.tsx
│   │   │   └── providers/SessionProvider.tsx
│   │   ├── lib/api.ts
│   │   └── types/next-auth.d.ts
│   ├── .env
│   └── package.json
└── README.md
```

## Variables de Entorno

### Frontend (.env)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=secret
BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

### Backend (docker-compose.yml)
```
DATABASE_URL=postgresql://postgres:password123@postgres:5432/certificados
SECRET_KEY=clave-secreta-desarrollo-cambiar-en-produccion
DEBUG=True
```

## Próximos Pasos

1. **Registro de usuarios**: Implementar formulario de registro
2. **Gestión de cursos**: CRUD de cursos y asignaciones
3. **Certificados**: Generación y gestión de certificados
4. **Notificaciones**: Sistema de notificaciones
5. **Reportes**: Dashboard con estadísticas
6. **Tests**: Pruebas unitarias e integración

## Tecnologías Utilizadas

- **Frontend**: Next.js 15, NextAuth.js, Radix UI, Tailwind CSS, TypeScript
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, JWT, Pydantic
- **DevOps**: Docker, Docker Compose