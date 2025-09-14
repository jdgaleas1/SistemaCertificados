# Sistema de Correos Masivos - Configuración

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
# Configuración de Base de Datos
DATABASE_URL=postgresql://postgres:password123@localhost:5433/certificados

# Configuración de Autenticación
SECRET_KEY=clave-secreta-desarrollo
DEBUG=True

# Configuración SMTP2GO
SMTP2GO_API_KEY=api-06F19BFC42054281A784667281E3FDAA
SMTP2GO_SENDER_EMAIL=Centro de Desarrollo Profesional CDP <documentos@capacitacionescdp.com>
SMTP2GO_LOTE_SIZE=10
SMTP2GO_PAUSA_LOTES=20

# URLs de los servicios
BASE_URL=http://localhost:8003
```

## Funcionalidades Implementadas

### Backend (certificados-service)

1. **Gestión de Plantillas de Email**
   - CRUD completo para plantillas HTML
   - Variables dinámicas: `{NOMBRE}`, `{APELLIDO}`, `{CEDULA}`, etc.
   - Extracción automática de variables del HTML

2. **Envío de Correos**
   - Envío individual con plantillas personalizables
   - Envío masivo por lotes con configuración de pausas
   - Integración con SMTP2GO
   - Adjuntos de certificados PDF automáticos

3. **Logs y Estadísticas**
   - Registro de todos los envíos
   - Estadísticas de éxito/error
   - Tiempo de envío y métricas

### Frontend

1. **Gestión de Plantillas** (`/dashboard/correos/plantillas`)
   - Editor visual de plantillas HTML
   - Vista previa en tiempo real
   - Variables dinámicas disponibles

2. **Envío Masivo** (`/dashboard/correos/masivo`)
   - Selección de curso
   - Vista previa de destinatarios
   - Configuración de lotes y pausas
   - Progreso en tiempo real

3. **Envío Individual** (`/dashboard/correos/individual`)
   - Selección de estudiante
   - Contenido personalizado o plantilla
   - Vista previa del correo

## Uso del Sistema

### 1. Configurar Plantillas de Email

1. Ve a `/dashboard/correos/plantillas`
2. Crea una nueva plantilla o edita una existente
3. Usa variables como `{NOMBRE}`, `{APELLIDO}`, `{CEDULA}`, etc.
4. Guarda la plantilla

### 2. Envío Masivo por Curso

1. Ve a `/dashboard/correos/masivo`
2. Selecciona un curso
3. Selecciona la plantilla de email
4. (Opcional) Selecciona plantilla de certificado
5. Configura variables globales si es necesario
6. Ajusta la configuración de lotes
7. Revisa la vista previa de destinatarios
8. Envía los correos

### 3. Envío Individual

1. Ve a `/dashboard/correos/individual`
2. Selecciona un estudiante
3. Elige usar plantilla o contenido personalizado
4. (Opcional) Selecciona plantilla de certificado
5. Personaliza variables si es necesario
6. Revisa la vista previa
7. Envía el correo

## Variables Disponibles

- `{NOMBRE}` - Nombre del estudiante
- `{APELLIDO}` - Apellido del estudiante
- `{NOMBRE_COMPLETO}` - Nombre completo
- `{EMAIL}` - Email del estudiante
- `{CEDULA}` - Cédula del estudiante
- `{CURSO}` - Nombre del curso (en envío masivo)
- `{FECHA}` - Fecha actual
- `{DURACION}` - Duración del curso
- `{INSTRUCTOR}` - Nombre del instructor

## Configuración de Lotes

- **Lote Size**: Número de correos por lote (1-50)
- **Pausa entre Lotes**: Tiempo de espera entre lotes (0-300 segundos)
- **Pausa Individual**: Tiempo entre correos individuales (0-10 segundos)

## Integración con SMTP2GO

El sistema está configurado para usar SMTP2GO con:
- API Key configurada en variables de entorno
- Sender email personalizado
- Adjuntos PDF automáticos
- Manejo de errores y reintentos

## Estructura de Archivos

```
Backend/certificados-service/
├── app/
│   ├── email_service.py          # Servicio de envío de correos
│   ├── models.py                 # Modelos de base de datos
│   ├── routes.py                 # Endpoints de la API
│   └── schemas.py                # Esquemas de validación

Frontend/src/
├── app/dashboard/correos/
│   ├── page.tsx                  # Página principal de correos
│   ├── plantillas/page.tsx       # Gestión de plantillas
│   ├── masivo/page.tsx          # Envío masivo
│   └── individual/page.tsx      # Envío individual
├── components/correos/
│   ├── PlantillaEmailEditor.tsx  # Editor de plantillas
│   ├── PlantillasEmailList.tsx   # Lista de plantillas
│   ├── ConfiguracionLotes.tsx    # Configuración de lotes
│   └── ProgresoEnvio.tsx         # Progreso de envío
└── hooks/
    └── useEmail.ts               # Hook para funcionalidades de correo
```
