'use client';

import { useState } from 'react';

interface ConfiguracionLotesProps {
  configuracion: {
    lote_size: number;
    pausa_lotes: number;
    pausa_individual: number;
  };
  onChange: (configuracion: {
    lote_size: number;
    pausa_lotes: number;
    pausa_individual: number;
  }) => void;
}

export default function ConfiguracionLotes({ configuracion, onChange }: ConfiguracionLotesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (field: keyof typeof configuracion, value: number) => {
    onChange({
      ...configuracion,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div>
          <h3 className="text-sm font-medium text-gray-900">Configuración de Lotes</h3>
          <p className="text-sm text-gray-500">
            {configuracion.lote_size} correos por lote, {configuracion.pausa_lotes}s entre lotes
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          <div className="border-t pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correos por lote
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={configuracion.lote_size}
                    onChange={(e) => handleChange('lote_size', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-8">
                    {configuracion.lote_size}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 10-20 correos por lote para evitar límites del servidor
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pausa entre lotes (segundos)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={configuracion.pausa_lotes}
                    onChange={(e) => handleChange('pausa_lotes', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {configuracion.pausa_lotes}s
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tiempo de espera entre cada lote para evitar saturar el servidor
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pausa entre correos individuales (segundos)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={configuracion.pausa_individual}
                    onChange={(e) => handleChange('pausa_individual', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {configuracion.pausa_individual}s
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Pausa pequeña entre cada correo individual dentro del lote
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Tiempo estimado
                  </h4>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>
                      Para 100 correos: ~{Math.ceil(100 / configuracion.lote_size) * configuracion.pausa_lotes + 100 * configuracion.pausa_individual} segundos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
