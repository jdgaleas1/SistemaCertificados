"use client";
import { useState, useEffect } from "react";
import { Dialog, Flex, Table, Text, Button, Badge } from "@radix-ui/themes";
import { cursosApi } from "@/lib/api";

interface Estudiante {
  inscripcion_id: string;
  estudiante_id: string;
  nombre_completo: string;
  email: string;
  cedula: string;
  fecha_inscripcion: string;
  completado: boolean;
}

interface EstudiantesModalProps {
  cursoId: string;
  cursoNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EstudiantesModal({ 
  cursoId, 
  cursoNombre, 
  open, 
  onOpenChange 
}: EstudiantesModalProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchEstudiantes();
    }
  }, [open, cursoId]);

  const fetchEstudiantes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cursosApi.get(`/cursos/${cursoId}/estudiantes`);
      
      // Log the entire response object to debug
      console.log("Respuesta API completa:", response);
      
      // Check if the data is in the expected format
      if (response && response.data && Array.isArray(response.data.estudiantes)) {
        setEstudiantes(response.data.estudiantes);
      } else if (response && Array.isArray(response)) {
        // Sometimes the API client might unwrap the response
        setEstudiantes(response);
      } else if (response && Array.isArray(response.estudiantes)) {
        // Another possible structure
        setEstudiantes(response.estudiantes);
      } else {
        console.error("Estructura de respuesta inesperada:", response);
        setEstudiantes([]);
      }
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
      setError("No se pudieron cargar los estudiantes. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 700 }}>
        <Dialog.Title>Estudiantes Inscritos</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Curso: {cursoNombre}
        </Dialog.Description>

        {loading ? (
          <Flex justify="center" py="4">
            <Text>Cargando estudiantes...</Text>
          </Flex>
        ) : error ? (
          <Flex direction="column" gap="2" align="center" py="4">
            <Text color="red">{error}</Text>
            <Button onClick={fetchEstudiantes}>Reintentar</Button>
          </Flex>
        ) : estudiantes.length === 0 ? (
          <Flex justify="center" py="4">
            <Text>No hay estudiantes inscritos en este curso.</Text>
          </Flex>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Nombre</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Cédula</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Fecha Inscripción</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {estudiantes.map((estudiante) => (
                <Table.Row key={estudiante.inscripcion_id}>
                  <Table.Cell>{estudiante.nombre_completo}</Table.Cell>
                  <Table.Cell>{estudiante.cedula}</Table.Cell>
                  <Table.Cell>{estudiante.email}</Table.Cell>
                  <Table.Cell>
                    {new Date(estudiante.fecha_inscripcion).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={estudiante.completado ? "green" : "blue"}>
                      {estudiante.completado ? "Completado" : "En curso"}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft">Cerrar</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}