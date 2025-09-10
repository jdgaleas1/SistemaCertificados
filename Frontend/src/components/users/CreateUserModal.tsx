"use client";

import { useState } from "react";
import { Dialog, Button, Text, TextField, Select, Flex } from "@radix-ui/themes";
import { useForm, Controller } from "react-hook-form";
import { X, User, Mail, Lock, CreditCard, UserCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

interface CreateUserForm {
  email: string;
  nombre: string;
  apellido: string;
  cedula: string;
  rol: "ADMIN" | "PROFESOR" | "ESTUDIANTE";
  password: string;
  confirmPassword: string;
}

export default function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserForm>({
    defaultValues: {
      email: "",
      nombre: "",
      apellido: "",
      cedula: "",
      rol: "ESTUDIANTE",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/usuarios", {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        cedula: data.cedula,
        rol: data.rol,
        password: data.password,
      });

      reset();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Error al crear el usuario");
      }
    } finally {
      setLoading(false);
    }
  });

  const handleClose = () => {
    reset();
    setError("");
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>
          <Flex align="center" gap="2">
            <User size={20} />
            Crear Nuevo Usuario
          </Flex>
        </Dialog.Title>

        <Dialog.Description size="2" mb="4">
          Completa la información para crear un nuevo usuario en el sistema.
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
                      case "ADMIN": return "Administrador";
                      case "PROFESOR": return "Profesor";
                      case "ESTUDIANTE": return "Estudiante";
                      default: return "Seleccionar rol";
                    }
                  };

                  return (
                    <Select.Root
                      value={field.value || "ESTUDIANTE"}
                      onValueChange={field.onChange}
                      disabled={loading}
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
            </div>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Contraseña *
              </Text>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "La contraseña es obligatoria",
                  minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message: "Debe contener al menos una letra y un número",
                  },
                }}
                render={({ field }) => (
                  <TextField.Root
                    type="password"
                    placeholder="••••••••"
                    disabled={loading}
                    {...field}
                  >
                    <TextField.Slot>
                      <Lock size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
              {errors.password && (
                <Text size="1" className="text-red-500 mt-1">
                  {errors.password.message}
                </Text>
              )}
            </div>

            <div>
              <Text size="2" weight="medium" className="block mb-1">
                Confirmar Contraseña *
              </Text>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: "Confirma la contraseña",
                  validate: (value) =>
                    value === password || "Las contraseñas no coinciden",
                }}
                render={({ field }) => (
                  <TextField.Root
                    type="password"
                    placeholder="••••••••"
                    disabled={loading}
                    {...field}
                  >
                    <TextField.Slot>
                      <Lock size={16} />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
              {errors.confirmPassword && (
                <Text size="1" className="text-red-500 mt-1">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </div>
          </div>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={loading}>
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}