"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createTemplate, getTemplate, updateTemplate, uploadTemplateImage } from "@/lib/api";
import VariableSelector from "@/components/certificados/VariableSelector";
import CertificateTester from "@/components/certificados/CertificateTester";

const CanvasEditor = dynamic(() => import("@/components/certificados/CanvasEditor"), { ssr: false });

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "nueva";

  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1131 });
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string>("Plantilla");
  const [descripcion, setDescripcion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showTester, setShowTester] = useState(false);

  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      getTemplate(params.id as string)
        .then((tpl) => {
          if (tpl.canvas) setCanvasSize(tpl.canvas);
          if (tpl.background_image_url) setBackgroundUrl(tpl.background_image_url);
          if (tpl.fields) {
            // Recrear objetos Image para elementos de imagen
            const elementsWithImages = tpl.fields.map(async (el: any) => {
              if (el.type === 'image' && (el.imageUrl || el.url)) {
                const img = new Image();
                return new Promise((resolve) => {
                  img.onload = () => {
                    resolve({
                      ...el,
                      image: img,
                      imageUrl: el.imageUrl || el.url,
                    });
                  };
                  img.src = el.imageUrl || el.url;
                });
              }
              return el;
            });
            
            Promise.all(elementsWithImages).then(setElements);
          }
          if (tpl.nombre) setNombre(tpl.nombre);
          if (tpl.descripcion) setDescripcion(tpl.descripcion);
        })
        .catch((error) => {
          console.error('Error loading template:', error);
          alert('Error al cargar la plantilla');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isNew, params.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { url } = await uploadTemplateImage(file);
      console.log('Image uploaded successfully, URL:', url);
      setBackgroundUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen: ' + (error as Error).message);
    }
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { url } = await uploadTemplateImage(file);
      const img = new Image();
      img.onload = () => {
        const id = crypto.randomUUID();
        setElements((prev) => [
          ...prev,
          {
            id,
            type: "image",
            x: 100,
            y: 100,
            width: Math.min(img.width, 200),
            height: Math.min(img.height, 200),
            image: img,
            imageUrl: url,
          },
        ]);
        setSelectedId(id);
      };
      img.src = url;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen: ' + (error as Error).message);
    }
  };

  const addText = () => {
    const id = crypto.randomUUID();
    setElements((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: "Nuevo Texto",
        x: 100,
        y: 100,
        fontSize: 36,
        fontFamily: "Inter",
        fill: "#222222",
        align: "left",
        fontStyle: "normal",
        width: canvasSize.width - 200,
      },
    ]);
    setSelectedId(id);
  };

  const updateSelected = (changes: Record<string, any>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, ...changes } : el)));
  };

  const insertVariable = (variable: string) => {
    if (!selectedId) return;
    
    const selectedElement = elements.find((e) => e.id === selectedId);
    if (selectedElement?.type === 'text') {
      const currentText = selectedElement.text || '';
      const newText = currentText + variable;
      updateSelected({ text: newText });
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);
      
      // Preparar elementos para guardar (sin objetos Image)
      const elementsToSave = elements.map(el => {
        if (el.type === 'image') {
          return {
            ...el,
            image: undefined, // No guardar el objeto Image
            imageUrl: el.imageUrl || el.url, // Guardar solo la URL
          };
        }
        return el;
      });

      const payload = {
        nombre,
        descripcion,
        background_image_url: backgroundUrl,
        canvas: canvasSize,
        fields: elementsToSave,
      };
      
      if (isNew) {
        const created = await createTemplate(payload);
        alert('Plantilla creada exitosamente');
        router.replace(`/dashboard/certificados/editor/${created.id}`);
      } else {
        await updateTemplate(params.id as string, payload);
        alert('Plantilla guardada exitosamente');
        // Recargar la página para asegurar que los cambios se reflejen
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la plantilla: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectedElement = useMemo(() => elements.find((e) => e.id === selectedId), [elements, selectedId]);

  // Extraer variables utilizadas en la plantilla
  const usedVariables = useMemo(() => {
    const variables = new Set<string>();
    elements.forEach(el => {
      if (el.type === 'text' && el.text) {
        const matches = el.text.match(/\{([A-Z_]+)\}/g);
        if (matches) {
          matches.forEach(match => {
            variables.add(match.slice(1, -1)); // Remover { y }
          });
        }
      }
    });
    return Array.from(variables);
  }, [elements]);

  if (loading && isNew === false) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <Text size="3" className="text-gray-600">Cargando plantilla...</Text>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Heading size="6">Editor de Plantilla</Heading>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                className="px-3 py-2 border rounded w-full sm:w-64"
                placeholder="Nombre de la plantilla"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <input
                type="text"
                className="px-3 py-2 border rounded w-full sm:w-80"
                placeholder="Descripción (opcional)"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-white hover:bg-gray-50 text-sm">
              <span className="text-gray-700">Fondo (PNG)</span>
              <input type="file" accept="image/png" onChange={handleUpload} className="hidden" />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-white hover:bg-gray-50 text-sm">
              <span className="text-gray-700">Añadir Imagen</span>
              <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
            </label>
            <Button onClick={addText} className="cursor-pointer">Añadir Texto</Button>
            <VariableSelector 
              onInsertVariable={(variable) => {
                // Si hay un elemento de texto seleccionado, insertar la variable
                if (selectedId && elements.find((e) => e.id === selectedId)?.type === 'text') {
                  insertVariable(variable);
                } else {
                  // Si no hay elemento seleccionado, crear un nuevo texto con la variable
                  const id = crypto.randomUUID();
                  setElements((prev) => [
                    ...prev,
                    {
                      id,
                      type: "text",
                      text: variable,
                      x: 100,
                      y: 100,
                      fontSize: 36,
                      fontFamily: "Inter",
                      fill: "#222222",
                      align: "left",
                      fontStyle: "normal",
                      width: canvasSize.width - 200,
                    },
                  ]);
                  setSelectedId(id);
                }
              }} 
            />
            {!isNew && (
              <Button 
                variant="outline"
                onClick={() => setShowTester(true)}
                className="cursor-pointer"
              >
                🧪 Probar Certificado
              </Button>
            )}
            <Button 
              onClick={saveTemplate} 
              className="cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Barra de herramientas */}
        {selectedId && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              {elements.find((e) => e.id === selectedId)?.type === 'text' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Texto</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="px-2 py-1 border rounded w-48"
                        value={elements.find((e) => e.id === selectedId)?.text || ''}
                        onChange={(e) => updateSelected({ text: e.target.value })}
                        placeholder="Escribe el texto aquí..."
                      />
                      <VariableSelector onInsertVariable={insertVariable} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Tamaño</label>
                    <input
                      type="number"
                      className="px-2 py-1 border rounded w-20"
                      min={8}
                      max={200}
                      value={elements.find((e) => e.id === selectedId)?.fontSize || 36}
                      onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Fuente</label>
                    <select
                      className="px-2 py-1 border rounded"
                      value={elements.find((e) => e.id === selectedId)?.fontFamily || 'Inter'}
                      onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Montserrat">Montserrat</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Color</label>
                    <input
                      type="color"
                      className="w-10 h-8 p-0 border rounded"
                      value={elements.find((e) => e.id === selectedId)?.fill || '#222222'}
                      onChange={(e) => updateSelected({ fill: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Alineación</label>
                    <select
                      className="px-2 py-1 border rounded"
                      value={elements.find((e) => e.id === selectedId)?.align || 'left'}
                      onChange={(e) => updateSelected({ align: e.target.value })}
                    >
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      const current = elements.find((e) => e.id === selectedId);
                      const next = current?.fontStyle === 'bold' ? 'normal' : 'bold';
                      updateSelected({ fontStyle: next });
                    }}
                  >
                    Negrita
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Ancho</label>
                    <input
                      type="number"
                      className="px-2 py-1 border rounded w-20"
                      min={10}
                      max={500}
                      value={elements.find((e) => e.id === selectedId)?.width || 200}
                      onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Alto</label>
                    <input
                      type="number"
                      className="px-2 py-1 border rounded w-20"
                      min={10}
                      max={500}
                      value={elements.find((e) => e.id === selectedId)?.height || 200}
                      onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
              
              <Button
                variant="outline"
                color="red"
                className="cursor-pointer"
                onClick={deleteSelected}
              >
                Eliminar
              </Button>
            </div>
          </Card>
        )}

        {/* Variables utilizadas */}
        {usedVariables.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-sm text-gray-800">Variables en la plantilla</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {usedVariables.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {usedVariables.map((variable) => (
                <span
                  key={variable}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 font-mono"
                >
                  {`{${variable}}`}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 Estas variables se reemplazarán automáticamente con los datos del estudiante al generar el certificado
            </p>
          </Card>
        )}

        {/* Canvas Editor */}
        <Card className="p-4">
          <CanvasEditor
            canvasSize={canvasSize}
            backgroundUrl={backgroundUrl}
            elements={elements}
            setElements={setElements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        </Card>

        {/* Modal de prueba de certificado */}
        {showTester && (
          <CertificateTester
            templateId={params.id as string}
            onClose={() => setShowTester(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}