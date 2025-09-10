"use client";

import { useState, useEffect } from "react";
import { Dialog, Button, TextField, TextArea, Select, Flex, Text } from "@radix-ui/themes";
import { X, Save, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Curso, CursoCreate, CursoUpdate, RolUsuario } from "@/types/cursos";
import { getUsers } from "@/lib/api";

interface CursoModalProps {
  open: boolean;
  curso?: Curso | null;
  onClose: () => void;
  onSave: (data: CursoCreate | CursoUpdate) => Promise<void>;
}

interface Usuario {
  id: string;
  nombre_completo: string;
  rol: string;
}

export default function CursoModal({ open, curso, onClose, onSave }: CursoModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [profesores, setProfesores] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion: "",
    fecha_inicio: "",
    fecha_fin: "",
    instructor_id: "",
  });

  const isEditing = !!curso;

  useEffect(() => {
    if (open) {
      fetchProfesores();
      if (curso) {
        setFormData({
          nombre: curso.nombre,
          descripcion: curso.descripcion || "",
          duracion: curso.duracion?.toString() || "",
          fecha_inicio: curso.fecha_inicio ? curso.fecha_inicio.split('T')[0] : "",
          fecha_fin: curso.fecha_fin ? curso.fecha_fin.split('T')[0] : "",
          instructor_id: curso.instructor_id,
        });
      } else {
        // Si es profesor, auto-seleccionarse
        const defaultInstructorId = session?.user?.role === "PROFESOR" ? session.user.id : "";
        setFormData({
          nombre: "",
          descripcion: "",
          duracion: "",
          fecha_inicio: "",
          fecha_fin: "",
          instructor_id: defaultInstructorId,
        });
      }
    }
  }, [open, curso, session]);

  const fetchProfesores = async () => {
    try {
      const usuarios = await getUsers();
      const profesoresList = usuarios.filter((u: Usuario) => 
        u.rol === RolUsuario.PROFESOR || u.rol === RolUsuario.ADMIN
      );
      setProfesores(profesoresList);
    } catch (error) {
      console.error("Error al cargar profesores:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert("El nombre del curso es requerido");
      return;
    }

    if (!formData.instructor_id) {
      alert("Debe seleccionar un instructor");
      return;
    }

    setLoading(true);
    try {
      const data: CursoCreate | CursoUpdate = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        duracion: formData.duracion ? parseInt(formData.duracion) : undefined,
        fecha_inicio: formData.fecha_inicio || undefined,
        fecha_fin: formData.fecha_fin || undefined,
        instructor_id: formData.instructor_id,
      };

      await onSave(data);
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al guardar el curso");
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
          {isEditing ? "Editar Curso" : "Crear Nuevo Curso"}
        </Dialog.Title>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Text size="2" weight="medium" className="block mb-2">
              Nombre del Curso *
            </Text>
            <TextField.Root
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ingrese el nombre del curso"
              required
            />
          </div>

          <div>
            <Text size="2" weight="medium" className="block mb-2">
              Descripción
            </Text>
            <TextArea
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              placeholder="Descripción del curso (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size="2" weight="medium" className="block mb-2">
                Duración (horas)
              </Text>
              <TextField.Root
                type="number"
                value={formData.duracion}
                onChange={(e) => handleChange("duracion", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <Text size="2" weight="medium" className="block mb-2">
                Instructor *
              </Text>
              <Select.Root
                value={formData.instructor_id}
                onValueChange={(value) => handleChange("instructor_id", value)}
                disabled={session?.user?.role === "PROFESOR"}
              >
                <Select.Trigger placeholder="Seleccionar instructor" />
                <Select.Content>
                  {profesores.map((profesor) => (
                    <Select.Item key={profesor.id} value={profesor.id}>
                      {profesor.nombre_completo}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size="2" weight="medium" className="block mb-2">
                Fecha de Inicio
              </Text>
              <TextField.Root
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange("fecha_inicio", e.target.value)}
              />
            </div>

            <div>
              <Text size="2" weight="medium" className="block mb-2">
                Fecha de Fin
              </Text>
              <TextField.Root
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => handleChange("fecha_fin", e.target.value)}
                min={formData.fecha_inicio}
              />
            </div>
          </div>

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
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}