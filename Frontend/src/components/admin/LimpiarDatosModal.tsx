"use client";
import { useState } from "react";
import { Dialog, Flex, Text, Button, Checkbox, Card } from "@radix-ui/themes";
import { Trash2, AlertTriangle } from "lucide-react";
import { api, cursosApi } from "@/lib/api";

interface LimpiarDatosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function LimpiarDatosModal({ 
  open, 
  onOpenChange,
  onSuccess
}: LimpiarDatosModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [limpiarEstudiantes, setLimpiarEstudiantes] = useState(true);
  const [limpiarInscripciones, setLimpiarInscripciones] = useState(true);
  const [limpiarCursos, setLimpiarCursos] = useState(true);
  
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText === "CONFIRMAR";

  const handleLimpiarDatos = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let resultados = {
        estudiantes: 0,
        inscripciones: 0,
        cursos: 0
      };
      
      // Limpiar cursos e inscripciones
      if (limpiarInscripciones || limpiarCursos) {
        const cursoResponse = await cursosApi.post("/admin/limpiar-datos", {
          limpiar_inscripciones: limpiarInscripciones,
          limpiar_cursos: limpiarCursos
        });
        
        resultados.inscripciones = cursoResponse.data?.inscripciones_desactivadas || 0;
        resultados.cursos = cursoResponse.data?.cursos_desactivados || 0;
      }
      
      // Limpiar estudiantes
      if (limpiarEstudiantes) {
        const usuariosResponse = await api.post("/admin/limpiar-estudiantes");
        resultados.estudiantes = usuariosResponse.data?.estudiantes_desactivados || 0;
      }
      
      setSuccess(`Limpieza completada: ${resultados.estudiantes} estudiantes, ${resultados.inscripciones} inscripciones y ${resultados.cursos} cursos desactivados.`);
      
      // Notificar al componente padre
      onSuccess();
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onOpenChange(false);
        setConfirmText("");
      }, 2000);
      
    } catch (err: any) {
      console.error("Error al limpiar datos:", err);
      // Mejorar el mensaje de error para mostrar información más detallada
      let errorMessage = "Error al limpiar datos. Intente nuevamente.";
      
      if (err.response) {
        // Error de respuesta del servidor
        errorMessage = `Error del servidor: ${err.response.status} - ${err.response.data?.detail || err.response.statusText}`;
      } else if (err.request) {
        // Error de red (no se recibió respuesta)
        errorMessage = "Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.";
      } else {
        // Error en la configuración de la solicitud
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>Limpiar Datos del Sistema</Dialog.Title>
        
        <Card className="p-3 bg-amber-50 border-amber-200 mb-4">
          <Flex gap="2" align="center">
            <AlertTriangle size={18} className="text-amber-600" />
            <Text size="2" className="text-amber-800">
              Esta acción desactivará los datos seleccionados. Esta operación no se puede deshacer.
            </Text>
          </Flex>
        </Card>
        
        <div className="space-y-4 my-4">
          <Flex gap="2">
            <Checkbox 
              checked={limpiarEstudiantes} 
              onCheckedChange={(checked) => setLimpiarEstudiantes(checked as boolean)}
              id="estudiantes"
            />
            <Text as="label" htmlFor="estudiantes" size="2">
              Desactivar usuarios con rol de estudiante
            </Text>
          </Flex>
          
          <Flex gap="2">
            <Checkbox 
              checked={limpiarInscripciones} 
              onCheckedChange={(checked) => setLimpiarInscripciones(checked as boolean)}
              id="inscripciones"
            />
            <Text as="label" htmlFor="inscripciones" size="2">
              Desactivar todas las inscripciones
            </Text>
          </Flex>
          
          <Flex gap="2">
            <Checkbox 
              checked={limpiarCursos} 
              onCheckedChange={(checked) => setLimpiarCursos(checked as boolean)}
              id="cursos"
            />
            <Text as="label" htmlFor="cursos" size="2">
              Desactivar todos los cursos
            </Text>
          </Flex>
        </div>
        
        {error && (
          <Card className="p-3 bg-red-50 border-red-200 mb-4">
            <Text size="2" className="text-red-700">{error}</Text>
          </Card>
        )}
        
        {success && (
          <Card className="p-3 bg-green-50 border-green-200 mb-4">
            <Text size="2" className="text-green-700">{success}</Text>
          </Card>
        )}
        
        <div className="mt-4">
          <Text size="2" weight="medium" className="mb-2">
            Para confirmar, escriba "CONFIRMAR" en el campo de texto:
          </Text>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            placeholder="CONFIRMAR"
          />
        </div>
        
        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" disabled={loading}>
              Cancelar
            </Button>
          </Dialog.Close>
          <Button 
            color="red" 
            disabled={!isConfirmValid || loading || (!limpiarEstudiantes && !limpiarInscripciones && !limpiarCursos)}
            onClick={handleLimpiarDatos}
          >
            {loading ? "Limpiando..." : "Limpiar Datos"}
            <Trash2 size={16} />
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}