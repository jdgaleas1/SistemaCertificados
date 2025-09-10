"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Users,
  BookOpen,
  UserCheck,
  FileText,
  Mail,
  LogOut,
  X,
  User,
} from "lucide-react";
import { Button, Text, Badge, Flex } from "@radix-ui/themes";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Usuarios",
    href: "/dashboard/usuarios",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    name: "Cursos",
    href: "/dashboard/cursos",
    icon: BookOpen,
    roles: ["ADMIN", "PROFESOR"],
  },
  {
    name: "Inscripciones",
    href: "/dashboard/inscripciones",
    icon: UserCheck,
  },
  {
    name: "Plant. Certificados",
    href: "/dashboard/certificados",
    icon: FileText,
    roles: ["ADMIN", "PROFESOR"],
  },
  {
    name: "Correos",
    href: "/dashboard/correos",
    icon: Mail,
    roles: ["ADMIN"],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, setIsOpen]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "red";
      case "PROFESOR":
        return "blue";
      case "ESTUDIANTE":
        return "green";
      default:
        return "gray";
    }
  };

  const canAccessMenuItem = (item: MenuItem) => {
    if (!item.roles) return true;
    return item.roles.includes(session?.user?.role || "");
  };

  const filteredMenuItems = menuItems.filter(canAccessMenuItem);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white shadow-2xl border-r border-gray-200 z-50
          sidebar-transition
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
          w-72 flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg">
                <FileText size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <Text size="2" weight="bold" className="text-gray-800">
                  Sistema CDP
                </Text>
                <Text size="2" className="text-gray-600">
                  Certificados Digitales
                </Text>
              </div>
            </div>
            {/* Close button for mobile */}
            <Button
              onClick={closeSidebar}
              variant="ghost"
              size="2"
              className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} className="text-gray-600" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        {session?.user && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <Flex align="center" gap="3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-full shadow-md">
                <User size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <Text
                  size="3"
                  weight="medium"
                  className="text-gray-800 truncate block"
                >
                  {session.user.name}
                </Text>
                <Text size="2" className="text-gray-500 truncate block mb-1">
                  {session.user.email}
                </Text>
                <Badge
                  color={getRoleBadgeColor(session.user.role)}
                  size="1"
                  className="font-medium"
                >
                  {session.user.role}
                </Badge>
              </div>
            </Flex>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto sidebar-scroll">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm"
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    transition-transform duration-200 group-hover:scale-110
                    ${isActive ? "text-white" : "text-gray-500"}
                  `}
                />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <Button
            onClick={handleLogout}
            variant="soft"
            color="red"
            className="w-full cursor-pointer font-medium hover:shadow-md transition-all duration-200"
            size="3"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
}
