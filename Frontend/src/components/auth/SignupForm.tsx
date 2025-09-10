"use client";
import { Flex, TextField, Button, Box, Text } from "@radix-ui/themes";
import { User, Hash, Mail, Lock, AlertCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

interface SignupFormData {
  firstName: string;
  lastName: string;
  cedula: string;
  email: string;
  password: string;
}

function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string>("");
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      cedula: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setServerError("");

    try {
      // Llamar al endpoint de registro
      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          nombre: data.firstName,
          apellido: data.lastName,
          cedula: data.cedula,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear la cuenta");
      }

      const result = await response.json();
      console.log("Registro exitoso:", result.user.email);

      // Login automático usando NextAuth
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setServerError("Cuenta creada, pero error al iniciar sesión automáticamente. Intenta iniciar sesión manualmente.");
        router.push("/auth/login");
      } else {
        // Registro y login exitoso, redirigir al dashboard
        router.push("/dashboard");
      }

    } catch (error: any) {
      console.error("Error en registro:", error);
      setServerError(error.message || "Error al crear la cuenta. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="4">
        {/* Error del servidor */}
        {serverError && (
          <Box className="p-3 bg-red-50 border border-red-200 rounded-md">
            <Flex align="center" gap="2">
              <AlertCircle size={16} className="text-red-500" />
              <Text size="2" className="text-red-700">
                {serverError}
              </Text>
            </Flex>
          </Box>
        )}

        {/* Nombres y Apellidos */}
        <div className="space-y-1">
          <Flex gap="3" className="w-full">
            <Box className="flex-1">
              <Controller
                name="firstName"
                control={control}
                rules={{
                  required: "Los nombres son obligatorios",
                  minLength: {
                    value: 2,
                    message: "Mínimo 2 caracteres"
                  }
                }}
                render={({ field }) => (
                  <TextField.Root
                    type="text"
                    placeholder="Nombres"
                    autoFocus
                    size="3"
                    className="w-full"
                    disabled={isLoading}
                    {...field}
                  >
                    <TextField.Slot>
                      <User size={16} className="text-slate-400" />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
            </Box>
            <Box className="flex-1">
              <Controller
                name="lastName"
                control={control}
                rules={{
                  required: "Los apellidos son obligatorios",
                  minLength: {
                    value: 2,
                    message: "Mínimo 2 caracteres"
                  }
                }}
                render={({ field }) => (
                  <TextField.Root
                    type="text"
                    placeholder="Apellidos"
                    size="3"
                    className="w-full"
                    disabled={isLoading}
                    {...field}
                  >
                    <TextField.Slot>
                      <User size={16} className="text-slate-400" />
                    </TextField.Slot>
                  </TextField.Root>
                )}
              />
            </Box>
          </Flex>
          {(errors.firstName || errors.lastName) && (
            <Text size="2" className="text-red-500 font-medium">
              {errors.firstName?.message || errors.lastName?.message}
            </Text>
          )}
        </div>

        {/* Cédula */}
        <div className="space-y-1">
          <Controller
            name="cedula"
            control={control}
            rules={{
              required: "La cédula es obligatoria",
              minLength: {
                value: 8,
                message: "Mínimo 8 dígitos"
              },
              pattern: {
                value: /^[0-9\s\-]+$/,
                message: "Solo números, espacios y guiones"
              }
            }}
            render={({ field }) => (
              <TextField.Root
                type="text"
                placeholder="Número de cédula"
                size="3"
                disabled={isLoading}
                {...field}
              >
                <TextField.Slot>
                  <Hash size={16} className="text-slate-400" />
                </TextField.Slot>
              </TextField.Root>
            )}
          />
          {errors.cedula && (
            <Text size="2" className="text-red-500 font-medium">
              {errors.cedula.message}
            </Text>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Controller
            name="email"
            control={control}
            rules={{
              required: "El email es obligatorio",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido"
              }
            }}
            render={({ field }) => (
              <TextField.Root
                type="email"
                placeholder="Correo electrónico"
                size="3"
                disabled={isLoading}
                {...field}
              >
                <TextField.Slot>
                  <Mail size={16} className="text-slate-400" />
                </TextField.Slot>
              </TextField.Root>
            )}
          />
          {errors.email && (
            <Text size="2" className="text-red-500 font-medium">
              {errors.email.message}
            </Text>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Controller
            name="password"
            control={control}
            rules={{
              required: "La contraseña es obligatoria",
              minLength: {
                value: 8,
                message: "Mínimo 8 caracteres"
              },
              pattern: {
                value: /^(?=.*[A-Za-z])(?=.*\d)/,
                message: "Debe contener al menos una letra y un número"
              }
            }}
            render={({ field }) => (
              <TextField.Root
                type="password"
                placeholder="Contraseña (mín. 8 caracteres)"
                size="3"
                disabled={isLoading}
                {...field}
              >
                <TextField.Slot>
                  <Lock size={16} className="text-slate-400" />
                </TextField.Slot>
              </TextField.Root>
            )}
          />
          {errors.password && (
            <Text size="2" className="text-red-500 font-medium">
              {errors.password.message}
            </Text>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="3"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 mt-2"
        >
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>
      </Flex>
    </form>
  );
}

export default SignUpForm;