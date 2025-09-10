"use client";

import { Stage, Layer, Image as KonvaImage, Text as KonvaText } from "react-konva";
import useImage from "@/hooks/useImage";

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
      
      case 'cover':
        const coverAspect = image.width / image.height;
        const canvasAspect = canvasSize.width / canvasSize.height;
        
        let coverWidth, coverHeight;
        if (coverAspect > canvasAspect) {
          coverWidth = canvasSize.width;
          coverHeight = coverWidth / coverAspect;
        } else {
          coverHeight = canvasSize.height;
          coverWidth = coverHeight * coverAspect;
        }
        
        return {
          width: coverWidth,
          height: coverHeight,
          x: (canvasSize.width - coverWidth) / 2,
          y: (canvasSize.height - coverHeight) / 2
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
    <div className="relative">
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
      <Stage width={canvasSize.width} height={canvasSize.height} onMouseDown={() => setSelectedId(null)}>
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
          {elements.map((el) => (
            <KonvaText
              key={el.id}
              draggable
              x={el.x}
              y={el.y}
              text={el.text}
              fontSize={el.fontSize}
              fontFamily={el.fontFamily}
              fill={el.fill}
              onClick={() => setSelectedId(el.id)}
              onDragEnd={(e) => {
                const { x, y } = e.target.position();
                setElements((prev: any[]) => prev.map((p) => (p.id === el.id ? { ...p, x, y } : p)));
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}


