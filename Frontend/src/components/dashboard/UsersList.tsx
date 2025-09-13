"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, Heading, Text, Badge, Button, Flex } from "@radix-ui/themes";
import {
  Edit,
  Trash2,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Key,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { api, ApiError } from "@/lib/api";
import { useSession } from "next-auth/react";
import { DataTable } from "@/components/ui/DataTable";

interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  cedula: string;
  rol: string;
  is_active: boolean;
  fecha_creacion: string;
}

interface UsersListProps {
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  onChangePassword?: (user: User) => void;
  refreshTrigger?: number;
}

export default function UsersList({
  onEditUser,
  onDeleteUser,
  onChangePassword,
  refreshTrigger,
}: UsersListProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [session, refreshTrigger]);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (initialLoad) {
        setLoading(true);
      }
      setError("");

      const data = await api.get("/usuarios");
      setUsers(data);

      if (initialLoad) {
        setInitialLoad(false);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(`Error ${error.status}: ${error.message}`);
      } else {
        setError("Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <Card className="p-6 text-center">
        <Text size="3" className="text-gray-600">
          No tienes permisos para ver esta sección
        </Text>
      </Card>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "red";
      case "PROFESOR":
        return "blue";
      case "ESTUDIANTE":
        return "green";
      default:
        return "gray";
    }
  };

  const getStatsData = () => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = users.filter((u) => !u.is_active).length;
    const admins = users.filter((u) => u.rol === "ADMIN").length;
    const profesores = users.filter((u) => u.rol === "PROFESOR").length;
    const estudiantes = users.filter((u) => u.rol === "ESTUDIANTE").length;

    return { total, active, inactive, admins, profesores, estudiantes };
  };

  const stats = getStatsData();

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorFn: (row) => `${row.nombre_completo} ${row.email}`,
        id: "usuario",
        header: "Usuario",
        cell: ({ row }) => (
          <div>
            <Text weight="medium" className="block">
              {row.original.nombre_completo}
            </Text>
            <Text size="2" className="text-gray-500">
              {row.original.email}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "cedula",
        header: "Cédula",
        cell: ({ getValue }) => (
          <Text size="2" className="font-mono">
            {getValue() as string}
          </Text>
        ),
      },
      {
        accessorKey: "rol",
        header: "Rol",
        cell: ({ getValue }) => (
          <Badge color={getRoleBadgeColor(getValue() as string)} size="2">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ getValue }) => (
          <Badge color={getValue() ? "green" : "red"} size="2">
            {getValue() ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        accessorKey: "fecha_creacion",
        header: "Fecha Creación",
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
              onClick={() => onEditUser?.(row.original)}
              className="cursor-pointer"
              title="Editar usuario"
            >
              <Edit size={14} />
            </Button>
            <Button
              size="1"
              variant="soft"
              color="orange"
              onClick={() => onChangePassword?.(row.original)}
              className="cursor-pointer"
              title="Cambiar contraseña"
            >
              <Key size={14} />
            </Button>
            {/* Solo mostrar botón de eliminar si no es el usuario admin actual */}
            {session?.user?.id !== row.original.id && (
              <Button
                size="1"
                variant="soft"
                color="red"
                onClick={() => onDeleteUser?.(row.original)}
                className="cursor-pointer"
                title="Eliminar usuario"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </Flex>
        ),
      },
    ],
    [onEditUser, onDeleteUser, onChangePassword, session?.user?.id]
  );

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
                Total Usuarios
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.active}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Activos
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-red-100 p-2 rounded-lg">
              <UserX size={20} className="text-red-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.inactive}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Inactivos
              </Text>
            </div>
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex align="center" gap="3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <Text size="3" weight="bold">
                {stats.admins}
              </Text>
              <Text size="2" className="text-gray-600 block mt-1">
                Administradores
              </Text>
            </div>
          </Flex>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <div className="p-6">
          <Flex justify="between" align="center" className="mb-6">
            <Heading size="4">Lista de Usuarios</Heading>
            <Button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              variant="soft"
              className="cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </Flex>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <Text size="2" className="text-red-700">
                {error}
              </Text>
            </div>
          )}

          {loading && initialLoad ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <Text>Cargando usuarios...</Text>
            </div>
          ) : (
            <div className="relative">
              {refreshing && (
                <div className="absolute top-0 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 z-10">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <Text size="2" className="text-blue-700">
                      Actualizando datos...
                    </Text>
                  </div>
                </div>
              )}
              <DataTable
                columns={columns}
                data={users}
                searchPlaceholder="Buscar usuarios por nombre, email, cédula..."
                persistStateKey="users-list"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
