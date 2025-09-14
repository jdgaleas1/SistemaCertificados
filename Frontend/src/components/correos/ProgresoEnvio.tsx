'use client';

import { useState, useEffect } from 'react';

interface ProgresoEnvioProps {
  total: number;
  enviados: number;
  errores: number;
  tiempoInicio?: number;
  onCancel?: () => void;
}

export default function ProgresoEnvio({ 
  total, 
  enviados, 
  errores, 
  tiempoInicio, 
  onCancel 
}: ProgresoEnvioProps) {
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  useEffect(() => {
    if (!tiempoInicio) return;

    const interval = setInterval(() => {
      setTiempoTranscurrido(Math.floor((Date.now() - tiempoInicio) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [tiempoInicio]);

  const progreso = total > 0 ? (enviados + errores) / total : 0;
  const porcentaje = Math.round(progreso * 100);
  const pendientes = total - enviados - errores;

  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimarTiempoRestante = () => {
    if (enviados + errores === 0) return 'Calculando...';
    
    const tiempoPorCorreo = tiempoTranscurrido / (enviados + errores);
    const tiempoRestante = tiempoPorCorreo * pendientes;
    
    if (tiempoRestante > 60) {
      return `~${Math.ceil(tiempoRestante / 60)} min`;
    } else {
      return `~${Math.ceil(tiempoRestante)}s`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Enviando Correos
          </h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso</span>
            <span>{porcentaje}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${porcentaje}%` }}
            ></div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{enviados}</div>
            <div className="text-sm text-gray-500">Enviados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errores}</div>
            <div className="text-sm text-gray-500">Errores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendientes}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
        </div>

        {/* Tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Tiempo transcurrido</div>
            <div className="text-lg font-medium text-gray-900">
              {formatearTiempo(tiempoTranscurrido)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Tiempo estimado restante</div>
            <div className="text-lg font-medium text-gray-900">
              {estimarTiempoRestante()}
            </div>
          </div>
        </div>

        {/* Estado actual */}
        {pendientes > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Procesando correos... {pendientes} pendientes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completado */}
        {pendientes === 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  ¡Envío completado! {enviados} correos enviados exitosamente
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
