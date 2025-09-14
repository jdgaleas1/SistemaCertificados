'use client';

import Link from 'next/link';
import { Mail, Users, Send, Settings } from 'lucide-react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CertificadosServiceStatus from "@/components/debug/CertificadosServiceStatus";

export default function CorreosPage() {
  const opciones = [
    {
      titulo: 'Plantillas de Email',
      descripcion: 'Gestiona las plantillas HTML para el envío de correos masivos',
      icono: Settings,
      href: '/dashboard/correos/plantillas',
      color: 'blue'
    },
    {
      titulo: 'Envío Masivo',
      descripcion: 'Envía correos masivos a todos los estudiantes de un curso',
      icono: Users,
      href: '/dashboard/correos/masivo',
      color: 'green'
    },
    {
      titulo: 'Envío Individual',
      descripcion: 'Envía un correo personalizado a un estudiante específico',
      icono: Send,
      href: '/dashboard/correos/individual',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          icon: 'bg-blue-100 text-blue-600',
          hover: 'hover:bg-blue-100',
          border: 'border-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          icon: 'bg-green-100 text-green-600',
          hover: 'hover:bg-green-100',
          border: 'border-green-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          icon: 'bg-purple-100 text-purple-600',
          hover: 'hover:bg-purple-100',
          border: 'border-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          icon: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-gray-100',
          border: 'border-gray-200'
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Correos
              </h1>
              <p className="text-gray-600">
                Administra el envío de correos masivos e individuales
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opciones.map((opcion) => {
            const Icono = opcion.icono;
            const colors = getColorClasses(opcion.color);
            
            return (
              <Link
                key={opcion.href}
                href={opcion.href}
                className={`group block p-6 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.hover} transition-all duration-200 hover:shadow-lg hover:scale-105`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${colors.icon} group-hover:scale-110 transition-transform duration-200`}>
                    <Icono className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {opcion.titulo}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {opcion.descripcion}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
                  <span>Acceder</span>
                  <svg 
                    className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sistema de Correos Integrado
              </h3>
              <p className="text-gray-700 mb-4">
                Nuestro sistema de correos te permite enviar comunicaciones personalizadas 
                a estudiantes de manera masiva o individual, con plantillas HTML personalizables 
                y adjuntos de certificados.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Envío por lotes configurable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Plantillas HTML personalizables</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Adjuntos de certificados automáticos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Section */}
        <div className="mt-8">
          <CertificadosServiceStatus />
        </div>
      </div>
    </DashboardLayout>
  );
}