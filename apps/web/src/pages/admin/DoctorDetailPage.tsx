import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDoctor } from "@/hooks/use-doctors";

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useDoctor(id!);

  const doctor = data?.data;

  if (isLoading) {
    return <p className="text-muted-foreground">Loading doctor...</p>;
  }

  if (!doctor) {
    return <p className="text-destructive">Doctor not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/doctors")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Doctors
        </Button>
        <Button onClick={() => navigate(`/admin/doctors/${id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {doctor.user.firstName} {doctor.user.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <DetailRow label="First Name" value={doctor.user.firstName} />
            <DetailRow label="Last Name" value={doctor.user.lastName} />
            <DetailRow label="Email" value={doctor.user.email} />
            <DetailRow label="Phone" value={doctor.user.phone} />
            <DetailRow label="Specialization" value={doctor.specialization} />
            <DetailRow label="Slot Duration" value={`${doctor.slotDurationMin} min`} />
            <DetailRow label="Max Daily Appointments" value={doctor.maxDailyAppointments} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
