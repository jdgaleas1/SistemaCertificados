"use client";

import { useState } from "react";
import { Dialog, Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Key, Eye, EyeOff } from "lucide-react";
import { changeUserPassword } from "@/lib/api";

interface ChangePasswordModalProps {
  open: boolean;
  user: any;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, user, onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await changeUserPassword(user.id, formData.newPassword);
      
      onClose();
      setFormData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      setError(error.message || "Error al cambiar la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ newPassword: "", confirmPassword: "" });
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Key size={20} />
            Cambiar Contraseña
          </Flex>
        </Dialog.Title>
        
        <Dialog.Description size="2" mb="4">
          Cambiar la contraseña del usuario
        </Dialog.Description>

        {user && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text size="2" weight="medium">Usuario:</Text>
            <div className="mt-2">
              <Text size="2"><strong>Nombre:</strong> {user.nombre_completo}</Text>
              <br />
              <Text size="2"><strong>Email:</strong> {user.email}</Text>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nueva Contraseña */}
          <div>
            <Text size="2" weight="medium" className="block mb-2">
              Nueva Contraseña *
            </Text>
            <div className="relative">
              <TextField.Root
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa la nueva contraseña"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <Text size="2" weight="medium" className="block mb-2">
              Confirmar Contraseña *
            </Text>
            <div className="relative">
              <TextField.Root
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirma la nueva contraseña"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <Text size="2" color="red">{error}</Text>
            </div>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </Dialog.Close>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              <Key size={16} />
              {isSubmitting ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}