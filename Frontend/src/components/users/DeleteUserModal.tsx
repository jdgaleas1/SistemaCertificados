"use client";

import { useState } from "react";
import { Dialog, Button, Flex, Text } from "@radix-ui/themes";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteUser } from "@/lib/api";
import { useSession } from "next-auth/react";

interface DeleteUserModalProps {
  open: boolean;
  user: any;
  onClose: () => void;
}

export default function DeleteUserModal({ open, user, onClose }: DeleteUserModalProps) {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  
  // Verificar si es el usuario admin actual
  const isCurrentUser = session?.user?.id === user?.id;

  const handleDelete = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    setError("");

    try {
      console.log("Intentando eliminar usuario:", user.id);
      const response = await deleteUser(user.id);
      console.log("Usuario eliminado exitosamente:", response);
      onClose();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      
      // Manejar diferentes tipos de errores
      let errorMessage = "Error al eliminar el usuario";
      
      if (error.status === 400) {
        errorMessage = error.message || "No se puede eliminar este usuario";
      } else if (error.status === 403) {
        errorMessage = "No tienes permisos para eliminar usuarios";
      } else if (error.status === 404) {
        errorMessage = "Usuario no encontrado";
      } else if (error.status === 401) {
        errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError("");
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <AlertTriangle size={20} color="red" />
            Eliminar Usuario
          </Flex>
        </Dialog.Title>
        
        <Dialog.Description size="2" mb="4">
          {isCurrentUser 
            ? "No puedes eliminar tu propia cuenta de administrador. Esta acción está restringida por seguridad."
            : "Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este usuario?"
          }
        </Dialog.Description>

        {user && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text size="2" weight="medium">Usuario a eliminar:</Text>
            <div className="mt-2">
              <Text size="2"><strong>Nombre:</strong> {user.nombre} {user.apellido}</Text>
              <br />
              <Text size="2"><strong>Email:</strong> {user.email}</Text>
              <br />
              <Text size="2"><strong>Rol:</strong> {user.rol}</Text>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text size="2" color="red">{error}</Text>
          </div>
        )}

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button 
              variant="soft" 
              color="gray"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
          </Dialog.Close>
          <Button 
            color="red"
            onClick={handleDelete}
            disabled={isDeleting || isCurrentUser}
            className="cursor-pointer"
          >
            <Trash2 size={16} />
            {isDeleting ? "Eliminando..." : isCurrentUser ? "No disponible" : "Eliminar"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}