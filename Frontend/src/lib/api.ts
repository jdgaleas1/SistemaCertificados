import { getSession, signOut } from "next-auth/react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

const CERTIFICADOS_SERVICE_URL =
  process.env.NEXT_PUBLIC_CERTIFICADOS_SERVICE_URL || "http://localhost:8003";

const CURSOS_SERVICE_URL = 
  process.env.NEXT_PUBLIC_CURSOS_SERVICE_URL || "http://localhost:8002";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = BACKEND_URL
): Promise<any> {
  const session = await getSession();

  console.log("API Call Debug:", {
    endpoint,
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
    accessToken: session?.accessToken
      ? `${session.accessToken.substring(0, 20)}...`
      : null,
  });

  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add authorization header if we have a session
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  } else {
    console.warn("No access token found in session:", session);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log("API Response:", {
    status: response.status,
    statusText: response.statusText,
    url,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("API Error:", {
      status: response.status,
      statusText: response.statusText,
      url,
      errorData,
      message: errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
    });

    // Handle 401 Unauthorized - automatically sign out
    if (response.status === 401) {
      console.log("Token expired or invalid, signing out...");
      await signOut({
        callbackUrl: "/auth/signin",
        redirect: true,
      });
      return; // This won't be reached due to redirect, but good practice
    }

    throw new ApiError(
      response.status,
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: (endpoint: string) => apiCall(endpoint, { method: "GET" }),
  post: (endpoint: string, data?: any) =>
    apiCall(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (endpoint: string, data?: any) =>
    apiCall(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: (endpoint: string) => apiCall(endpoint, { method: "DELETE" }),
};

// API específica para el servicio de cursos
export const cursosApi = {
  get: (endpoint: string) => apiCall(endpoint, { method: "GET" }, CURSOS_SERVICE_URL),
  post: (endpoint: string, data?: any) =>
    apiCall(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }, CURSOS_SERVICE_URL),
  put: (endpoint: string, data?: any) =>
    apiCall(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }, CURSOS_SERVICE_URL),
  delete: (endpoint: string) => apiCall(endpoint, { method: "DELETE" }, CURSOS_SERVICE_URL),
};

// API específica para el servicio de certificados
export const certificadosApi = {
  get: (endpoint: string) => apiCall(endpoint, { method: "GET" }, CERTIFICADOS_SERVICE_URL),
  post: (endpoint: string, data?: any) =>
    apiCall(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }, CERTIFICADOS_SERVICE_URL),
  put: (endpoint: string, data?: any) =>
    apiCall(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }, CERTIFICADOS_SERVICE_URL),
  delete: (endpoint: string) => apiCall(endpoint, { method: "DELETE" }, CERTIFICADOS_SERVICE_URL),
};

// Plantillas - Certificados
export async function uploadTemplateImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const session = await getSession();
  const url = `${CERTIFICADOS_SERVICE_URL}/templates/upload-image`;
  const headers: Record<string, string> = {};
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  try {
    const res = await fetch(url, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errorData.detail || res.statusText);
    }
    return res.json();
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(0, `No se puede conectar al servicio de certificados. Verifica que esté corriendo en ${CERTIFICADOS_SERVICE_URL}`);
    }
    throw error;
  }
}

export async function createTemplate(payload: any) {
  return certificadosApi.post('/templates', payload);
}

export async function listTemplates() {
  return certificadosApi.get('/templates');
}

export async function getTemplate(id: string) {
  return certificadosApi.get(`/templates/${id}`);
}

export async function updateTemplate(id: string, payload: any) {
  return certificadosApi.put(`/templates/${id}`, payload);
}

// User management functions
export async function getUsers() {
  return api.get("/usuarios");
}

export async function createUser(userData: any) {
  return api.post("/usuarios", userData);
}

export async function updateUser(userId: string, userData: any) {
  return api.put(`/usuarios/${userId}`, userData);
}

export async function deleteUser(userId: string) {
  return api.delete(`/usuarios/${userId}`);
}

export async function changeUserPassword(userId: string, newPassword: string) {
  return api.put(`/usuarios/${userId}/password`, { new_password: newPassword });
}

// Cursos management functions
export async function getCursos(filters?: {
  skip?: number;
  limit?: number;
  search?: string;
  instructor_id?: string;
  activos?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.instructor_id) params.append('instructor_id', filters.instructor_id);
  if (filters?.activos !== undefined) params.append('activos', filters.activos.toString());
  
  const queryString = params.toString();
  return cursosApi.get(`/cursos${queryString ? `?${queryString}` : ''}`);
}

export async function getCurso(cursoId: string) {
  return cursosApi.get(`/cursos/${cursoId}`);
}

export async function createCurso(cursoData: any) {
  return cursosApi.post("/cursos", cursoData);
}

export async function updateCurso(cursoId: string, cursoData: any) {
  return cursosApi.put(`/cursos/${cursoId}`, cursoData);
}

export async function deleteCurso(cursoId: string) {
  return cursosApi.delete(`/cursos/${cursoId}`);
}

// Inscripciones management functions
export async function inscribirEstudiante(cursoId: string, estudianteId: string) {
  return cursosApi.post(`/cursos/${cursoId}/inscripciones`, { estudiante_id: estudianteId });
}

export async function getEstudiantesCurso(cursoId: string) {
  return cursosApi.get(`/cursos/${cursoId}/estudiantes`);
}

export async function importarEstudiantesCSV(cursoId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const session = await getSession();
  const url = `${CURSOS_SERVICE_URL}/inscripciones/csv?curso_id=${cursoId}`;
  
  const headers: Record<string, string> = {};
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`
    );
  }
  
  return response.json();
}

// Nueva versión para importar XLSX directamente
export async function importarEstudiantesXLSX(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const session = await getSession();
  const url = `${CURSOS_SERVICE_URL}/inscripciones/xlsx`;
  
  const headers: Record<string, string> = {};
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`
    );
  }
  
  return response.json();
}

// Funciones adicionales para gestión de inscripciones
export async function getInscripciones(filters?: {
  skip?: number;
  limit?: number;
  search?: string;
  curso_id?: string;
  estudiante_id?: string;
  completado?: boolean;
  activos?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.curso_id) params.append('curso_id', filters.curso_id);
  if (filters?.estudiante_id) params.append('estudiante_id', filters.estudiante_id);
  if (filters?.completado !== undefined) params.append('completado', filters.completado.toString());
  if (filters?.activos !== undefined) params.append('activos', filters.activos.toString());
  
  const queryString = params.toString();
  return cursosApi.get(`/inscripciones${queryString ? `?${queryString}` : ''}`);
}

export async function marcarInscripcionCompletada(inscripcionId: string) {
  return cursosApi.put(`/inscripciones/${inscripcionId}/completar`, {});
}

export async function desactivarInscripcion(inscripcionId: string) {
  return cursosApi.delete(`/inscripciones/${inscripcionId}`);
}
