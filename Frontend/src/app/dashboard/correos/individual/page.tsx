'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEmail, PlantillaEmail } from '@/hooks/useEmail';
import { useInscripciones } from '@/hooks/useInscripciones';

interface PlantillaCertificado {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
}

export default function EnvioIndividualPage() {
  const {
    getPlantillasEmail,
    enviarEmailIndividual,
    procesarVariables,
    loading: emailLoading,
    error: emailError
  } = useEmail();

  const { inscripciones, loading: inscripcionesLoading } = useInscripciones();
  
  const [plantillasEmail, setPlantillasEmail] = useState<PlantillaEmail[]>([]);
  const [plantillasCertificado, setPlantillasCertificado] = useState<PlantillaCertificado[]>([]);
  
  // Estados del formulario
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<string>('');
  const [plantillaEmailSeleccionada, setPlantillaEmailSeleccionada] = useState<string>('');
  const [plantillaCertificadoSeleccionada, setPlantillaCertificadoSeleccionada] = useState<string>('');
  const [asuntoPersonalizado, setAsuntoPersonalizado] = useState<string>('');
  const [contenidoPersonalizado, setContenidoPersonalizado] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [usarPlantilla, setUsarPlantilla] = useState(true);

  // Estados de envío
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<any>(null);

  // Obtener estudiantes únicos de las inscripciones
  const estudiantes: Estudiante[] = inscripciones.reduce((acc, inscripcion) => {
    const estudiante = inscripcion.estudiante;
    if (!acc.find(e => e.id === estudiante.id)) {
      acc.push({
        id: estudiante.id,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        email: estudiante.email,
        cedula: estudiante.cedula
      });
    }
    return acc;
  }, [] as Estudiante[]);

  const estudianteActual = estudiantes.find(e => e.id === estudianteSeleccionado);

  useEffect(() => {
    loadPlantillas();
    loadPlantillasCertificado();
  }, []);

  useEffect(() => {
    if (estudianteActual) {
      // Llenar variables automáticamente con datos del estudiante
      setVariables({
        NOMBRE: estudianteActual.nombre,
        APELLIDO: estudianteActual.apellido,
        NOMBRE_COMPLETO: `${estudianteActual.nombre} ${estudianteActual.apellido}`,
        EMAIL: estudianteActual.email,
        CEDULA: estudianteActual.cedula
      });
    }
  }, [estudianteActual]);

  const loadPlantillas = async () => {
    try {
      const data = await getPlantillasEmail();
      setPlantillasEmail(data);
    } catch (err) {
      console.error('Error cargando plantillas de email:', err);
    }
  };

  const loadPlantillasCertificado = async () => {
    try {
      // Aquí harías la llamada a la API para obtener las plantillas de certificados
      setPlantillasCertificado([
        { id: '1', nombre: 'Plantilla Básica', descripcion: 'Plantilla estándar para certificados' },
        { id: '2', nombre: 'Plantilla Avanzada', descripcion: 'Plantilla con diseño personalizado' }
      ]);
    } catch (err) {
      console.error('Error cargando plantillas de certificado:', err);
    }
  };

  const plantillaEmailActual = plantillasEmail.find(p => p.id === plantillaEmailSeleccionada);

  const handleEnviar = async () => {
    if (!estudianteSeleccionado) {
      alert('Por favor selecciona un estudiante');
      return;
    }

    if (usarPlantilla && !plantillaEmailSeleccionada) {
      alert('Por favor selecciona una plantilla de email');
      return;
    }

    if (!usarPlantilla && (!asuntoPersonalizado || !contenidoPersonalizado)) {
      alert('Por favor completa el asunto y contenido personalizado');
      return;
    }

    if (!confirm('¿Estás seguro de enviar este correo?')) {
      return;
    }

    try {
      setEnviando(true);

      let asunto = asuntoPersonalizado;
      let contenido = contenidoPersonalizado;

      if (usarPlantilla && plantillaEmailActual) {
        asunto = procesarVariables(plantillaEmailActual.asunto, variables);
        contenido = procesarVariables(plantillaEmailActual.contenido_html, variables);
      } else {
        asunto = procesarVariables(asunto, variables);
        contenido = procesarVariables(contenido, variables);
      }

      const resultado = await enviarEmailIndividual({
        destinatario_email: estudianteActual!.email,
        destinatario_nombre: `${estudianteActual!.nombre} ${estudianteActual!.apellido}`,
        asunto,
        contenido_html: contenido,
        plantilla_certificado_id: plantillaCertificadoSeleccionada || undefined,
        variables
      });

      setResultadoEnvio(resultado);

    } catch (err: any) {
      console.error('Error enviando correo:', err);
      alert(`Error enviando correo: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleLimpiar = () => {
    setEstudianteSeleccionado('');
    setPlantillaEmailSeleccionada('');
    setPlantillaCertificadoSeleccionada('');
    setAsuntoPersonalizado('');
    setContenidoPersonalizado('');
    setVariables({});
    setResultadoEnvio(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Envío Individual
        </h1>
        <p className="mt-2 text-gray-600">
          Envía un correo personalizado a un estudiante específico
        </p>
      </div>

      {emailError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{emailError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de configuración */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Configuración del Envío
            </h2>

            <div className="space-y-4">
              {/* Selección de estudiante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estudiante *
                </label>
                <select
                  value={estudianteSeleccionado}
                  onChange={(e) => setEstudianteSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={inscripcionesLoading}
                >
                  <option value="">Selecciona un estudiante</option>
                  {estudiantes.map((estudiante) => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.nombre} {estudiante.apellido} - {estudiante.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contenido
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipo_contenido"
                      checked={usarPlantilla}
                      onChange={() => setUsarPlantilla(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usar plantilla</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipo_contenido"
                      checked={!usarPlantilla}
                      onChange={() => setUsarPlantilla(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Contenido personalizado</span>
                  </label>
                </div>
              </div>

              {/* Plantilla de email */}
              {usarPlantilla && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plantilla de Email *
                  </label>
                  <select
                    value={plantillaEmailSeleccionada}
                    onChange={(e) => setPlantillaEmailSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una plantilla</option>
                    {plantillasEmail.map((plantilla) => (
                      <option key={plantilla.id} value={plantilla.id}>
                        {plantilla.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contenido personalizado */}
              {!usarPlantilla && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asunto *
                    </label>
                    <input
                      type="text"
                      value={asuntoPersonalizado}
                      onChange={(e) => setAsuntoPersonalizado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Asunto del correo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenido HTML *
                    </label>
                    <textarea
                      value={contenidoPersonalizado}
                      onChange={(e) => setContenidoPersonalizado(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Contenido HTML del correo"
                    />
                  </div>
                </>
              )}

              {/* Plantilla de certificado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantilla de Certificado
                </label>
                <select
                  value={plantillaCertificadoSeleccionada}
                  onChange={(e) => setPlantillaCertificadoSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin certificado adjunto</option>
                  {plantillasCertificado.map((plantilla) => (
                    <option key={plantilla.id} value={plantilla.id}>
                      {plantilla.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variables Personalizadas
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Variable (ej: CURSO)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const valueInput = input.nextElementSibling as HTMLInputElement;
                          if (input.value && valueInput.value) {
                            setVariables(prev => ({
                              ...prev,
                              [input.value.toUpperCase()]: valueInput.value
                            }));
                            input.value = '';
                            valueInput.value = '';
                          }
                        }
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Valor"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {Object.keys(variables).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(variables).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"
                        >
                          {`{${key}}`}: {value}
                          <button
                            onClick={() => {
                              const newVars = { ...variables };
                              delete newVars[key];
                              setVariables(newVars);
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Vista Previa
            </h2>

            {!estudianteSeleccionado ? (
              <div className="text-center py-8 text-gray-500">
                Selecciona un estudiante para ver la vista previa
              </div>
            ) : (
              <div className="space-y-4">
                {/* Información del estudiante */}
                <div className="bg-blue-50 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Destinatario
                  </h3>
                  <p className="text-sm text-blue-700">
                    <strong>Nombre:</strong> {estudianteActual?.nombre} {estudianteActual?.apellido}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Email:</strong> {estudianteActual?.email}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Cédula:</strong> {estudianteActual?.cedula}
                  </p>
                </div>

                {/* Vista previa del correo */}
                {usarPlantilla && plantillaEmailActual ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Vista Previa del Correo
                    </h3>
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="mb-2">
                        <strong>Asunto:</strong> {procesarVariables(plantillaEmailActual.asunto, variables)}
                      </div>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: procesarVariables(plantillaEmailActual.contenido_html, variables) 
                        }}
                      />
                    </div>
                  </div>
                ) : !usarPlantilla && asuntoPersonalizado && contenidoPersonalizado ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Vista Previa del Correo
                    </h3>
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div className="mb-2">
                        <strong>Asunto:</strong> {procesarVariables(asuntoPersonalizado, variables)}
                      </div>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: procesarVariables(contenidoPersonalizado, variables) 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {usarPlantilla ? 'Selecciona una plantilla' : 'Completa el contenido personalizado'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex space-x-3">
              <button
                onClick={handleEnviar}
                disabled={!estudianteSeleccionado || enviando || emailLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enviando ? 'Enviando...' : 'Enviar Correo'}
              </button>
              <button
                onClick={handleLimpiar}
                disabled={enviando || emailLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultado del envío */}
      {resultadoEnvio && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Resultado del Envío
          </h3>
          <div className={`p-4 rounded-md ${
            resultadoEnvio.estado === 'ENVIADO' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {resultadoEnvio.estado === 'ENVIADO' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h4 className={`text-sm font-medium ${
                  resultadoEnvio.estado === 'ENVIADO' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {resultadoEnvio.estado === 'ENVIADO' ? 'Correo enviado exitosamente' : 'Error al enviar correo'}
                </h4>
                <div className={`mt-1 text-sm ${
                  resultadoEnvio.estado === 'ENVIADO' ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p><strong>Destinatario:</strong> {resultadoEnvio.destinatario_email}</p>
                  <p><strong>Asunto:</strong> {resultadoEnvio.asunto}</p>
                  {resultadoEnvio.mensaje_error && (
                    <p><strong>Error:</strong> {resultadoEnvio.mensaje_error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
        </DashboardLayout>
  );
}
