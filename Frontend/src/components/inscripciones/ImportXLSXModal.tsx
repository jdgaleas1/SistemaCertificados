"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, Button, Select, Flex, Text } from "@radix-ui/themes";
import { X, Upload, Loader2, Download, FileSpreadsheet } from "lucide-react";
import { useSession } from "next-auth/react";
import { getCursos } from "@/lib/api";
import { Curso, CSVImportResponse } from "@/types/cursos";

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<CSVImportResponse>; 
}

export default function ImportCSVModal({ open, onClose, onImport }: ImportCSVModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchCursos();
      setSelectedCurso("");
      setSelectedFile(null);
      setImportResult(null);
    }
  }, [open]);

  const fetchCursos = async () => {
    try {
      const response = await getCursos({ activos: true });
      let cursosData = response.data || response;
      
      // Si es profesor, filtrar solo sus cursos
      if (session?.user?.role === "PROFESOR") {
        cursosData = cursosData.filter((curso: Curso) => curso.instructor_id === session.user.id);
      }
      setCursos(cursosData);
    } catch (error) {
      console.error("Error al cargar cursos:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        alert('Por favor seleccione un archivo Excel (.xlsx)');
        return;
      }
      setSelectedFile(file);
    }
  };

const handleImport = async () => {
  if (!selectedFile) {
    alert("Debe seleccionar un archivo Excel (.xlsx)");
    return;
  }
  const result = await onImport(selectedFile);  
}

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = '/templates/plantilla.xlsx';
    a.download = 'plantilla.xlsx';
    a.click();
  };

  const handleClose = () => {
    setSelectedCurso("");
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content maxWidth="600px">
        <Dialog.Title>
          Importar Estudiantes desde Excel (.xlsx)
        </Dialog.Title>

        <div className="space-y-4 mt-4">
          {!importResult ? (
            <>


              <div>
                <Text size="2" weight="medium" className="block mb-2">
                  Archivo Excel (.xlsx) *
                </Text>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div>
                      <FileSpreadsheet size={32} className="mx-auto text-green-600 mb-2" />
                      <Text weight="medium">{selectedFile.name}</Text>
                      <Text size="2" className="text-gray-500 block">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Text>
                      <Button
                        size="2"
                        variant="soft"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <Text className="block mb-2">
                        Haga clic para seleccionar un archivo Excel (.xlsx)
                      </Text>
                      <Button
                        size="2"
                        variant="soft"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text size="2" className="text-blue-700 block mb-2">
                  <strong>Formato del archivo Excel (.xlsx):</strong>
                </Text>
                <Text size="2" className="text-blue-600 block mb-2">
                  La plantilla contiene las columnas: email, nombres completos apellido, cedula
                </Text>
                <Button
                  size="1"
                  variant="soft"
                  color="blue"
                  onClick={downloadTemplate}
                >
                  <Download size={14} />
                  Descargar plantilla
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Text size="3" weight="bold" className="text-green-800 block mb-2">
                  ✅ Importación Completada
                </Text>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Text className="text-green-700">
                      <strong>Total procesados:</strong> {importResult.total_procesados}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-green-700">
                      <strong>Usuarios creados:</strong> {importResult.usuarios_creados}
                    </Text>
                  </div>
                  <div>
                    <Text className="text-green-700">
                      <strong>Inscripciones creadas:</strong> {importResult.inscripciones_creadas}
                    </Text>
                  </div>
                </div>
              </div>

              {importResult.exitosos.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <Text size="2" weight="medium" className="text-green-800 block mb-2">
                    Estudiantes procesados exitosamente:
                  </Text>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.exitosos.map((exitoso, index) => (
                      <Text key={index} size="1" className="text-green-700 block">
                        • {exitoso}
                      </Text>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <Text size="2" weight="medium" className="text-red-800 block mb-2">
                    Errores encontrados:
                  </Text>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errores.map((error, index) => (
                      <Text key={index} size="1" className="text-red-700 block">
                        • {error}
                      </Text>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Flex gap="3" justify="end" className="mt-6">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                <X size={16} />
                {importResult ? "Cerrar" : "Cancelar"}
              </Button>
            </Dialog.Close>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={loading || !selectedCurso || !selectedFile}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Importar
              </Button>
            )}
          </Flex>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}