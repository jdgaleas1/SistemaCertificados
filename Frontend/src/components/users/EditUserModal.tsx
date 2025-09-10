"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  Button,
  Text,
  TextField,
  Select,
  Flex,
  Switch,
} from "@radix-ui/themes";
import { useForm, Controller } from "react-hook-form";
import {
  Edit,
  User,
  Mail,
  CreditCard,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { api, ApiError } from "@/lib/api";

interface EditUserModalProps {
  open: boolean;
  user: any;
  onClose: () => void;
}

interface EditUserForm {
  email: string;
  nombre: string;
  apellido: string;
  cedula: string;
  rol: "ADMIN" | "PROFESOR" | "ESTUDIANTE";
  is_active: boolean;
}

export default function EditUserModal({
  open,
  user,
  onClose,
}: EditUserModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserForm>({
    defaultValues: {
      email: "",
      nombre: "",
      apellido: "",
      cedula: "",
      rol: "ESTUDIANTE",
      is_active: true,
    },
  });

  useEffect(() => {
    if (user && open) {
      reset({
        email: user.email || "",
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        cedula: user.cedula || "",
        rol: user.rol || "ESTUDIANTE",
        is_active: user.is_active ?? true,
      });
    }
  }, [user, open, reset]);

  // Verificar si el usuario actual se está editando a sí mismo y es admin
  const isEditingSelf = session?.user?.email === user?.email;
  const isCurrentUserAdmin = session?.user?.role === "ADMIN";

  const onSubmit = handleSubmit(async (data) => {
    if (!user?.id) return;

    // Validación: Impedir que un admin se quite su propio rol de administrador
    if (isEditingSelf && isCurrentUserAdmin && data.rol !== "ADMIN") {
      setError(
        "No puedes quitarte tu propio rol de administrador. Esto causaría problemas de acceso al sistema."
      );
      return;
    }

    // Validación: Impedir que un usuario se desactive a sí mismo
    if (isEditingSelf && !data.is_active) {
      setError(
        "No puedes desactivar tu propia cuenta. Esto te bloquearía el acceso al sistema."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.put(`/usuarios/${user.id}`, {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        rol: data.rol,
        is_active: data.is_active,
      });

      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Error al actualizar el usuario");
      }
    } finally {
      setLoading(false);
    }
  });

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Edit size={20} />
            Editar Usuario
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4">
          Modifica la información del usuario {user.nombre_completo}.
        </Dialog.Description>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text size="2" className="text-red-700">
                {error}
              </Text>
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Nombre *
              </Text>
              <Controller
                name="nombre"
                control={control}
                rules={{
                  required: "El nombre es obligatorio",
                  minLength: { value: 2, message: "Mínimo 2 caracteres" },
                }}
                render={({ field }) => (
                  <TextField.Root
                    placeholder="Nombre"
                    disabled={loading}
                    {...field}
                  >
                    <TextField.Slot>
                      <User size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
              {errors.nombre && (
                <Text size="1" className="text-red-500 mt-1">
                  {errors.nombre.message}
                </Text>
              )}
            </div>

            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Apellido *
              </Text>
              <Controller
                name="apellido"
                control={control}
                rules={{
                  required: "El apellido es obligatorio",
                  minLength: { value: 2, message: "Mínimo 2 caracteres" },
                }}
                render={({ field }) => (
                  <TextField.Root
                    placeholder="Apellido"
                    disabled={loading}
                    {...field}
                  >
                    <TextField.Slot>
                      <User size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
              {errors.apellido && (
                <Text size="1" className="text-red-500 mt-1">
                  {errors.apellido.message}
                </Text>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Text size="2" weight="medium" className="block mb-1">
              Email *
            </Text>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "El email es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido",
                },
              }}
              render={({ field }) => (
                <TextField.Root
                  type="email"
                  placeholder="usuario@email.com"
                  disabled={loading}
                  {...field}
                >
                  <TextField.Slot>
                    <Mail size={16} />
                  </TextField.Slot>
                </TextField.Root>
              )}
            />
            {errors.email && (
              <Text size="1" className="text-red-500 mt-1">
                {errors.email.message}
              </Text>
            )}
          </div>

          {/* Cédula y Rol */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Cédula *
              </Text>
              <Controller
                name="cedula"
                control={control}
                rules={{
                  required: "La cédula es obligatoria",
                  minLength: { value: 5, message: "Mínimo 5 caracteres" },
                }}
                render={({ field }) => (
                  <TextField.Root
                    placeholder="1234567890"
                    disabled={loading}
                    {...field}
                  >
                    <TextField.Slot>
                      <CreditCard size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
              {errors.cedula && (
                <Text size="1" className="text-red-500 mt-1">
                  {errors.cedula.message}
                </Text>
              )}
            </div>

            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Rol *
              </Text>
              <Controller
                name="rol"
                control={control}
                rules={{ required: "El rol es obligatorio" }}
                render={({ field }) => {
                  const getRoleName = (rol: string) => {
                    switch (rol) {
                      case "ADMIN":
                        return "Administrador";
                      case "PROFESOR":
                        return "Profesor";
                      case "ESTUDIANTE":
                        return "Estudiante";
                      default:
                        return "Seleccionar rol";
                    }
                  };

                  return (
                    <Select.Root
                      value={field.value || "ESTUDIANTE"}
                      onValueChange={field.onChange}
                      disabled={
                        loading || (isEditingSelf && isCurrentUserAdmin)
                      }
                    >
                      <Select.Trigger className="w-full">
                        <div className="flex items-center gap-2 w-full">
                          <UserCheck size={16} />
                          <span className="flex-1 text-left text-sm">
                            {getRoleName(field.value)}
                          </span>
                        </div>
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="ESTUDIANTE">Estudiante</Select.Item>
                        <Select.Item value="PROFESOR">Profesor</Select.Item>
                        <Select.Item value="ADMIN">Administrador</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  );
                }}
              />
              {errors.rol && (
                <Text size="1" className="text-red-500 mt-1">
                  {errors.rol.message}
                </Text>
              )}

              {/* Advertencia para admin editándose a sí mismo */}
              {isEditingSelf && isCurrentUserAdmin && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Flex align="center" gap="2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <Text size="1" className="text-amber-700">
                      Estás editando tu propio perfil de administrador. No
                      puedes cambiar tu rol.
                    </Text>
                  </Flex>
                </div>
              )}
            </div>
          </div>

          {/* Estado Activo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Text size="2" weight="medium">
                  Usuario Activo
                </Text>
                <Text size="1" className="text-gray-600 mt-1 block">
                  Determina si el usuario puede acceder al sistema
                </Text>
              </div>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading || isEditingSelf} // Deshabilitar si se está editando a sí mismo
                  />
                )}
              />
            </div>

            {/* Advertencia para usuario editándose a sí mismo */}
            {isEditingSelf && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Flex align="center" gap="2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <Text size="1" className="text-amber-700">
                    No puedes desactivar tu propia cuenta para evitar bloquear
                    tu acceso.
                  </Text>
                </Flex>
              </div>
            )}
          </div>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={loading}>
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
