"use client";

import { Heading, Text, Card, Button, Flex, Badge } from "@radix-ui/themes";
import { FileText, Plus, Download, Eye, Edit } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { listTemplates } from "@/lib/api";
import { useEffect, useState } from "react";

export default function CertificadosPage() {
  const router = useRouter();
  const [plantillas, setPlantillas] = useState<any[]>([]);

  useEffect(() => {
    listTemplates().then(setPlantillas).catch(() => setPlantillas([]));
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
          <Button className="cursor-pointer" onClick={() => router.push("/dashboard/certificados/editor/nueva") }>
            <Plus size={16} />
            Nueva Plantilla
          </Button>
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
                    <Button size="2" variant="soft" className="flex-1 cursor-pointer" onClick={() => router.push(`/dashboard/certificados/editor/${plantilla.id}`)}>
                      <Eye size={14} />
                      Vista Previa
                    </Button>
                    <Button size="2" variant="outline" className="cursor-pointer" onClick={() => router.push(`/dashboard/certificados/editor/${plantilla.id}`)}>
                      <Edit size={14} />
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