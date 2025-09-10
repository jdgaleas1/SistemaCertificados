import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getInscripciones,
  inscribirEstudiante,
  marcarInscripcionCompletada,
  desactivarInscripcion,
  importarEstudiantesXLSX
} from '@/lib/api';
import { 
  InscripcionDetallada,
  InscripcionesFilters,
  PaginatedInscripcionesResponse,
  CSVImportResponse
} from '@/types/cursos';

export function useInscripciones(filters?: InscripcionesFilters) {
  const { data: session } = useSession();
  const [inscripciones, setInscripciones] = useState<InscripcionDetallada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 25,
    pages: 0
  });

  const fetchInscripciones = async (newFilters?: InscripcionesFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedInscripcionesResponse = await getInscripciones(newFilters || filters);
      setInscripciones(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        pages: response.pages
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchInscripciones();
    }
  }, [session, filters]);

  const inscribirEstudianteMutation = async (cursoId: string, estudianteId: string) => {
    await inscribirEstudiante(cursoId, estudianteId);
    await fetchInscripciones(); // Refrescar lista
  };

  const marcarCompletadaMutation = async (inscripcionId: string) => {
    await marcarInscripcionCompletada(inscripcionId);
    await fetchInscripciones(); // Refrescar lista
  };

  const desactivarInscripcionMutation = async (inscripcionId: string) => {
    await desactivarInscripcion(inscripcionId);
    await fetchInscripciones(); // Refrescar lista
  };

  const importarCSVMutation = async (_cursoId: string, file: File): Promise<CSVImportResponse> => {
    const result = await importarEstudiantesXLSX(file);
    await fetchInscripciones(); // Refrescar lista
    return result;
  };

  return {
    inscripciones,
    loading,
    error,
    pagination,
    refetch: fetchInscripciones,
    inscribirEstudiante: inscribirEstudianteMutation,
    marcarCompletada: marcarCompletadaMutation,
    desactivarInscripcion: desactivarInscripcionMutation,
    importarCSV: importarCSVMutation
  };
}

// Hook específico para inscripciones de un estudiante
export function useInscripcionesEstudiante(estudianteId: string | null) {
  const { data: session } = useSession();
  const [inscripciones, setInscripciones] = useState<InscripcionDetallada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInscripciones = async () => {
    if (!estudianteId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getInscripciones({ estudiante_id: estudianteId, activos: true });
      setInscripciones(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar inscripciones del estudiante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && estudianteId) {
      fetchInscripciones();
    }
  }, [session, estudianteId]);

  return {
    inscripciones,
    loading,
    error,
    refetch: fetchInscripciones
  };
}

// Hook específico para inscripciones de un curso
export function useInscripcionesCurso(cursoId: string | null) {
  const { data: session } = useSession();
  const [inscripciones, setInscripciones] = useState<InscripcionDetallada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInscripciones = async () => {
    if (!cursoId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await getInscripciones({ curso_id: cursoId, activos: true });
      setInscripciones(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar inscripciones del curso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && cursoId) {
      fetchInscripciones();
    }
  }, [session, cursoId]);

  return {
    inscripciones,
    loading,
    error,
    refetch: fetchInscripciones
  };
}