"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/layout/PageHeader";
import CursosList from "@/components/cursos/CursosList";
import CursosServiceStatus from "@/components/debug/CursosServiceStatus";

export default function CursosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader 
          title="Gestión de Cursos"
          description="Administra los cursos del sistema"
        />
        
        {/* Componente de debug - remover en producción 
        <CursosServiceStatus />
        */}
        
        <CursosList />
      </div>
    </DashboardLayout>
  );
}