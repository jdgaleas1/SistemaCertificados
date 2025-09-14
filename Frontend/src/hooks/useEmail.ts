import { useState, useCallback } from 'react';
import { 
  getPlantillasEmail, 
  getPlantillaEmail, 
  createPlantillaEmail, 
  updatePlantillaEmail, 
  deletePlantillaEmail,
  enviarEmailIndividual,
  enviarEmailMasivo,
  getEstadisticasEmail,
  getLogsEmail
} from '@/lib/api';

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

  const getPlantillasEmailList = useCallback(async (): Promise<PlantillaEmail[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlantillasEmail();
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error obteniendo plantillas de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlantillaEmailById = useCallback(async (id: string): Promise<PlantillaEmail> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlantillaEmail(id);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error obteniendo plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlantillaEmailData = useCallback(async (data: Omit<PlantillaEmail, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'variables_disponibles'>): Promise<PlantillaEmail> => {
    try {
      setLoading(true);
      setError(null);
      const result = await createPlantillaEmail(data);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error creando plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlantillaEmailData = useCallback(async (id: string, data: Partial<PlantillaEmail>): Promise<PlantillaEmail> => {
    try {
      setLoading(true);
      setError(null);
      const result = await updatePlantillaEmail(id, data);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error actualizando plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlantillaEmailData = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deletePlantillaEmail(id);
    } catch (err: any) {
      const errorMessage = err.message || 'Error eliminando plantilla de email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== ENVÍO DE CORREOS ====================

  const enviarEmailIndividualData = useCallback(async (data: EnvioIndividualRequest): Promise<LogEmail> => {
    try {
      setLoading(true);
      setError(null);
      const result = await enviarEmailIndividual(data);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error enviando email individual';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const enviarEmailMasivoData = useCallback(async (data: EnvioMasivoRequest): Promise<EnvioMasivoResponse> => {
    try {
      setLoading(true);
      setError(null);
      const result = await enviarEmailMasivo(data);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error enviando emails masivos';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== ESTADÍSTICAS Y LOGS ====================

  const getEstadisticasEmailData = useCallback(async (): Promise<EstadisticasEmail> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEstadisticasEmail();
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Error obteniendo estadísticas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLogsEmailData = useCallback(async (params?: {
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
      const errorMessage = err.message || 'Error obteniendo logs de email';
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
    getPlantillasEmail: getPlantillasEmailList,
    getPlantillaEmail: getPlantillaEmailById,
    createPlantillaEmail: createPlantillaEmailData,
    updatePlantillaEmail: updatePlantillaEmailData,
    deletePlantillaEmail: deletePlantillaEmailData,
    
    // Envío de correos
    enviarEmailIndividual: enviarEmailIndividualData,
    enviarEmailMasivo: enviarEmailMasivoData,
    
    // Estadísticas y logs
    getEstadisticasEmail: getEstadisticasEmailData,
    getLogsEmail: getLogsEmailData,
    
    // Utilidades
    procesarVariables,
    extraerVariables,
  };
};
