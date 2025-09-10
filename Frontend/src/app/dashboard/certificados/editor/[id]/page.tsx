"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createTemplate, getTemplate, updateTemplate, uploadTemplateImage } from "@/lib/api";

const CanvasEditor = dynamic(() => import("@/components/certificados/CanvasEditor"), { ssr: false });

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "nueva";

  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1131 });
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageFit, setImageFit] = useState<'contain' | 'cover' | 'stretch'>('contain');

  useEffect(() => {
    if (!isNew) {
      getTemplate(params.id as string).then((tpl) => {
        if (tpl.canvas) setCanvasSize(tpl.canvas);
        if (tpl.background_image_url) setBackgroundUrl(tpl.background_image_url);
        if (tpl.fields) setElements(tpl.fields);
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
      },
    ]);
    setSelectedId(id);
  };

  const saveTemplate = async () => {
    const payload = {
      nombre: "Plantilla",
      descripcion: "",
      background_image_url: backgroundUrl,
      canvas: canvasSize,
      fields: elements,
    };
    if (isNew) {
      const created = await createTemplate(payload);
      router.replace(`/dashboard/certificados/editor/${created.id}`);
    } else {
      await updateTemplate(params.id as string, payload);
    }
  };

  const selectedElement = useMemo(() => elements.find((e) => e.id === selectedId), [elements, selectedId]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <Flex justify="between" align="center">
          <Heading size="6">Editor de Plantilla</Heading>
          <div className="flex gap-2 items-center">
            <input type="file" accept="image/png" onChange={handleUpload} />
            {backgroundUrl && (
              <select 
                value={imageFit} 
                onChange={(e) => setImageFit(e.target.value as any)}
                className="px-2 py-1 border rounded"
              >
                <option value="contain">Ajustar (Contain)</option>
                <option value="cover">Cubrir (Cover)</option>
                <option value="stretch">Estirar (Stretch)</option>
              </select>
            )}
            <Button onClick={addText} className="cursor-pointer">Añadir Texto</Button>
            <Button onClick={saveTemplate} className="cursor-pointer">Guardar</Button>
          </div>
        </Flex>

        <Card className="p-4 overflow-auto">
          <div className="mx-auto" style={{ width: canvasSize.width }}>
            <CanvasEditor
              canvasSize={canvasSize}
              backgroundUrl={backgroundUrl}
              elements={elements}
              setElements={setElements}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              imageFit={imageFit}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}


