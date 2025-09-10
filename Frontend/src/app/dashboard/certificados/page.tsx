"use client";

import { Heading, Text, Card, Button, Flex, Badge } from "@radix-ui/themes";
import { FileText, Plus, Download, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { deleteTemplate, listTemplates } from "@/lib/api";
import { useEffect, useState } from "react";
import jsPDF from 'jspdf';

export default function CertificadosPage() {
  const router = useRouter();
  const [plantillas, setPlantillas] = useState<any[]>([]);

  const loadTemplates = () => {
    listTemplates().then(setPlantillas).catch(() => setPlantillas([]));
  };

  const downloadTemplatePDF = async (plantilla: any) => {
    // Crear PDF usando jsPDF con texto nativo
    const pdf = new jsPDF({
      orientation: 'landscape', // Horizontal
      unit: 'pt', // Puntos
      format: 'a4' // A4
    });
    
    // Dimensiones del PDF (A4 horizontal)
    const pdfWidth = 842;
    const pdfHeight = 595;
    
    // Función para convertir imagen a base64 (evita CORS)
    const imageToBase64 = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      });
    };
    
    // Función para convertir color hex a RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    // Función para escalar coordenadas del canvas al PDF
    const scaleCoordinates = (canvasSize: any, pdfSize: any) => {
      return {
        x: (x: number) => (x / canvasSize.width) * pdfSize.width,
        y: (y: number) => (y / canvasSize.height) * pdfSize.height,
        fontSize: (fontSize: number) => (fontSize / canvasSize.width) * pdfSize.width,
        width: (width: number) => (width / canvasSize.width) * pdfSize.width,
        height: (height: number) => (height / canvasSize.height) * pdfSize.height
      };
    };
    
    try {
      const canvasSize = plantilla.canvas || { width: 1600, height: 1131 };
      const scale = scaleCoordinates(canvasSize, { width: pdfWidth, height: pdfHeight });
      
      // Agregar imagen de fondo si existe
      if (plantilla.background_image_url) {
        try {
          const base64Image = await imageToBase64(plantilla.background_image_url);
          // Agregar imagen de fondo que cubra toda la página
          pdf.addImage(base64Image, 'PNG', 0, 0, pdfWidth, pdfHeight);
        } catch (error) {
          console.warn('No se pudo cargar la imagen de fondo:', error);
        }
      }
      
      // Procesar elementos de la plantilla
      if (plantilla.fields) {
        for (const element of plantilla.fields) {
          if (element.type === 'text') {
            // Escalar posición y tamaño
            const x = scale.x(element.x);
            const y = scale.y(element.y);
            const fontSize = scale.fontSize(element.fontSize);
            
            // Configurar fuente y estilo
            const fontFamily = element.fontFamily || 'helvetica';
            const fontStyle = element.fontStyle === 'bold' ? 'bold' : 'normal';
            
            // Convertir color hex a RGB
            const color = hexToRgb(element.fill || '#000000');
            
            // Configurar texto
            pdf.setFont(fontFamily, fontStyle);
            pdf.setFontSize(fontSize);
            pdf.setTextColor(color.r, color.g, color.b);
            
            // Alineación del texto
            const textAlign = element.align || 'left';
            let textX = x;
            
            if (textAlign === 'center') {
              const textWidth = pdf.getTextWidth(element.text);
              textX = x - (textWidth / 2);
            } else if (textAlign === 'right') {
              const textWidth = pdf.getTextWidth(element.text);
              textX = x - textWidth;
            }
            
            // Agregar texto al PDF
            pdf.text(element.text, textX, y);
            
          } else if (element.type === 'image' && (element.imageUrl || element.url)) {
            // Agregar imágenes/logos
            try {
              const base64Img = await imageToBase64(element.imageUrl || element.url);
              const x = scale.x(element.x);
              const y = scale.y(element.y);
              const width = scale.width(element.width);
              const height = scale.height(element.height);
              
              pdf.addImage(base64Img, 'PNG', x, y, width, height);
            } catch (error) {
              console.warn('No se pudo cargar imagen del elemento:', error);
            }
          }
        }
      }
      
      // Descargar el PDF
      pdf.save(`${plantilla.nombre || 'certificado'}.pdf`);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const certificadosRecientes = [
    {
      id: 1,
      estudiante: "María García",
      curso: "Introducción a React",
      plantilla: "Certificado Estándar",
      fechaGeneracion: "2024-02-15",
      estado: "Generado"
    },
    {
      id: 2,
      estudiante: "Juan Pérez",
      curso: "JavaScript Avanzado",
      plantilla: "Certificado Premium",
      fechaGeneracion: "2024-02-14",
      estado: "Enviado"
    },
    {
      id: 3,
      estudiante: "Ana López",
      curso: "Node.js Backend",
      plantilla: "Certificado Técnico",
      fechaGeneracion: "2024-02-13",
      estado: "Pendiente"
    }
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Activa": return "green";
      case "Borrador": return "yellow";
      case "Generado": return "blue";
      case "Enviado": return "green";
      case "Pendiente": return "orange";
      default: return "gray";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Flex justify="between" align="center">
          <div>
            <Heading size="7" className="text-gray-900 mb-2">
              Plantillas de Certificados
            </Heading>
            <Text size="3" className="text-gray-600">
              Gestiona las plantillas y certificados generados
            </Text>
          </div>
          <div className="flex gap-2">
            <Button className="cursor-pointer" onClick={() => router.push("/dashboard/certificados/editor/nueva") }>
              <Plus size={16} />
              Nueva Plantilla
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={loadTemplates}>
              <FileText size={16} />
              Actualizar
            </Button>
          </div>
        </Flex>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <Text size="3" weight="bold">8</Text>
                <Text size="2" className="text-gray-600 block">Plantillas</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FileText size={20} className="text-green-600" />
              </div>
              <div>
                <Text size="3" weight="bold">156</Text>
                <Text size="2" className="text-gray-600 block">Certificados</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <Text size="3" weight="bold">89</Text>
                <Text size="2" className="text-gray-600 block">Este Mes</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FileText size={20} className="text-orange-600" />
              </div>
              <div>
                <Text size="3" weight="bold">12</Text>
                <Text size="2" className="text-gray-600 block">Pendientes</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Plantillas */}
        <div>
          <Heading size="5" className="mb-4">
            Plantillas Disponibles
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantillas.map((plantilla) => (
              <Card key={plantilla.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FileText size={20} className="text-purple-600" />
                    </div>
                    <Badge color={plantilla.is_active ? "green" : "yellow"} size="1">
                      {plantilla.is_active ? "Activa" : "Borrador"}
                    </Badge>
                  </div>
                  <div className="w-full h-40 bg-gray-100 rounded overflow-hidden flex items-center justify-center relative">
                    {plantilla.background_image_url ? (
                      <div className="relative w-full h-full">
                        <img
                          src={plantilla.background_image_url}
                          alt={plantilla.nombre}
                          className="w-full h-full object-contain"
                        />
                        {/* Renderizar elementos de texto e imágenes encima */}
                        {plantilla.fields && plantilla.fields.map((element: any) => {
                          if (element.type === 'text') {
                            return (
                              <div
                                key={element.id}
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${(element.x / 1600) * 100}%`,
                                  top: `${(element.y / 1131) * 100}%`,
                                  fontSize: `${Math.max(8, (element.fontSize / 1600) * 100)}px`,
                                  fontFamily: element.fontFamily,
                                  color: element.fill,
                                  fontWeight: element.fontStyle === 'bold' ? 'bold' : 'normal',
                                  textAlign: element.align,
                                  whiteSpace: 'nowrap',
                                  maxWidth: `${(element.width / 1600) * 100}%`,
                                }}
                              >
                                {element.text}
                              </div>
                            );
                          }
                          if (element.type === 'image' && (element.imageUrl || element.url)) {
                            return (
                              <img
                                key={element.id}
                                src={element.imageUrl || element.url}
                                alt="Elemento"
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${(element.x / 1600) * 100}%`,
                                  top: `${(element.y / 1131) * 100}%`,
                                  width: `${(element.width / 1600) * 100}%`,
                                  height: `${(element.height / 1131) * 100}%`,
                                  objectFit: 'contain',
                                }}
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">Sin imagen de fondo</div>
                    )}
                  </div>
                  
                  <div>
                    <Heading size="4" className="mb-2">
                      {plantilla.nombre}
                    </Heading>
                    <Text size="2" className="text-gray-600">
                      {plantilla.descripcion}
                    </Text>
                  </div>

                  <div className="text-sm text-gray-500">
                    <div>Creada: {plantilla.fecha_creacion ? new Date(plantilla.fecha_creacion).toLocaleDateString() : "-"}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="2" variant="outline" className="cursor-pointer" onClick={() => router.push(`/dashboard/certificados/editor/${plantilla.id}`)}>
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="2"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => downloadTemplatePDF(plantilla)}
                      title="Descargar PDF"
                    >
                      <Download size={14} />
                    </Button>
                    <Button
                      size="2"
                      color="red"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={async () => {
                        if (!confirm("¿Eliminar esta plantilla? Esta acción no se puede deshacer.")) return;
                        await deleteTemplate(plantilla.id);
                        setPlantillas((prev) => prev.filter((p) => p.id !== plantilla.id));
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}