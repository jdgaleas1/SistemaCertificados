import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getCursos, 
  getCurso, 
  createCurso, 
  updateCurso, 
  deleteCurso,
  getEstudiantesCurso,
  inscribirEstudiante,
  importarEstudiantesCSV
} from '@/lib/api';
import { 
  Curso, 
  CursoCreate, 
  CursoUpdate, 
  PaginatedCursosResponse,
  CursosFilters,
  EstudiantesCursoResponse,
  CSVImportResponse
} from '@/types/cursos';

export function useCursos(filters?: CursosFilters) {
  const { data: session } = useSession();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 25,
    pages: 0
  });

  const fetchCursos = async (newFilters?: CursosFilters) => {
    try {
      console.log('🔄 Iniciando carga de cursos...');
      setLoading(true);
      setError(null);
      
      const response: PaginatedCursosResponse = await getCursos(newFilters || filters);
      console.log('📊 Respuesta de cursos:', response);
      console.log('📊 Tipo de respuesta:', typeof response);
      console.log('📊 Claves de respuesta:', Object.keys(response));
      console.log('📊 response.data:', response.data);
      console.log('📊 response.data tipo:', typeof response.data);
      console.log('📊 response.data longitud:', response.data?.length);
      
      // Manejar diferentes estructuras de respuesta
      let cursosData = [];
      let paginationData = {
        total: 0,
        page: 1,
        per_page: 25,
        pages: 0
      };

      if (response.data && Array.isArray(response.data)) {
        // Estructura esperada: { data: [...], total: ..., page: ... }
        cursosData = response.data;
        paginationData = {
          total: response.total || 0,
          page: response.page || 1,
          per_page: response.per_page || 25,
          pages: response.pages || 0
        };
      } else if (Array.isArray(response)) {
        // Si la respuesta es directamente un array
        cursosData = response;
        paginationData = {
          total: response.length,
          page: 1,
          per_page: response.length,
          pages: 1
        };
      } else if (response.cursos && Array.isArray(response.cursos)) {
        // Si la respuesta tiene una clave 'cursos'
        cursosData = response.cursos;
        paginationData = {
          total: response.total || response.cursos.length,
          page: response.page || 1,
          per_page: response.per_page || 25,
          pages: response.pages || 1
        };
      } else {
        console.warn('⚠️ Estructura de respuesta no reconocida:', response);
        cursosData = [];
      }

      console.log('📊 Datos procesados:', { cursosData, paginationData });
      
      setCursos(cursosData);
      setPagination(paginationData);
      
      console.log('✅ Cursos cargados exitosamente:', cursosData.length, 'cursos');
    } catch (err: any) {
      console.error('❌ Error al cargar cursos:', err);
      setError(err.message || 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchCursos();
    }
  }, [session, filters]);

  const createCursoMutation = async (cursoData: CursoCreate): Promise<Curso> => {
    const nuevoCurso = await createCurso(cursoData);
    await fetchCursos(); // Refrescar lista
    return nuevoCurso;
  };

  const updateCursoMutation = async (cursoId: string, cursoData: CursoUpdate): Promise<Curso> => {
    const cursoActualizado = await updateCurso(cursoId, cursoData);
    await fetchCursos(); // Refrescar lista
    return cursoActualizado;
  };

  const deleteCursoMutation = async (cursoId: string): Promise<void> => {
    await deleteCurso(cursoId);
    await fetchCursos(); // Refrescar lista
  };

  return {
    cursos,
    loading,
    error,
    pagination,
    refetch: fetchCursos,
    createCurso: createCursoMutation,
    updateCurso: updateCursoMutation,
    deleteCurso: deleteCursoMutation
  };
}

export function useCurso(cursoId: string | null) {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurso = async () => {
    if (!cursoId) return;
    
    try {
      setLoading(true);
      setError(null);
      const cursoData = await getCurso(cursoId);
      setCurso(cursoData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar curso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurso();
  }, [cursoId]);

  return {
    curso,
    loading,
    error,
    refetch: fetchCurso
  };
}

export function useEstudiantesCurso(cursoId: string | null) {
  const [estudiantes, setEstudiantes] = useState<EstudiantesCursoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstudiantes = async () => {
    if (!cursoId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getEstudiantesCurso(cursoId);
      setEstudiantes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const inscribirEstudianteMutation = async (estudianteId: string) => {
    if (!cursoId) throw new Error('No hay curso seleccionado');
    
    await inscribirEstudiante(cursoId, estudianteId);
    await fetchEstudiantes(); // Refrescar lista
  };

  const importarCSVMutation = async (file: File): Promise<CSVImportResponse> => {
    if (!cursoId) throw new Error('No hay curso seleccionado');
    
    const result = await importarEstudiantesCSV(cursoId, file);
    await fetchEstudiantes(); // Refrescar lista
    return result;
  };

  useEffect(() => {
    fetchEstudiantes();
  }, [cursoId]);

  return {
    estudiantes,
    loading,
    error,
    refetch: fetchEstudiantes,
    inscribirEstudiante: inscribirEstudianteMutation,
    importarCSV: importarCSVMutation
  };
}