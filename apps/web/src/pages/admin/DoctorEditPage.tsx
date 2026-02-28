import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useDoctor, useUpdateDoctor } from "@/hooks/use-doctors";

export function DoctorEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useDoctor(id!);
  const updateMutation = useUpdateDoctor();

  const doctor = data?.data;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [slotDuration, setSlotDuration] = useState("");
  const [maxDaily, setMaxDaily] = useState("");

  useEffect(() => {
    if (doctor) {
      setFirstName(doctor.user.firstName);
      setLastName(doctor.user.lastName);
      setPhone(doctor.user.phone ?? "");
      setSpecialization(doctor.specialization);
      setSlotDuration(String(doctor.slotDurationMin));
      setMaxDaily(String(doctor.maxDailyAppointments ?? ""));
    }
  }, [doctor]);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading doctor...</p>;
  }

  if (!doctor) {
    return <p className="text-destructive">Doctor not found.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id: id!,
      firstName,
      lastName,
      phone: phone || undefined,
      specialization,
      slotDurationMin: Number(slotDuration),
      maxDailyAppointments: maxDaily ? Number(maxDaily) : undefined,
    });
    navigate(`/admin/doctors/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/doctors/${id}`)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Doctor
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Doctor</CardTitle>
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
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
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
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
