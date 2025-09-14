'use client';

import { useState, useEffect } from 'react';
import { useEmail, PlantillaEmail } from '@/hooks/useEmail';
import DashboardLayout from "@/components/layout/DashboardLayout";
import PlantillaEmailEditor from '@/components/correos/PlantillaEmailEditor';
import PlantillasEmailList from '@/components/correos/PlantillasEmailList';

export default function PlantillasEmailPage() {
  const {
    getPlantillasEmail,
    createPlantillaEmail,
    updatePlantillaEmail,
    deletePlantillaEmail,
    loading,
    error
  } = useEmail();

  const [plantillas, setPlantillas] = useState<PlantillaEmail[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaEmail | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadPlantillas();
  }, []);

  const loadPlantillas = async () => {
    try {
      setLoadingData(true);
      const data = await getPlantillasEmail();
      setPlantillas(data);
    } catch (err) {
      console.error('Error cargando plantillas:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreate = () => {
    setEditingPlantilla(null);
    setShowEditor(true);
  };

  const handleEdit = (plantilla: PlantillaEmail) => {
    setEditingPlantilla(plantilla);
    setShowEditor(true);
  };

  const handleSave = async (data: Partial<PlantillaEmail>) => {
    try {
      if (editingPlantilla) {
        await updatePlantillaEmail(editingPlantilla.id, data);
      } else {
        await createPlantillaEmail(data as Omit<PlantillaEmail, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'variables_disponibles'>);
      }
      
      setShowEditor(false);
      setEditingPlantilla(null);
      await loadPlantillas();
    } catch (err) {
      console.error('Error guardando plantilla:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      try {
        await deletePlantillaEmail(id);
        await loadPlantillas();
      } catch (err) {
        console.error('Error eliminando plantilla:', err);
      }
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updatePlantillaEmail(id, { is_active: isActive });
      await loadPlantillas();
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingPlantilla(null);
  };

  if (showEditor) {
    return (
      <PlantillaEmailEditor
        plantilla={editingPlantilla || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    );
  }

  return (
        <DashboardLayout>
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Plantillas de Email
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona las plantillas HTML para el envío de correos masivos
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Nueva Plantilla
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <PlantillasEmailList
        plantillas={plantillas}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        loading={loadingData}
      />
    </div>
     </DashboardLayout>
  );
}
