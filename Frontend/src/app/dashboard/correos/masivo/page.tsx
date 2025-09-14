'use client';

import { useState, useEffect } from 'react';
import { useEmail, PlantillaEmail } from '@/hooks/useEmail';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCursos, useEstudiantesCurso } from '@/hooks/useCursos';
import ConfiguracionLotes from '@/components/correos/ConfiguracionLotes';
import ProgresoEnvio from '@/components/correos/ProgresoEnvio';

interface PlantillaCertificado {
  id: string;
  nombre: string;
  descripcion?: string;
}

export default function EnvioMasivoPage() {
  const {
    getPlantillasEmail,
    enviarEmailMasivo,
    loading: emailLoading,
    error: emailError
  } = useEmail();

  const { cursos, loading: cursosLoading } = useCursos();
  const [plantillasEmail, setPlantillasEmail] = useState<PlantillaEmail[]>([]);
  const [plantillasCertificado, setPlantillasCertificado] = useState<PlantillaCertificado[]>([]);
  
  // Estados del formulario
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>('');
  const [plantillaEmailSeleccionada, setPlantillaEmailSeleccionada] = useState<string>('');
  const [plantillaCertificadoSeleccionada, setPlantillaCertificadoSeleccionada] = useState<string>('');
  const [variablesGlobales, setVariablesGlobales] = useState<Record<string, string>>({});
  
  // Configuración de lotes
  const [configuracionLotes, setConfiguracionLotes] = useState({
    lote_size: 10,
    pausa_lotes: 20,
    pausa_individual: 1.0
  });

  // Estados de envío
  const [enviando, setEnviando] = useState(false);
  const [progresoEnvio, setProgresoEnvio] = useState({
    total: 0,
    enviados: 0,
    errores: 0,
    tiempoInicio: 0
  });
  const [resultadoEnvio, setResultadoEnvio] = useState<any>(null);

  // Inscripciones del curso seleccionado
  const { estudiantes, loading: inscripcionesLoading } = useEstudiantesCurso(
    cursoSeleccionado || null
  );

  useEffect(() => {
    loadPlantillas();
    loadPlantillasCertificado();
  }, []);

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
      // Por ahora simulamos datos
      setPlantillasCertificado([
        { id: '1', nombre: 'Plantilla Básica', descripcion: 'Plantilla estándar para certificados' },
        { id: '2', nombre: 'Plantilla Avanzada', descripcion: 'Plantilla con diseño personalizado' }
      ]);
    } catch (err) {
      console.error('Error cargando plantillas de certificado:', err);
    }
  };

  const handleEnviar = async () => {
    if (!cursoSeleccionado || !plantillaEmailSeleccionada) {
      alert('Por favor selecciona un curso y una plantilla de email');
      return;
    }

    if (estudiantes?.estudiantes?.length === 0) {
      alert('No hay estudiantes inscritos en este curso');
      return;
    }

    if (!confirm(`¿Estás seguro de enviar ${estudiantes?.estudiantes?.length || 0} correos?`)) {
      return;
    }

    try {
      setEnviando(true);
      setProgresoEnvio({
        total: estudiantes?.estudiantes?.length || 0,
        enviados: 0,
        errores: 0,
        tiempoInicio: Date.now()
      });

      const destinatariosIds = estudiantes?.estudiantes?.map(estudiante => estudiante.id) || [];
      
      const resultado = await enviarEmailMasivo({
        plantilla_email_id: plantillaEmailSeleccionada,
        plantilla_certificado_id: plantillaCertificadoSeleccionada || undefined,
        curso_id: cursoSeleccionado,
        destinatarios_ids: destinatariosIds,
        variables_globales: variablesGlobales,
        configuracion_lotes: configuracionLotes
      });

      setResultadoEnvio(resultado);
      setProgresoEnvio(prev => ({
        ...prev,
        enviados: resultado.enviados_exitosos,
        errores: resultado.errores
      }));

    } catch (err: any) {
      console.error('Error enviando correos:', err);
      alert(`Error enviando correos: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelarEnvio = () => {
    if (confirm('¿Estás seguro de cancelar el envío?')) {
      setEnviando(false);
      setProgresoEnvio({
        total: 0,
        enviados: 0,
        errores: 0,
        tiempoInicio: 0
      });
    }
  };

  const cursoActual = cursos.find(c => c.id === cursoSeleccionado);

  if (enviando) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ProgresoEnvio
          total={progresoEnvio.total}
          enviados={progresoEnvio.enviados}
          errores={progresoEnvio.errores}
          tiempoInicio={progresoEnvio.tiempoInicio}
          onCancel={handleCancelarEnvio}
        />
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Envío Masivo por Curso
        </h1>
        <p className="mt-2 text-gray-600">
          Envía correos masivos a todos los estudiantes de un curso
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
              {/* Selección de curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Curso *
                </label>
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => setCursoSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={cursosLoading}
                >
                  <option value="">Selecciona un curso</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de plantilla de email */}
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

              {/* Selección de plantilla de certificado */}
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

              {/* Variables globales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variables Globales
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
                            setVariablesGlobales(prev => ({
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
                  {Object.keys(variablesGlobales).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(variablesGlobales).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"
                        >
                          {`{${key}}`}: {value}
                          <button
                            onClick={() => {
                              const newVars = { ...variablesGlobales };
                              delete newVars[key];
                              setVariablesGlobales(newVars);
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

          {/* Configuración de lotes */}
          <ConfiguracionLotes
            configuracion={configuracionLotes}
            onChange={setConfiguracionLotes}
          />
        </div>

        {/* Vista previa de destinatarios */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Vista Previa de Destinatarios
            </h2>

            {!cursoSeleccionado ? (
              <div className="text-center py-8 text-gray-500">
                Selecciona un curso para ver los destinatarios
              </div>
            ) : inscripcionesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : estudiantes?.estudiantes?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay estudiantes inscritos en este curso
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        {cursoActual?.nombre}
                      </h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>{estudiantes?.estudiantes?.length || 0} estudiantes inscritos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {estudiantes?.estudiantes?.map((estudiante) => (
                      <div
                        key={estudiante.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {estudiante.nombre} {estudiante.apellido}
                          </p>
                          <p className="text-xs text-gray-500">
                            {estudiante.email}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {estudiante.cedula}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón de envío */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Enviar Correos
                </h3>
                <p className="text-sm text-gray-500">
                  {estudiantes?.estudiantes?.length || 0} destinatarios seleccionados
                </p>
              </div>
              <button
                onClick={handleEnviar}
                disabled={!cursoSeleccionado || !plantillaEmailSeleccionada || (estudiantes?.estudiantes?.length || 0) === 0 || emailLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {emailLoading ? 'Enviando...' : 'Enviar Correos'}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{resultadoEnvio.total_destinatarios}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{resultadoEnvio.enviados_exitosos}</div>
              <div className="text-sm text-gray-500">Enviados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{resultadoEnvio.errores}</div>
              <div className="text-sm text-gray-500">Errores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{resultadoEnvio.tiempo_total}s</div>
              <div className="text-sm text-gray-500">Tiempo</div>
            </div>
          </div>
        </div>
      )}
    </div>
        </DashboardLayout>
  );
}
