"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/layout/PageHeader";
import InscripcionesList from "@/components/inscripciones/InscripcionesList";

export default function InscripcionesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader 
          title="Gestión de Inscripciones"
          description="Administra las inscripciones de estudiantes en cursos"
        />
        
        <InscripcionesList />
      </div>
    </DashboardLayout>
  );
}