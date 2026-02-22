import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/api/client";
import type { UserRole } from "@/types/api.types";

const ROLE_HOME: Record<UserRole, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  CLINIC_ADMIN: "/admin",
};

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully");
      // User state updates trigger re-render → Navigate above handles redirect
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">MedScheduler</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
