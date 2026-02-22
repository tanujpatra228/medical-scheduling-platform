import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateDoctor } from "@/hooks/use-doctors";

export function CreateDoctorPage() {
  const navigate = useNavigate();
  const createMutation = useCreateDoctor();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [slotDuration, setSlotDuration] = useState("30");
  const [maxDaily, setMaxDaily] = useState("20");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      firstName,
      lastName,
      email,
      password,
      phone: phone || undefined,
      specialization,
      slotDurationMin: Number(slotDuration),
      maxDailyAppointments: Number(maxDaily),
    });
    navigate("/admin/doctors");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/doctors")}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Doctors
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., General Medicine, Dermatology"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotDuration">
                  Slot Duration (minutes)
                </Label>
                <Input
                  id="slotDuration"
                  type="number"
                  min={15}
                  max={120}
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDaily">Max Daily Appointments</Label>
                <Input
                  id="maxDaily"
                  type="number"
                  min={1}
                  value={maxDaily}
                  onChange={(e) => setMaxDaily(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Doctor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
