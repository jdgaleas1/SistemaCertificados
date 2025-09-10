"use client";

import { useState } from "react";
import { Dialog, Button, Flex, Text } from "@radix-ui/themes";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteUser } from "@/lib/api";

interface DeleteUserModalProps {
  open: boolean;
  user: any;
  onClose: () => void;
}

export default function DeleteUserModal({ open, user, onClose }: DeleteUserModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteUser(user.id);
      onClose();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setError(error.message || "Error al eliminar el usuario");
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
          Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este usuario?
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
            disabled={isDeleting}
            className="cursor-pointer"
          >
            <Trash2 size={16} />
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}