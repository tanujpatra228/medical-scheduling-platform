import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLE_LABELS } from "@/lib/constants";

export function Header() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h2 className="text-sm font-medium text-muted-foreground">
        {USER_ROLE_LABELS[user.role]} Portal
      </h2>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.firstName} {user.lastName}
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="mr-1 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
