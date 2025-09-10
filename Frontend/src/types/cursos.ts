// Tipos para el microservicio de cursos

export interface Curso {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion?: number; // horas
  fecha_inicio?: string; // ISO date string
  fecha_fin?: string; // ISO date string
  instructor_id: string;
  instructor_nombre?: string; // Agregado por el backend
  plantilla_id?: string;
  is_active: boolean;
  fecha_creacion: string; // ISO datetime string
}

export interface CursoCreate {
  nombre: string;
  descripcion?: string;
  duracion?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  instructor_id: string;
}

export interface CursoUpdate {
  nombre?: string;
  descripcion?: string;
  duracion?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  instructor_id?: string;
}

export interface Inscripcion {
  id: string;
  curso_id: string;
  estudiante_id: string;
  fecha_inscripcion: string; // ISO datetime string
  completado: boolean;
  is_active: boolean;
}

export interface InscripcionCreate {
  estudiante_id: string;
}

export interface InscripcionResponse extends Inscripcion {
  estudiante_nombre?: string;
  estudiante_email?: string;
}

export interface EstudianteCurso {
  inscripcion_id: string;
  estudiante_id: string;
  nombre_completo: string;
  email: string;
  cedula: string;
  fecha_inscripcion: string;
  completado: boolean;
}

export interface EstudiantesCursoResponse {
  curso_id: string;
  curso_nombre: string;
  total_estudiantes: number;
  estudiantes: EstudianteCurso[];
}

// Interfaces adicionales para gestión de inscripciones
export interface InscripcionDetallada {
  id: string;
  curso_id: string;
  curso_nombre: string;
  curso_descripcion?: string;
  instructor_nombre?: string;
  estudiante_id: string;
  estudiante_nombre: string;
  estudiante_email: string;
  estudiante_cedula: string;
  fecha_inscripcion: string;
  completado: boolean;
  is_active: boolean;
  duracion?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface InscripcionesFilters {
  skip?: number;
  limit?: number;
  search?: string;
  curso_id?: string;
  estudiante_id?: string;
  completado?: boolean;
  activos?: boolean;
}

export interface PaginatedInscripcionesResponse {
  data: InscripcionDetallada[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface EstudianteCSV {
  email: string;
  nombre: string;
  apellido: string;
  cedula: string;
}

export interface CSVImportResponse {
  total_procesados: number;
  usuarios_creados: number;
  inscripciones_creadas: number;
  errores: string[];
  exitosos: string[];
}

export interface PaginatedCursosResponse {
  data: Curso[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface CursosFilters {
  skip?: number;
  limit?: number;
  search?: string;
  instructor_id?: string;
  activos?: boolean;
}

// Enums
export enum RolUsuario {
  ADMIN = "ADMIN",
  PROFESOR = "PROFESOR",
  ESTUDIANTE = "ESTUDIANTE"
}