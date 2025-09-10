"use client";

import { useState, useEffect } from "react";
import { Dialog, Button, Select, Flex, Text } from "@radix-ui/themes";
import { X, Save, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { getCursos, getUsers } from "@/lib/api";
import { Curso } from "@/types/cursos";

interface InscripcionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (cursoId: string, estudianteId: string) => Promise<void>;
}

interface Usuario {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
}

export default function InscripcionModal({ open, onClose, onSave }: InscripcionModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState({
    curso_id: "",
    estudiante_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
      setFormData({
        curso_id: "",
        estudiante_id: "",
      });
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Cargar cursos
      const cursosResponse = await getCursos({ activos: true });
      let cursosData = cursosResponse.data || cursosResponse;
      
      // Si es profesor, filtrar solo sus cursos
      if (session?.user?.role === "PROFESOR") {
        cursosData = cursosData.filter((curso: Curso) => curso.instructor_id === session.user.id);
      }
      setCursos(cursosData);

      // Cargar estudiantes
      const usuariosResponse = await getUsers();
      const estudiantesList = usuariosResponse.filter((u: Usuario) => u.rol === "ESTUDIANTE");
      setEstudiantes(estudiantesList);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.curso_id) {
      alert("Debe seleccionar un curso");
      return;
    }

    if (!formData.estudiante_id) {
      alert("Debe seleccionar un estudiante");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData.curso_id, formData.estudiante_id);
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al crear la inscripción");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>
          Nueva Inscripción
        </Dialog.Title>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Text size="2" weight="medium" className="block mb-2">
              Curso *
            </Text>
            <Select.Root
              value={formData.curso_id}
              onValueChange={(value) => handleChange("curso_id", value)}
            >
              <Select.Trigger placeholder="Seleccionar curso" />
              <Select.Content>
                {cursos.map((curso) => (
                  <Select.Item key={curso.id} value={curso.id}>
                    <div>
                      <Text weight="medium">{curso.nombre}</Text>
                      {curso.instructor_nombre && (
                        <Text size="1" className="text-gray-500 block">
                          Instructor: {curso.instructor_nombre}
                        </Text>
                      )}
                    </div>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          <div>
            <Text size="2" weight="medium" className="block mb-2">
              Estudiante *
            </Text>
            <Select.Root
              value={formData.estudiante_id}
              onValueChange={(value) => handleChange("estudiante_id", value)}
            >
              <Select.Trigger placeholder="Seleccionar estudiante" />
              <Select.Content>
                {estudiantes.map((estudiante) => (
                  <Select.Item key={estudiante.id} value={estudiante.id}>
                    <div>
                      <Text weight="medium">{estudiante.nombre_completo}</Text>
                      <Text size="1" className="text-gray-500 block">
                        {estudiante.email}
                      </Text>
                    </div>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>

          {formData.curso_id && formData.estudiante_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Text size="2" className="text-blue-700">
                <strong>Resumen:</strong> Se inscribirá al estudiante seleccionado en el curso seleccionado.
                La inscripción estará activa inmediatamente.
              </Text>
            </div>
          )}

          <Flex gap="3" justify="end" className="mt-6">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                <X size={16} />
                Cancelar
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Crear Inscripción
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}