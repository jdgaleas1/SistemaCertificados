"use client";

import { useState } from "react";
import { Dialog, Button, Flex, Text } from "@radix-ui/themes";
import { Trash2, X, Loader2 } from "lucide-react";
import { Curso } from "@/types/cursos";

interface DeleteCursoModalProps {
  open: boolean;
  curso: Curso | null;
  onClose: () => void;
  onConfirm: (cursoId: string) => Promise<void>;
}

export default function DeleteCursoModal({
  open,
  curso,
  onClose,
  onConfirm,
}: DeleteCursoModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!curso) return;

    setLoading(true);
    try {
      await onConfirm(curso.id);
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al eliminar el curso");
    } finally {
      setLoading(false);
    }
  };

  if (!curso) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title className="text-red-600">
          <Flex align="center" gap="2">
            <Trash2 size={20} />
            Eliminar Curso
          </Flex>
        </Dialog.Title>

        <div className="mt-4 space-y-4">
          <Text size="3">
            ¿Está seguro que desea eliminar el curso{" "}
            <strong>"{curso.nombre}"</strong>?
          </Text>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text size="2" className="text-red-700">
              <strong>Advertencia:</strong> Esta acción desactivará el curso y no se podrá deshacer.
              Los estudiantes inscritos no podrán acceder al contenido.
            </Text>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <Text size="2" className="text-gray-600">
              <strong>Curso:</strong> {curso.nombre}
            </Text>
            {curso.instructor_nombre && (
              <Text size="2" className="text-gray-600">
                <strong>Instructor:</strong> {curso.instructor_nombre}
              </Text>
            )}
            {curso.duracion && (
              <Text size="2" className="text-gray-600">
                <strong>Duración:</strong> {curso.duracion} horas
              </Text>
            )}
          </div>
        </div>

        <Flex gap="3" justify="end" className="mt-6">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={loading}>
              <X size={16} />
              Cancelar
            </Button>
          </Dialog.Close>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Eliminar Curso
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}