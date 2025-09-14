'use client';

import { useState } from 'react';
import { PlantillaEmail } from '@/hooks/useEmail';

interface PlantillasEmailListProps {
  plantillas: PlantillaEmail[];
  onEdit: (plantilla: PlantillaEmail) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  loading?: boolean;
}

export default function PlantillasEmailList({
  plantillas,
  onEdit,
  onDelete,
  onToggleActive,
  loading = false
}: PlantillasEmailListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (plantillas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📧</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay plantillas de email
        </h3>
        <p className="text-gray-500">
          Crea tu primera plantilla para comenzar a enviar correos personalizados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plantillas.map((plantilla) => (
        <div
          key={plantilla.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {plantilla.nombre}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      plantilla.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plantilla.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {plantilla.descripcion && (
                  <p className="text-gray-600 mb-3">{plantilla.descripcion}</p>
                )}

                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Asunto:</span>
                    <span className="ml-2 text-sm text-gray-900">{plantilla.asunto}</span>
                  </div>

                  {plantilla.variables_disponibles && plantilla.variables_disponibles.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Variables:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {plantilla.variables_disponibles.map((variable) => (
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

                  <div className="text-sm text-gray-500">
                    Creada: {new Date(plantilla.fecha_creacion).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onToggleActive(plantilla.id, !plantilla.is_active)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    plantilla.is_active
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {plantilla.is_active ? 'Desactivar' : 'Activar'}
                </button>

                <button
                  onClick={() => onEdit(plantilla)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Editar
                </button>

                {deleteConfirm === plantilla.id ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleDelete(plantilla.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={cancelDelete}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDelete(plantilla.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
