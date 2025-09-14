"use client";

import { useState } from "react";
import { Button, Card, Text, TextField } from "@radix-ui/themes";

interface CertificateTesterProps {
  templateId: string;
  onClose: () => void;
}

const SAMPLE_VARIABLES = {
  NOMBRE: "Juan",
  APELLIDO: "Pérez",
  NOMBRE_COMPLETO: "Juan Pérez",
  EMAIL: "juan.perez@email.com",
  CEDULA: "12345678",
  CURSO: "Desarrollo Web",
  FECHA: "15/12/2024",
  INSTITUCION: "Centro de Desarrollo Profesional CDP"
};

export default function CertificateTester({ templateId, onClose }: CertificateTesterProps) {
  const [variables, setVariables] = useState(SAMPLE_VARIABLES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { testGenerateCertificate } = await import('@/lib/api');
      const data = await testGenerateCertificate(templateId, variables);
      
      setResult(data);
      
      // Crear y descargar el PDF
      const pdfBlob = new Blob([
        Uint8Array.from(atob(data.pdf_base64), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-prueba-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const updateVariable = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Text size="5" weight="bold">Probar Certificado</Text>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          <div className="space-y-4">
            <Text size="3" color="gray">
              Ingresa valores de prueba para las variables del certificado:
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(variables).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {key.replace('_', ' ')}
                  </label>
                  <TextField.Root
                    value={value}
                    onChange={(e) => updateVariable(key, e.target.value)}
                    placeholder={`Valor para ${key}`}
                    size="2"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleTest} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Generando...' : 'Generar y Descargar PDF'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 rounded-lg border">
                {result.error ? (
                  <div className="text-red-600">
                    <Text size="3" weight="bold">Error:</Text>
                    <Text size="2">{result.error}</Text>
                  </div>
                ) : (
                  <div className="text-green-600">
                    <Text size="3" weight="bold">✅ Certificado generado exitosamente</Text>
                    <Text size="2" className="block mt-2">
                      El PDF se ha descargado automáticamente. 
                      Revisa que las variables se hayan reemplazado correctamente.
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
