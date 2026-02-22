import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  Home,
  Stethoscope,
  Users,
  UserPlus,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
  if (!user) return null;

  const items = NAV_ITEMS[user.role];

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <CalendarDays className="mr-2 h-5 w-5 text-primary" />
        <span className="font-semibold">MedScheduler</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              {user.firstName} {user.lastName}
            </span>
            {user.role.replace("_", " ")}
          </div>
        </div>
      </div>
    </aside>
  );
}
