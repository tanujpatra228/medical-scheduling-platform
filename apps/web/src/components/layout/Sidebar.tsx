import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  Home,
  Stethoscope,
  Users,
  UserPlus,
  Clock,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/context/sidebar-context";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/types/api.types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  PATIENT: [
    { to: "/patient", label: "Dashboard", icon: Home },
    { to: "/patient/book", label: "Book Appointment", icon: CalendarPlus },
  ],
  DOCTOR: [
    { to: "/doctor", label: "Dashboard", icon: Home },
    { to: "/doctor/schedule", label: "Schedule", icon: Clock },
  ],
  CLINIC_ADMIN: [
    { to: "/admin", label: "Dashboard", icon: Home },
    { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/admin/doctors/new", label: "Add Doctor", icon: UserPlus },
  ],
};

export function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, toggle } = useSidebar();

  if (!user) return null;

  const items = NAV_ITEMS[user.role];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
        {!isCollapsed && (
          <span className="ml-2 font-semibold">MedScheduler</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && item.label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="p-3">
        <button
          onClick={toggle}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            isCollapsed ? "justify-center" : "gap-3",
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center px-3 py-2",
            isCollapsed ? "justify-center" : "gap-2",
          )}
          title={isCollapsed ? `${user.firstName} ${user.lastName}` : undefined}
        >
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground">
              <span className="block font-medium text-foreground">
                {user.firstName} {user.lastName}
              </span>
              {user.role.replace("_", " ")}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
