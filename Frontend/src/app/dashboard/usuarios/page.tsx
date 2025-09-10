"use client";

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/layout/PageHeader";
import UsersList from "@/components/dashboard/UsersList";
import CreateUserModal from "@/components/users/CreateUserModal";
import EditUserModal from "@/components/users/EditUserModal";
import DeleteUserModal from "@/components/users/DeleteUserModal";
import ChangePasswordModal from "@/components/users/ChangePasswordModal";

export default function UsuariosPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateUser = () => {
    setCreateModalOpen(true);
  };

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

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setChangePasswordModalOpen(false);
    setSelectedUser(null);
    handleRefresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Gestión de Usuarios"
          description="Administra los usuarios del sistema"
        >
          <Button onClick={handleCreateUser} className="cursor-pointer">
            <Plus size={16} />
            Nuevo Usuario
          </Button>
        </PageHeader>

        <UsersList 
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onChangePassword={handleChangePassword}
          refreshTrigger={refreshTrigger}
        />

        {/* Modals */}
        <CreateUserModal 
          open={createModalOpen}
          onClose={handleModalClose}
        />
        
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
      </div>
    </DashboardLayout>
  );
}