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
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: canvasSize.width,
    height: canvasSize.height
  });

  // Observa el contenedor para redimensionar automáticamente
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calcular la escala para que quepa completo manteniendo proporción
      const scaleX = containerWidth / canvasSize.width;
      const scaleY = containerHeight / canvasSize.height;
      const scale = Math.min(scaleX, scaleY, 1); // No ampliar más allá del tamaño original
      
      const scaledWidth = canvasSize.width * scale;
      const scaledHeight = canvasSize.height * scale;
      
      setContainerDimensions({
        width: scaledWidth,
        height: scaledHeight
      });
    };

    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    // También escuchar cambios de ventana
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [canvasSize.width, canvasSize.height]);

  // Calcular la escala final
  const scale = useMemo(() => {
    return Math.min(
      containerDimensions.width / canvasSize.width,
      containerDimensions.height / canvasSize.height
    );
  }, [containerDimensions, canvasSize]);

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
    <div 
      ref={containerRef} 
      className="relative w-full overflow-auto"
      style={{ 
        minHeight: '400px',
        maxHeight: '80vh'
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Cargando imagen...</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10 rounded-lg">
          <div className="text-center text-red-600">
            <div className="text-lg mb-2">⚠️</div>
            <div>Error al cargar la imagen</div>
          </div>
        </div>
      )}

      {/* Contenedor del Stage centrado */}
      <div 
        className="mx-auto my-4 relative border-2 border-gray-200 rounded-lg shadow-lg bg-white"
        style={{ 
          width: containerDimensions.width,
          height: containerDimensions.height,
        }}
      >
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => {
            // Solo deseleccionar si se hace clic en el Stage directamente
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {/* Imagen de fondo */}
            {backgroundUrl && image && (
              <KonvaImage 
                image={image as any} 
                width={imageDimensions.width} 
                height={imageDimensions.height}
                x={imageDimensions.x}
                y={imageDimensions.y}
              />
            )}
            
            {/* Elementos de la plantilla */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              
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
                    opacity={isSelected ? 0.8 : 1}
                    stroke={isSelected ? '#007bff' : undefined}
                    strokeWidth={isSelected ? 2 / scale : 0}
                    onClick={() => setSelectedId(el.id)}
                    onTap={() => setSelectedId(el.id)}
                    onDragEnd={(e) => {
                      const { x, y } = e.target.position();
                      setElements((prev: any[]) => prev.map((p) => (
                        p.id === el.id ? { 
                          ...p, 
                          x, 
                          y,
                          // Agregar info del canvas para conversión
                          canvasWidth: canvasSize.width,
                          canvasHeight: canvasSize.height 
                        } : p
                      )));
                    }}
                  />
                );
              }
              
              // Detectar si el texto contiene variables
              const hasVariables = el.text && /\{[A-Z_]+\}/.test(el.text);
              
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
                  fill={hasVariables ? '#2563eb' : el.fill} // Color azul para variables
                  align={el.align || 'left'}
                  width={el.width || canvasSize.width}
                  stroke={isSelected ? '#007bff' : undefined}
                  strokeWidth={isSelected ? 1 / scale : 0}
                  onClick={() => setSelectedId(el.id)}
                  onTap={() => setSelectedId(el.id)}
                  onDblClick={() => {
                    const nuevo = prompt('Editar texto', el.text);
                    if (nuevo !== null) {
                      setElements((prev: any[]) => prev.map((p) => (p.id === el.id ? { ...p, text: nuevo } : p)));
                    }
                  }}
                  onDblTap={() => {
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
        
        {/* Indicador de escala */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}