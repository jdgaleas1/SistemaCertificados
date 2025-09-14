"use client";

import { useState } from "react";
import { Button } from "@radix-ui/themes";

interface VariableSelectorProps {
  onInsertVariable: (variable: string) => void;
  disabled?: boolean;
}

const AVAILABLE_VARIABLES = [
  { key: "NOMBRE", label: "Nombre", description: "Nombre del estudiante" },
  { key: "APELLIDO", label: "Apellido", description: "Apellido del estudiante" },
  { key: "NOMBRE_COMPLETO", label: "Nombre Completo", description: "Nombre y apellido completo" },
  { key: "EMAIL", label: "Email", description: "Correo electrónico del estudiante" },
  { key: "CEDULA", label: "Cédula", description: "Número de cédula del estudiante" },
  { key: "CURSO", label: "Curso", description: "Nombre del curso" },
  { key: "FECHA", label: "Fecha", description: "Fecha actual" },
  { key: "INSTITUCION", label: "Institución", description: "Nombre de la institución" },
];

export default function VariableSelector({ onInsertVariable, disabled = false }: VariableSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = (variable: string) => {
    onInsertVariable(`{${variable}}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="1"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="cursor-pointer"
      >
        📝 Insertar Variable
      </Button>

      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel de variables */}
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-80 max-w-96">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-800">Variables Disponibles</h3>
              <p className="text-xs text-gray-600 mt-1">
                Selecciona una variable para insertarla en el texto
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {AVAILABLE_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => handleInsert(variable.key)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {variable.label}
                      </div>
                      <div className="text-xs text-gray-600">
                        {variable.description}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                      {`{${variable.key}}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-600">
                💡 Las variables se reemplazarán automáticamente con los datos del estudiante al enviar el certificado
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
