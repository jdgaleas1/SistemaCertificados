"use client";

import { useState, useEffect } from "react";
import { Card, Text, Badge, Button, Flex } from "@radix-ui/themes";

export default function BackendStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkBackendHealth = async () => {
    setStatus("checking");
    try {
      const response = await fetch("http://localhost:8001/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch (error) {
      console.error("Backend health check failed:", error);
      setStatus("offline");
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendHealth();
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "online": return "green";
      case "offline": return "red";
      case "checking": return "yellow";
      default: return "gray";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online": return "Conectado";
      case "offline": return "Desconectado";
      case "checking": return "Verificando...";
      default: return "Desconocido";
    }
  };

  return (
    <Card size="2" className="mb-4">
      <Flex justify="between" align="center">
        <div>
          <Text size="2" weight="medium">Estado del Backend:</Text>
          <Badge color={getStatusColor()} className="ml-2">
            {getStatusText()}
          </Badge>
        </div>
        <div className="text-right">
          <Button size="1" onClick={checkBackendHealth} disabled={status === "checking"}>
            Verificar
          </Button>
          {lastCheck && (
            <Text size="1" className="block text-gray-500 mt-1">
              Última verificación: {lastCheck.toLocaleTimeString()}
            </Text>
          )}
        </div>
      </Flex>
      
      {status === "offline" && (
        <Text size="2" className="text-red-600 mt-2 block">
          ⚠️ El backend no está disponible. Ejecuta: <code>cd Backend && docker-compose up -d</code>
        </Text>
      )}
    </Card>
  );
}