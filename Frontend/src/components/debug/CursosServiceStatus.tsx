"use client";

import { useState, useEffect } from "react";
import { Card, Text, Badge, Button, Flex, Heading } from "@radix-ui/themes";
import { useSession } from "next-auth/react";
import { api, cursosApi } from "@/lib/api";

interface ServiceTest {
  name: string;
  endpoint: string;
  method: string;
  requiresAuth: boolean;
  status: "pending" | "success" | "error";
  response?: any;
  error?: string;
}

export default function CursosServiceStatus() {
  const { data: session } = useSession();
  const [tests, setTests] = useState<ServiceTest[]>([
    {
      name: "Health Check - Cursos Service",
      endpoint: "/health",
      method: "GET",
      requiresAuth: false,
      status: "pending"
    },
    {
      name: "Health Check - Usuarios Service", 
      endpoint: "/health-usuarios",
      method: "GET",
      requiresAuth: false,
      status: "pending"
    },
    {
      name: "Listar Cursos",
      endpoint: "/cursos",
      method: "GET", 
      requiresAuth: true,
      status: "pending"
    },
    {
      name: "Listar Usuarios (para instructores)",
      endpoint: "/usuarios",
      method: "GET",
      requiresAuth: true,
      status: "pending"
    }
  ]);

  const runTest = async (test: ServiceTest) => {
    setTests(prev => prev.map(t => 
      t.name === test.name ? { ...t, status: "pending" } : t
    ));

    try {
      let response: any;
      
      if (test.endpoint === "/health") {
        // Health check del servicio de cursos
        response = await fetch("http://localhost:8002/health");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        response = await response.json();
      } else if (test.endpoint === "/health-usuarios") {
        // Health check del servicio de usuarios
        response = await fetch("http://localhost:8001/health");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        response = await response.json();
      } else if (test.endpoint === "/cursos") {
        // Usar la API de cursos
        response = await cursosApi.get(test.endpoint);
      } else {
        // Usar la función api que maneja autenticación (usuarios)
        if (test.method === "GET") {
          response = await api.get(test.endpoint);
        }
      }

      setTests(prev => prev.map(t => 
        t.name === test.name ? { 
          ...t, 
          status: "success", 
          response: response,
          error: undefined 
        } : t
      ));

    } catch (error: any) {
      console.error(`Test ${test.name} failed:`, error);
      setTests(prev => prev.map(t => 
        t.name === test.name ? { 
          ...t, 
          status: "error", 
          error: error.message || "Error desconocido",
          response: undefined 
        } : t
      ));
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      if (!test.requiresAuth || session) {
        await runTest(test);
        // Pequeña pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  useEffect(() => {
    if (session) {
      runAllTests();
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "green";
      case "error": return "red";
      case "pending": return "yellow";
      default: return "gray";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success": return "✅ OK";
      case "error": return "❌ Error";
      case "pending": return "⏳ Probando...";
      default: return "⚪ Pendiente";
    }
  };

  return (
    <Card className="p-6">
      <Flex justify="between" align="center" className="mb-4">
        <Heading size="4">Estado del Servicio de Cursos</Heading>
        <Button onClick={runAllTests} disabled={!session}>
          Probar Conexiones
        </Button>
      </Flex>

      {!session && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Text size="2" className="text-yellow-700">
            ⚠️ Necesitas estar autenticado para probar los endpoints protegidos
          </Text>
        </div>
      )}

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={index} className="p-4">
            <Flex justify="between" align="center" className="mb-2">
              <div>
                <Text weight="medium">{test.name}</Text>
                <Text size="2" className="text-gray-500 block">
                  {test.method} {test.endpoint}
                  {test.requiresAuth && " (requiere auth)"}
                </Text>
              </div>
              <div className="text-right">
                <Badge color={getStatusColor(test.status)}>
                  {getStatusText(test.status)}
                </Badge>
                <Button 
                  size="1" 
                  variant="soft" 
                  className="ml-2"
                  onClick={() => runTest(test)}
                  disabled={test.requiresAuth && !session}
                >
                  Probar
                </Button>
              </div>
            </Flex>

            {test.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <Text size="2" className="text-red-700">
                  <strong>Error:</strong> {test.error}
                </Text>
              </div>
            )}

            {test.response && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <Text size="2" className="text-green-700">
                  <strong>Respuesta:</strong>
                </Text>
                <pre className="text-xs mt-1 overflow-x-auto">
                  {JSON.stringify(test.response, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Text size="2" className="text-blue-700">
          <strong>Información de Debug:</strong>
        </Text>
        <div className="mt-2 space-y-1">
          <Text size="2" className="text-blue-600 block">
            • Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001"}
          </Text>
          <Text size="2" className="text-blue-600 block">
            • Usuario: {session?.user?.email || "No autenticado"}
          </Text>
          <Text size="2" className="text-blue-600 block">
            • Rol: {session?.user?.role || "N/A"}
          </Text>
          <Text size="2" className="text-blue-600 block">
            • Token: {session?.accessToken ? "Presente" : "Ausente"}
          </Text>
        </div>
      </div>
    </Card>
  );
}