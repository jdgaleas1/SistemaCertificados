import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface PlantillaEmail {
  id: string;
  nombre: string;
  descripcion?: string;
  asunto: string;
  contenido_html: string;
  variables_disponibles?: string[];
  is_active: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EnvioIndividualRequest {
  destinatario_email: string;
  destinatario_nombre?: string;
  asunto: string;
  contenido_html: string;
  plantilla_certificado_id?: string;
  variables?: Record<string, string>;
}

export interface EnvioMasivoRequest {
  plantilla_email_id: string;
  plantilla_certificado_id?: string;
  curso_id?: string;
  destinatarios_ids?: string[];
  variables_globales?: Record<string, string>;
  configuracion_lotes?: {
    lote_size?: number;
    pausa_lotes?: number;
    pausa_individual?: number;
  };
}

export interface EnvioMasivoResponse {
  total_destinatarios: number;
  enviados_exitosos: number;
  errores: number;
  log_ids: string[];
  errores_detalle: string[];
  tiempo_total?: number;
}

export interface EstadisticasEmail {
  total_enviados: number;
  total_entregados: number;
  total_errores: number;
  total_pendientes: number;
  emails_hoy: number;
  tasa_exito: number;
}

export interface LogEmail {
  id: string;
  destinatario_email: string;
  destinatario_nombre?: string;
  asunto: string;
  plantilla_email_id?: string;
  plantilla_certificado_id?: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'ERROR' | 'ENTREGADO';
  mensaje_error?: string;
  fecha_envio: string;
  fecha_entrega?: string;
  metadatos?: Record<string, any>;
}

export const useEmail = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== PLANTILLAS DE EMAIL ====================

  const getPlantillasEmail = useCallback(async (): Promise<PlantillaEmail[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/plantillas-email');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error obteniendo plantillas de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlantillaEmail = useCallback(async (id: string): Promise<PlantillaEmail> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/plantillas-email/${id}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error obteniendo plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlantillaEmail = useCallback(async (data: Omit<PlantillaEmail, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'variables_disponibles'>): Promise<PlantillaEmail> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/plantillas-email', data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error creando plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlantillaEmail = useCallback(async (id: string, data: Partial<PlantillaEmail>): Promise<PlantillaEmail> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/plantillas-email/${id}`, data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error actualizando plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlantillaEmail = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/plantillas-email/${id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error eliminando plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== ENVÍO DE CORREOS ====================

  const enviarEmailIndividual = useCallback(async (data: EnvioIndividualRequest): Promise<LogEmail> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/enviar-individual', data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error enviando email individual';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const enviarEmailMasivo = useCallback(async (data: EnvioMasivoRequest): Promise<EnvioMasivoResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/enviar-masivo', data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error enviando emails masivos';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== ESTADÍSTICAS Y LOGS ====================

  const getEstadisticasEmail = useCallback(async (): Promise<EstadisticasEmail> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/estadisticas-email');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error obteniendo estadísticas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLogsEmail = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    estado?: string;
  }): Promise<LogEmail[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLogsEmail(params);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error obteniendo logs de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== UTILIDADES ====================

  const procesarVariables = useCallback((contenido: string, variables: Record<string, string>): string => {
    let contenidoProcesado = contenido;
    
    Object.entries(variables).forEach(([variable, valor]) => {
      const patron = new RegExp(`\\{${variable.toUpperCase()}\\}`, 'g');
      contenidoProcesado = contenidoProcesado.replace(patron, valor);
    });
    
    return contenidoProcesado;
  }, []);

  const extraerVariables = useCallback((contenido: string): string[] => {
    const patron = /\{([A-Z_]+)\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = patron.exec(contenido)) !== null) {
      variables.push(match[1]);
    }
    
    return [...new Set(variables)]; // Eliminar duplicados
  }, []);

  return {
    // Estados
    loading,
    error,
    
    // Plantillas de email
    getPlantillasEmail,
    getPlantillaEmail,
    createPlantillaEmail,
    updatePlantillaEmail,
    deletePlantillaEmail,
    
    // Envío de correos
    enviarEmailIndividual,
    enviarEmailMasivo,
    
    // Estadísticas y logs
    getEstadisticasEmail,
    getLogsEmail,
    
    // Utilidades
    procesarVariables,
    extraerVariables,
  };
};
