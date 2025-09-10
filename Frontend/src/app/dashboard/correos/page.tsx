"use client";

import { useMemo } from "react";
import { Heading, Text, Card, Button, Flex, Badge } from "@radix-ui/themes";
import { Mail, Plus, Send, Eye, Edit, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/DataTable";

interface CorreoEnviado {
  id: number;
  destinatario: string;
  asunto: string;
  plantilla: string;
  fechaEnvio: string;
  estado: string;
}

export default function CorreosPage() {
  const plantillasCorreo = [
    {
      id: 1,
      nombre: "Bienvenida",
      asunto: "¡Bienvenido al Sistema CDP!",
      descripcion: "Email de bienvenida para nuevos usuarios",
      fechaCreacion: "2024-01-10",
      estado: "Activa",
      usos: 156
    },
    {
      id: 2,
      nombre: "Certificado Listo",
      asunto: "Tu certificado está listo para descargar",
      descripcion: "Notificación cuando un certificado está disponible",
      fechaCreacion: "2024-01-15",
      estado: "Activa",
      usos: 89
    },
    {
      id: 3,
      nombre: "Recordatorio Curso",
      asunto: "No olvides continuar tu curso",
      descripcion: "Recordatorio para estudiantes inactivos",
      fechaCreacion: "2024-02-01",
      estado: "Borrador",
      usos: 0
    }
  ];

  const correosEnviados: CorreoEnviado[] = [
    {
      id: 1,
      destinatario: "maria@email.com",
      asunto: "¡Bienvenido al Sistema CDP!",
      plantilla: "Bienvenida",
      fechaEnvio: "2024-02-15 10:30",
      estado: "Entregado"
    },
    {
      id: 2,
      destinatario: "juan@email.com",
      asunto: "Tu certificado está listo para descargar",
      plantilla: "Certificado Listo",
      fechaEnvio: "2024-02-15 09:15",
      estado: "Entregado"
    },
    {
      id: 3,
      destinatario: "ana@email.com",
      asunto: "No olvides continuar tu curso",
      plantilla: "Recordatorio Curso",
      fechaEnvio: "2024-02-15 08:00",
      estado: "Pendiente"
    },
    {
      id: 4,
      destinatario: "carlos@email.com",
      asunto: "¡Bienvenido al Sistema CDP!",
      plantilla: "Bienvenida",
      fechaEnvio: "2024-02-14 16:45",
      estado: "Error"
    }
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Activa": return "green";
      case "Borrador": return "yellow";
      case "Entregado": return "green";
      case "Pendiente": return "blue";
      case "Error": return "red";
      default: return "gray";
    }
  };

  const correosColumns: ColumnDef<CorreoEnviado>[] = useMemo(
    () => [
      {
        accessorKey: "destinatario",
        header: "Destinatario",
        cell: ({ getValue }) => <Text weight="medium">{getValue() as string}</Text>,
      },
      {
        accessorKey: "asunto",
        header: "Asunto",
        cell: ({ getValue }) => <Text>{getValue() as string}</Text>,
      },
      {
        accessorKey: "plantilla",
        header: "Plantilla",
        cell: ({ getValue }) => (
          <Text size="2" className="text-gray-600">{getValue() as string}</Text>
        ),
      },
      {
        accessorKey: "fechaEnvio",
        header: "Fecha Envío",
        cell: ({ getValue }) => (
          <Text size="2">
            {new Date(getValue() as string).toLocaleString()}
          </Text>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ getValue }) => (
          <Badge color={getEstadoBadgeColor(getValue() as string)} size="1">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button size="1" variant="soft" className="cursor-pointer">
              <Eye size={12} />
            </Button>
            {row.original.estado === "Error" && (
              <Button size="1" variant="soft" color="orange" className="cursor-pointer">
                <Send size={12} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Flex justify="between" align="center">
          <div>
            <Heading size="7" className="text-gray-900 mb-2">
              Gestión de Correos
            </Heading>
            <Text size="3" className="text-gray-600">
              Administra plantillas y envíos de correo electrónico
            </Text>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="cursor-pointer">
              <Send size={16} />
              Envío Masivo
            </Button>
            <Button className="cursor-pointer">
              <Plus size={16} />
              Nueva Plantilla
            </Button>
          </div>
        </Flex>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Mail size={20} className="text-blue-600" />
              </div>
              <div>
                <Text size="3" weight="bold">1,234</Text>
                <Text size="2" className="text-gray-600 block">Total Enviados</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Mail size={20} className="text-green-600" />
              </div>
              <div>
                <Text size="3" weight="bold">1,189</Text>
                <Text size="2" className="text-gray-600 block">Entregados</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Mail size={20} className="text-yellow-600" />
              </div>
              <div>
                <Text size="3" weight="bold">23</Text>
                <Text size="2" className="text-gray-600 block">Pendientes</Text>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Mail size={20} className="text-red-600" />
              </div>
              <div>
                <Text size="3" weight="bold">22</Text>
                <Text size="2" className="text-gray-600 block">Errores</Text>
              </div>
            </div>
          </Card>
        </div>

        {/* Plantillas de Correo */}
        <div>
          <Heading size="5" className="mb-4">
            Plantillas de Correo
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plantillasCorreo.map((plantilla) => (
              <Card key={plantilla.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Mail size={20} className="text-blue-600" />
                    </div>
                    <Badge color={getEstadoBadgeColor(plantilla.estado)} size="1">
                      {plantilla.estado}
                    </Badge>
                  </div>
                  
                  <div>
                    <Heading size="4" className="mb-2">
                      {plantilla.nombre}
                    </Heading>
                    <Text size="3" weight="medium" className="text-gray-700 mb-1">
                      {plantilla.asunto}
                    </Text>
                    <Text size="2" className="text-gray-600">
                      {plantilla.descripcion}
                    </Text>
                  </div>

                  <div className="text-sm text-gray-500">
                    <div>Creada: {new Date(plantilla.fechaCreacion).toLocaleDateString()}</div>
                    <div>Usos: {plantilla.usos} envíos</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="2" variant="soft" className="flex-1 cursor-pointer">
                      <Eye size={14} />
                      Vista Previa
                    </Button>
                    <Button size="2" variant="outline" className="cursor-pointer">
                      <Edit size={14} />
                    </Button>
                    <Button size="2" variant="outline" color="red" className="cursor-pointer">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Correos Enviados Recientes */}
        <div>
          <Heading size="5" className="mb-4">
            Correos Enviados Recientes
          </Heading>
          <DataTable
            columns={correosColumns}
            data={correosEnviados}
            searchPlaceholder="Buscar por destinatario, asunto o plantilla..."
            persistStateKey="correos-list"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}