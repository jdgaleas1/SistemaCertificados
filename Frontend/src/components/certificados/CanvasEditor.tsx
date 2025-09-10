"use client";

import { Stage, Layer, Image as KonvaImage, Text as KonvaText } from "react-konva";
import useImage from "@/hooks/useImage";
import { useEffect, useMemo, useRef, useState } from "react";

interface CanvasEditorProps {
  canvasSize: { width: number; height: number };
  backgroundUrl: string | null;
  elements: any[];
  setElements: (updater: any) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  imageFit?: 'contain' | 'cover' | 'stretch';
}

function Background({ url, width, height }: { url: string; width: number; height: number }) {
  const [image, loading, error] = useImage(url);
  
  if (loading) {
    return null; // No mostrar nada mientras carga
  }
  
  if (error) {
    console.error('Error loading background image:', error);
    return null;
  }
  
  return <KonvaImage image={image as any} width={width} height={height} />;
}

export default function CanvasEditor({
  canvasSize,
  backgroundUrl,
  elements,
  setElements,
  selectedId,
  setSelectedId,
  imageFit = 'contain',
}: CanvasEditorProps) {
  const [image, loading, error] = useImage(backgroundUrl || undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(canvasSize.width);

  // Observa el ancho disponible para escalar el Stage y que siempre quepa completo
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (!containerWidth || containerWidth <= 0) return 1;
    // No ampliar por encima del tamaño real para mantener nitidez
    return Math.min(1, containerWidth / canvasSize.width);
  }, [containerWidth, canvasSize.width]);

  // Calcular dimensiones ajustadas para la imagen
  const getImageDimensions = () => {
    if (!image) return { width: canvasSize.width, height: canvasSize.height, x: 0, y: 0 };
    
    switch (imageFit) {
      case 'stretch':
        return { 
          width: canvasSize.width, 
          height: canvasSize.height, 
          x: 0, 
          y: 0 
        };

      case 'contain':
      default:
        const imageAspect = image.width / image.height;
        const canvasAspectRatio = canvasSize.width / canvasSize.height;
        
        let width, height;
        
        if (imageAspect > canvasAspectRatio) {
          // La imagen es más ancha, ajustar por ancho
          width = canvasSize.width;
          height = width / imageAspect;
        } else {
          // La imagen es más alta, ajustar por altura
          height = canvasSize.height;
          width = height * imageAspect;
        }
        
        return { 
          width, 
          height, 
          x: (canvasSize.width - width) / 2, 
          y: (canvasSize.height - height) / 2 
        };
    }
  };

  const imageDimensions = getImageDimensions();

  return (
    <div className="relative" ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-gray-600">Cargando imagen...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <div className="text-red-600">Error al cargar la imagen</div>
        </div>
      )}
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        scale={{ x: scale, y: scale }}
        onMouseDown={() => setSelectedId(null)}
      >
        <Layer>
          {backgroundUrl && image && (
            <KonvaImage 
              image={image as any} 
              width={imageDimensions.width} 
              height={imageDimensions.height}
              x={imageDimensions.x}
              y={imageDimensions.y}
            />
          )}
          {elements.map((el) => {
            if (el.type === 'image') {
              return (
                <KonvaImage
                  key={el.id}
                  draggable
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  image={el.image}
                  onClick={() => setSelectedId(el.id)}
                  onDragEnd={(e) => {
                    const { x, y } = e.target.position();
                    setElements((prev: any[]) => prev.map((p) => (p.id === el.id ? { ...p, x, y } : p)));
                  }}
                />
              );
            }
            return (
              <KonvaText
                key={el.id}
                draggable
                x={el.x}
                y={el.y}
                text={el.text}
                fontSize={el.fontSize}
                fontFamily={el.fontFamily}
                fontStyle={el.fontStyle || 'normal'}
                fill={el.fill}
                align={el.align || 'left'}
                width={el.width || canvasSize.width}
                onClick={() => setSelectedId(el.id)}
                onDblClick={() => {
                  const nuevo = prompt('Editar texto', el.text);
                  if (nuevo !== null) {
                    setElements((prev: any[]) => prev.map((p) => (p.id === el.id ? { ...p, text: nuevo } : p)));
                  }
                }}
                onDragEnd={(e) => {
                  const { x, y } = e.target.position();
                  setElements((prev: any[]) => prev.map((p) => (p.id === el.id ? { ...p, x, y } : p)));
                }}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}


