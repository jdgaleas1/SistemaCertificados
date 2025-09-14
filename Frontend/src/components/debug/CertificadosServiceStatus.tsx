'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPlantillasEmail, createPlantillaEmail } from '@/lib/api';

export default function CertificadosServiceStatus() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const checkService = async () => {
    if (!session) return;
    
    setStatus('checking');
    setMessage('Verificando servicio de certificados...');

    try {
      // Test 1: Health check
      const healthResponse = await fetch('http://localhost:8003/health');
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }
      setMessage('Health check OK, verificando plantillas...');

      // Test 2: Get plantillas
      const plantillas = await getPlantillasEmail();
      setMessage(`Plantillas obtenidas: ${plantillas.length} encontradas`);

      // Test 3: Create test plantilla
      const testPlantilla = {
        nombre: 'Test Plantilla',
        descripcion: 'Plantilla de prueba',
        asunto: 'Test Subject',
        contenido_html: '<html><body><h1>Test Plantilla</h1><p>Este es un contenido de prueba para verificar que el servicio funciona correctamente.</p><p>Variables disponibles: {NOMBRE}, {APELLIDO}, {EMAIL}</p></body></html>',
        is_active: true
      };

      const created = await createPlantillaEmail(testPlantilla);
      setMessage(`Plantilla de prueba creada: ${created.id}`);

      setStatus('success');
      setMessage('✅ Servicio de certificados funcionando correctamente');

    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
      console.error('Error checking certificados service:', error);
    }
  };

  if (!session) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Estado del Servicio de Certificados</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={checkService}
            disabled={status === 'checking'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'checking' ? 'Verificando...' : 'Verificar Servicio'}
          </button>
          
          <div className="flex items-center space-x-2">
            {status === 'success' && <span className="text-green-600">✅</span>}
            {status === 'error' && <span className="text-red-600">❌</span>}
            {status === 'checking' && <span className="text-blue-600">🔄</span>}
            <span className="text-sm text-gray-600">
              {status === 'idle' && 'No verificado'}
              {status === 'checking' && 'Verificando...'}
              {status === 'success' && 'Funcionando'}
              {status === 'error' && 'Error'}
            </span>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded text-sm ${
            status === 'success' ? 'bg-green-50 text-green-700' :
            status === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>URL del servicio:</strong> http://localhost:8003</p>
          <p><strong>Endpoints probados:</strong> /health, /plantillas-email</p>
        </div>
      </div>
    </div>
  );
}
