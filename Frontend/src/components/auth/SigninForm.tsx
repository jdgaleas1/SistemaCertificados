"use client";
import { Flex, TextField, Button, Text } from "@radix-ui/themes";
import { Mail, Lock } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function SigninForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Credenciales inválidas o el servidor no está disponible. Verifica que el backend esté ejecutándose.");
        } else {
          setError("Error de autenticación. Por favor, intenta nuevamente.");
        }
      } else if (result?.ok) {
        // Redirect to dashboard on successful login
        router.push("/dashboard");
        router.refresh(); // Force refresh to update session
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error de conexión. Asegúrate de que el backend esté ejecutándose en http://localhost:8001");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="4">
        {/* Error Message */}
        {error && (
          <Text size="2" className="text-red-500 font-medium text-center bg-red-50 p-3 rounded-md">
            {error}
          </Text>
        )}

        {/* Email */}
        <div className="space-y-1">
          <Controller
            name="email"
            control={control}
            rules={{
              required: { message: "Este campo es obligatorio", value: true },
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido"
              }
            }}
            render={({ field }) => (
              <TextField.Root
                type="email"
                placeholder="Correo electrónico"
                autoFocus
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
              {String(errors.email.message)}
            </Text>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Controller
            name="password"
            control={control}
            rules={{
              required: { message: "Este campo es obligatorio", value: true },
              minLength: {
                value: 6,
                message: "La contraseña debe tener al menos 6 caracteres"
              }
            }}
            render={({ field }) => (
              <TextField.Root
                type="password"
                placeholder="Contraseña"
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
              {String(errors.password.message)}
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
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </Flex>
    </form>
  );
}

export default SigninForm;
