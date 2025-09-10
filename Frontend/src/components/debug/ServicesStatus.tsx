"use client";

import { useState } from "react";
import { Card, Text, Badge, Button, Flex, Heading } from "@radix-ui/themes";
import { CheckCircle2, XCircle, Loader2, Server } from "lucide-react";
import { useSession } from "next-auth/react";
import { api, cursosApi } from "@/lib/api";

type TestStatus = "idle" | "running" | "success" | "error";

interface ServiceCheck {
  key: string;
  name: string;
  healthUrl?: string; // absolute URL if provided
  protectedChecks?: Array<{
    name: string;
    call: () => Promise<any>;
  }>;
}

const SERVICES: ServiceCheck[] = [
  {
    key: "usuarios",
    name: "Usuarios API",
    healthUrl: (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001") + "/health",
    protectedChecks: [
      { name: "GET /usuarios", call: () => api.get("/usuarios") },
    ],
  },
  {
    key: "cursos",
    name: "Cursos API",
    healthUrl: (process.env.NEXT_PUBLIC_CURSOS_SERVICE_URL || "http://localhost:8002") + "/health",
    protectedChecks: [
      { name: "GET /cursos", call: () => cursosApi.get("/cursos") },
    ],
  },
  {
    key: "certificados",
    name: "Certificados API",
    healthUrl: (process.env.NEXT_PUBLIC_CERTIFICADOS_SERVICE_URL || "http://localhost:8003") + "/health",
  },
];

export default function ServicesStatus() {
  const { data: session } = useSession();
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>(
    Object.fromEntries(SERVICES.map((s) => [s.key, "idle"]))
  );
  const [details, setDetails] = useState<Record<string, string | null>>(
    Object.fromEntries(SERVICES.map((s) => [s.key, null]))
  );
  const [isRunning, setIsRunning] = useState(false);

  const runChecks = async () => {
    if (!session || session.user?.role !== "ADMIN") return;
    setIsRunning(true);
    for (const svc of SERVICES) {
      setStatuses((prev) => ({ ...prev, [svc.key]: "running" }));
      setDetails((prev) => ({ ...prev, [svc.key]: null }));
      try {
        // Health check
        if (svc.healthUrl) {
          const res = await fetch(svc.healthUrl);
          if (!res.ok) throw new Error(`Health HTTP ${res.status}`);
        }

        // Protected checks (if logged-in)
        if (session && svc.protectedChecks?.length) {
          for (const check of svc.protectedChecks) {
            await check.call();
          }
        }

        setStatuses((prev) => ({ ...prev, [svc.key]: "success" }));
      } catch (err: any) {
        setStatuses((prev) => ({ ...prev, [svc.key]: "error" }));
        setDetails((prev) => ({ ...prev, [svc.key]: err?.message || "Error desconocido" }));
      }
    }
    setIsRunning(false);
  };

  const getBadge = (status: TestStatus) => {
    switch (status) {
      case "success":
        return (
          <Badge color="green">
            <Flex align="center" gap="1">
              <CheckCircle2 size={14} /> OK
            </Flex>
          </Badge>
        );
      case "error":
        return (
          <Badge color="red">
            <Flex align="center" gap="1">
              <XCircle size={14} /> Error
            </Flex>
          </Badge>
        );
      case "running":
        return (
          <Badge color="yellow">
            <Flex align="center" gap="1">
              <Loader2 size={14} className="animate-spin" /> Verificando
            </Flex>
          </Badge>
        );
      default:
        return <Badge color="gray">Pendiente</Badge>;
    }
  };

  if (!session || session.user?.role !== "ADMIN") return null;

  return (
    <Card className="p-6 dashboard-card">
      <Flex justify="between" align="center" className="mb-4">
        <Heading size="4">Estado General de Servicios</Heading>
        <Button onClick={runChecks} disabled={isRunning} variant="soft">
          {isRunning ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Verificando
            </>
          ) : (
            <>Verificar servicios</>
          )}
        </Button>
      </Flex>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map((svc) => (
          <Card key={svc.key} className="p-4">
            <Flex justify="between" align="center">
              <Flex align="center" gap="2">
                <Server size={18} className="text-gray-600" />
                <Text weight="medium">{svc.name}</Text>
              </Flex>
              {getBadge(statuses[svc.key])}
            </Flex>
            {details[svc.key] && statuses[svc.key] === "error" && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <Text size="2" className="text-red-700">
                  {details[svc.key]}
                </Text>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
}


