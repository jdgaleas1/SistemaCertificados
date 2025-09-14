"use client";

import { useState, useMemo } from "react";
import { Card, Heading, Text, Badge, Button, Flex } from "@radix-ui/themes";
import {
  Edit,
  Trash2,
  RefreshCw,
  BookOpen,
  Users,
  Clock,
  Calendar,
  Plus,
  Eye,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/ui/DataTable";
import { useCursos } from "@/hooks/useCursos";
import { Curso, CursoCreate, CursoUpdate } from "@/types/cursos";
import CursoModal from "./CursoModal";
import DeleteCursoModal from "./DeleteCursoModal";

export default function CursosList() {
  const { data: session } = useSession();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);

  // Memoize filters to avoid creating a new object each render,
  // which was causing the hook effect to refetch continuously.
  const cursosFilters = useMemo(() => ({
    limit: 25,
    activos: true,
  }), []);

  const {
    cursos,
    loading,
    error,
    pagination,
    refetch,
    createCurso,
    updateCurso,
    deleteCurso,
  } = useCursos(cursosFilters);

  const handleCreateCurso = async (data: CursoCreate | CursoUpdate) => {
    await createCurso(data as CursoCreate);
    setCreateModalOpen(false);
  };

  const handleEditCurso = (curso: Curso) => {
    setSelectedCurso(curso);
    setEditModalOpen(true);
  };

  const handleUpdateCurso = async (data: CursoUpdate) => {
    if (!selectedCurso) return;
    await updateCurso(selectedCurso.id, data);
    setEditModalOpen(false);
    setSelectedCurso(null);
  };

  const handleDeleteCurso = (curso: Curso) => {
    setSelectedCurso(curso);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (cursoId: string) => {
    await deleteCurso(cursoId);
    setDeleteModalOpen(false);
    setSelectedCurso(null);
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedCurso(null);
  };

  const getStatsData = () => {
    const total = cursos.length;
    const conFechas = cursos.filter((c) => c.fecha_inicio && c.fecha_fin).length;
    const misCursos = session?.user?.role === "PROFESOR" 
      ? cursos.filter((c) => c.instructor_id === session.user.id).length 
      : 0;

    console.log('📊 Estadísticas de cursos:', { total, conFechas, misCursos, cursos });
    return { total, conFechas, misCursos };
  };

  const stats = getStatsData();

  const columns: ColumnDef<Curso>[] = useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Curso",
        cell: ({ row }) => (
          <div>
            <Text weight="medium" className="block">
              {row.original.nombre}
            </Text>
            {row.original.descripcion && (
              <Text size="2" className="text-gray-500 line-clamp-2">
                {row.original.descripcion}
              </Text>
            )}
          </div>
        ),
      },
      {
        accessorKey: "instructor_nombre",
        header: "Instructor",
        cell: ({ getValue }) => (
          <Text size="2">
            {getValue() as string || "No asignado"}
          </Text>
        ),
      },
      {
        accessorKey: "duracion",
        header: "Duración",
        cell: ({ getValue }) => {
          const duracion = getValue() as number;
          return duracion ? (
            <Flex align="center" gap="1">
              <Clock size={14} className="text-gray-500" />
              <Text size="2">{duracion}h</Text>
            </Flex>
          ) : (
            <Text size="2" className="text-gray-500">-</Text>
          );
        },
      },
      {
        accessorKey: "fecha_inicio",
        header: "Fechas",
        cell: ({ row }) => {
          const fechaInicio = row.original.fecha_inicio;
          const fechaFin = row.original.fecha_fin;
          
          if (!fechaInicio && !fechaFin) {
            return <Text size="2" className="text-gray-500">Sin fechas</Text>;
          }
          
          return (
            <div>
              {fechaInicio && (
                <Flex align="center" gap="1" className="mb-1">
                  <Calendar size={12} className="text-green-600" />
                  <Text size="1" className="text-green-600">
                    {new Date(fechaInicio).toLocaleDateString()}
                  </Text>
                </Flex>
              )}
              {fechaFin && (
                <Flex align="center" gap="1">
                  <Calendar size={12} className="text-red-600" />
                  <Text size="1" className="text-red-600">
                    {new Date(fechaFin).toLocaleDateString()}
                  </Text>
                </Flex>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "fecha_creacion",
        header: "Creado",
        cell: ({ getValue }) => (
          <Text size="2">
            {new Date(getValue() as string).toLocaleDateString()}
          </Text>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <Flex gap="2">
            <Button
              size="1"
              variant="soft"
              onClick={() => handleEditCurso(row.original)}
              className="cursor-pointer"
              title="Editar curso"
            >
              <Edit size={14} />
            </Button>
            <Button
              size="1"
              variant="soft"
              color="blue"
              className="cursor-pointer"
              title="Ver estudiantes"
            >
              <Users size={14} />
            </Button>
            {session?.user?.role === "ADMIN" && (
              <Button
                size="1"
                variant="soft"
                color="red"
                onClick={() => handleDeleteCurso(row.original)}
                className="cursor-pointer"
                title="Eliminar curso"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </Flex>
        ),
      },
    ],
    [session?.user?.role]
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.total}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Total Cursos
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.conFechas}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Con Fechas
              </Text>
            </div>
          </Flex>
        </Card>

        {session?.user?.role === "PROFESOR" && (
          <Card className="p-4">
            <Flex align="center" gap="3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <Text size="3" weight="bold">
                  {stats.misCursos}
                </Text>
                <Text size="2" className="text-gray-600 block mt-1">
                  Mis Cursos
                </Text>
              </div>
            </Flex>
          </Card>
        )}
      </div>

      {/* Cursos Table */}
      <Card>
        <div className="p-6">
          <Flex justify="between" align="center" className="mb-6">
            <Heading size="4">Lista de Cursos</Heading>
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
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="cursor-pointer"
                >
                  <Plus size={16} />
                  Nuevo Curso
                </Button>
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
              <Text>Cargando cursos...</Text>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={cursos}
              searchPlaceholder="Buscar cursos por nombre, descripción..."
              persistStateKey="cursos-list"
            />
          )}
        </div>
      </Card>

      {/* Modales */}
      <CursoModal
        open={createModalOpen}
        onClose={handleModalClose}
        onSave={handleCreateCurso}
      />

      <CursoModal
        open={editModalOpen}
        curso={selectedCurso}
        onClose={handleModalClose}
        onSave={handleUpdateCurso}
      />

      <DeleteCursoModal
        open={deleteModalOpen}
        curso={selectedCurso}
        onClose={handleModalClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}