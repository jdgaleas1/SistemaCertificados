"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, Heading, Text, Flex } from "@radix-ui/themes";
import { TrendingUp, Users, BookOpen, Award } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/layout/PageHeader";
import UsersList from "@/components/dashboard/UsersList";
import EditUserModal from "@/components/users/EditUserModal";
import DeleteUserModal from "@/components/users/DeleteUserModal";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";
import ServicesStatus from "@/components/debug/ServicesStatus";

function DashboardPage() {
  const { data: session } = useSession();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const getStatsForRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return [
          { title: "Total Usuarios", value: "156", icon: Users, color: "bg-blue-500" },
          { title: "Cursos Activos", value: "24", icon: BookOpen, color: "bg-green-500" },
          { title: "Certificados", value: "89", icon: Award, color: "bg-purple-500" },
          { title: "Crecimiento", value: "+12%", icon: TrendingUp, color: "bg-orange-500" },
        ];
      case "PROFESOR":
        return [
          { title: "Mis Cursos", value: "8", icon: BookOpen, color: "bg-blue-500" },
          { title: "Estudiantes", value: "45", icon: Users, color: "bg-green-500" },
          { title: "Certificados", value: "23", icon: Award, color: "bg-purple-500" },
        ];
      case "ESTUDIANTE":
        return [
          { title: "Cursos Inscritos", value: "3", icon: BookOpen, color: "bg-blue-500" },
          { title: "Completados", value: "1", icon: Award, color: "bg-green-500" },
          { title: "Progreso", value: "67%", icon: TrendingUp, color: "bg-purple-500" },
        ];
      default:
        return [];
    }
  };

  const stats = getStatsForRole(session?.user?.role || "");

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleChangePassword = (user: any) => {
    setSelectedUser(user);
    setChangePasswordModalOpen(true);
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setChangePasswordModalOpen(false);
    setSelectedUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader 
          title="¡Bienvenido de vuelta!"
          description={`${session?.user?.name} • ${session?.user?.role}`}
        />

        {/* Stats Grid */}
        <div className="grid mobile-grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 dashboard-card stats-card cursor-pointer">
                <Flex align="center" gap="4">
                  <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <Text size="4" weight="bold" className="text-gray-900">
                      {stat.value}
                    </Text>
                    <Text size="2" className="text-gray-600 font-medium mt-1 block">
                      {stat.title}
                    </Text>
                  </div>
                </Flex>
              </Card>
            );
          })}
        </div>

        {/* Users List for Admin */}
        {session?.user?.role === "ADMIN" && (
          <div className="space-y-6">
            <ServicesStatus />
            <UsersList 
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onChangePassword={handleChangePassword}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <EditUserModal
        open={editModalOpen}
        user={selectedUser}
        onClose={handleModalClose}
      />
      
      <DeleteUserModal
        open={deleteModalOpen}
        user={selectedUser}
        onClose={handleModalClose}
      />
      
      <ChangePasswordModal
        open={changePasswordModalOpen}
        user={selectedUser}
        onClose={handleModalClose}
      />
    </DashboardLayout>
  );
}

export default DashboardPage;