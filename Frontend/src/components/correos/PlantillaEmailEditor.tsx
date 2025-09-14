'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PlantillaEmail } from '@/hooks/useEmail';

interface PlantillaEmailEditorProps {
  plantilla?: PlantillaEmail;
  onSave: (data: Partial<PlantillaEmail>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function PlantillaEmailEditor({ 
  plantilla, 
  onSave, 
  onCancel, 
  loading = false 
}: PlantillaEmailEditorProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    asunto: '',
    contenido_html: '',
    is_active: true
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);

  useEffect(() => {
    if (plantilla) {
      setFormData({
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        asunto: plantilla.asunto,
        contenido_html: plantilla.contenido_html,
        is_active: plantilla.is_active
      });
      setVariables(plantilla.variables_disponibles || []);
    }
  }, [plantilla]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleHtmlChange = (value: string) => {
    setFormData(prev => ({ ...prev, contenido_html: value }));
    
    // Extraer variables del HTML
    const patron = /\{([A-Z_]+)\}/g;
    const nuevasVariables: string[] = [];
    let match;
    
    while ((match = patron.exec(value)) !== null) {
      nuevasVariables.push(match[1]);
    }
    
    setVariables([...new Set(nuevasVariables)]);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('contenido_html') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{${variable}}` + after;
      
      handleHtmlChange(newText);
      
      // Restaurar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const variablesComunes = [
    'NOMBRE', 'APELLIDO', 'NOMBRE_COMPLETO', 'EMAIL', 'CEDULA',
    'CURSO', 'FECHA', 'DURACION', 'INSTRUCTOR'
  ];

  return (
    <DashboardLayout>
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {plantilla ? 'Editar Plantilla de Email' : 'Nueva Plantilla de Email'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contenido HTML *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    {previewMode ? 'Editar' : 'Vista Previa'}
                  </button>
                </div>
                
                {previewMode ? (
                  <div 
                    className="w-full h-96 border border-gray-300 rounded-md p-4 overflow-auto bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: formData.contenido_html }}
                  />
                ) : (
                  <textarea
                    id="contenido_html"
                    name="contenido_html"
                    value={formData.contenido_html}
                    onChange={(e) => handleHtmlChange(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    required
                  />
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Plantilla activa
                </label>
              </div>
            </div>

            {/* Variables */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Variables Disponibles
                </h3>
                
                {variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Variables detectadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <span
                          key={variable}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {`{${variable}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">Variables comunes:</p>
                  <div className="space-y-1">
                    {variablesComunes.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="block w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        {`{${variable}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  💡 Consejos
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Usa variables entre llaves: {`{NOMBRE}`}</li>
                  <li>• Haz clic en las variables para insertarlas</li>
                  <li>• Usa la vista previa para ver el resultado</li>
                  <li>• Asegúrate de que el HTML sea válido</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (plantilla ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
    </DashboardLayout>
  );
}
