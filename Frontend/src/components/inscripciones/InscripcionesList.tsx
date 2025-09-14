"use client";

import { useState, useMemo } from "react";
import { Card, Heading, Text, Badge, Button, Flex } from "@radix-ui/themes";
import {
  RefreshCw,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  Plus,
  Upload,
  Award,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/ui/DataTable";
import { useInscripciones } from "@/hooks/useInscripciones";
import { InscripcionDetallada } from "@/types/cursos";
import InscripcionModal from "./InscripcionModal";
import ImportCSVModal from "./ImportXLSXModal";

export default function InscripcionesList() {
  const { data: session } = useSession();
  const [selectedInscripcion, setSelectedInscripcion] = useState<InscripcionDetallada | null>(null);
  const [inscripcionModalOpen, setInscripcionModalOpen] = useState(false);
  const [importCSVModalOpen, setImportCSVModalOpen] = useState(false);

  const {
    inscripciones,
    loading,
    error,
    pagination,
    refetch,
    marcarCompletada,
    desactivarInscripcion,
    inscribirEstudiante,
    importarXLSX,
  } = useInscripciones(
    useMemo(() => ({
      limit: 25,
      activos: true,
    }), [])
  );

  const handleMarcarCompletada = async (inscripcion: InscripcionDetallada) => {
    try {
      await marcarCompletada(inscripcion.id);
    } catch (error: any) {
      alert(error.message || "Error al marcar como completada");
    }
  };

  const handleDesactivar = async (inscripcion: InscripcionDetallada) => {
    if (confirm(`¿Está seguro que desea desactivar la inscripción de ${inscripcion.estudiante_nombre}?`)) {
      try {
        await desactivarInscripcion(inscripcion.id);
      } catch (error: any) {
        alert(error.message || "Error al desactivar inscripción");
      }
    }
  };

  const handleCreateInscripcion = async (cursoId: string, estudianteId: string) => {
    await inscribirEstudiante(cursoId, estudianteId);
    setInscripcionModalOpen(false);
  };

  const handleImportXLSX = async (file: File) => {
    const result = await importarXLSX(file);
    return result;
  };

  const getStatsData = () => {
    const total = inscripciones.length;
    const completadas = inscripciones.filter((i) => i.completado).length;
    const pendientes = inscripciones.filter((i) => !i.completado).length;
    const cursosUnicos = new Set(inscripciones.map((i) => i.curso_id)).size;

    return { total, completadas, pendientes, cursosUnicos };
  };

  const stats = getStatsData();

  const columns: ColumnDef<InscripcionDetallada>[] = useMemo(
    () => [
      {
        accessorKey: "estudiante_nombre",
        header: "Estudiante",
        cell: ({ row }) => (
          <div>
            <Text weight="medium" className="block">
              {row.original.estudiante_nombre}
            </Text>
            <Text size="2" className="text-gray-500">
              {row.original.estudiante_email}
            </Text>
            <Text size="1" className="text-gray-400">
              {row.original.estudiante_cedula}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "curso_nombre",
        header: "Curso",
        cell: ({ row }) => (
          <div>
            <Text weight="medium" className="block">
              {row.original.curso_nombre}
            </Text>
            {row.original.instructor_nombre && (
              <Text size="2" className="text-gray-500">
                Instructor: {row.original.instructor_nombre}
              </Text>
            )}
            {row.original.duracion && (
              <Text size="1" className="text-gray-400">
                {row.original.duracion} horas
              </Text>
            )}
          </div>
        ),
      },
      {
        accessorKey: "fecha_inscripcion",
        header: "Fecha Inscripción",
        cell: ({ getValue }) => (
          <Flex align="center" gap="1">
            <Calendar size={14} className="text-gray-500" />
            <Text size="2">
              {new Date(getValue() as string).toLocaleDateString()}
            </Text>
          </Flex>
        ),
      },
      {
        accessorKey: "completado",
        header: "Estado",
        cell: ({ getValue, row }) => {
          const completado = getValue() as boolean;
          return (
            <div>
              <Badge color={completado ? "green" : "yellow"} size="2">
                {completado ? "Completado" : "En Progreso"}
              </Badge>
              {row.original.fecha_fin && (
                <Text size="1" className="text-gray-400 block mt-1">
                  Fin: {new Date(row.original.fecha_fin).toLocaleDateString()}
                </Text>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <Flex gap="2">
            {!row.original.completado && (
              <Button
                size="1"
                variant="soft"
                color="green"
                onClick={() => handleMarcarCompletada(row.original)}
                className="cursor-pointer"
                title="Marcar como completado"
              >
                <CheckCircle size={14} />
              </Button>
            )}
            {(session?.user?.role === "ADMIN" || 
              (session?.user?.role === "PROFESOR" && session.user.id === row.original.instructor_nombre)) && (
              <Button
                size="1"
                variant="soft"
                color="red"
                onClick={() => handleDesactivar(row.original)}
                className="cursor-pointer"
                title="Desactivar inscripción"
              >
                <XCircle size={14} />
              </Button>
            )}
          </Flex>
        ),
      },
    ],
    [session?.user?.role, session?.user?.id]
  );

  if (!session) {
    return (
      <Card className="p-6 text-center">
        <Text size="3" className="text-gray-600">
          Cargando...
        </Text>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.total}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Total Inscripciones
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Award size={20} className="text-green-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.completadas}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Completadas
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <BookOpen size={20} className="text-yellow-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.pendientes}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                En Progreso
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.cursosUnicos}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Cursos Activos
              </Text>
            </div>
          </Flex>
        </Card>
      </div>

      {/* Inscripciones Table */}
      <Card>
        <div className="p-6">
          <Flex justify="between" align="center" className="mb-6">
            <Heading size="4">Lista de Inscripciones</Heading>
            <Flex gap="2">
              <Button
                onClick={() => refetch()}
                disabled={loading}
                variant="soft"
                className="cursor-pointer"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Actualizar
              </Button>
              {(session?.user?.role === "ADMIN" || session?.user?.role === "PROFESOR") && (
                <>
                  <Button
                    variant="soft"
                    color="blue"
                    className="cursor-pointer"
                    onClick={() => setInscripcionModalOpen(true)}
                  >
                    <Plus size={16} />
                    Nueva Inscripción
                  </Button>
                  <Button
                    variant="soft"
                    color="green"
                    className="cursor-pointer"
                    onClick={() => setImportCSVModalOpen(true)}
                  >
                    <Upload size={16} />
                    Importar Excel
                  </Button>
                </>
              )}
            </Flex>
          </Flex>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Text size="2" className="text-red-700">
                {error}
              </Text>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <Text>Cargando inscripciones...</Text>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={inscripciones}
              searchPlaceholder="Buscar por estudiante, curso, instructor..."
              persistStateKey="inscripciones-list"
            />
          )}
        </div>
      </Card>

      {/* Modales */}
      <InscripcionModal
        open={inscripcionModalOpen}
        onClose={() => setInscripcionModalOpen(false)}
        onSave={handleCreateInscripcion}
      />

      <ImportCSVModal
        open={importCSVModalOpen}
        onClose={() => setImportCSVModalOpen(false)}
        onImport={handleImportXLSX}
      />
    </div>
  );
}