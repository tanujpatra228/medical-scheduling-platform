import { Stethoscope, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Doctor } from "@/types/api.types";

interface DoctorCardProps {
  doctor: Doctor;
  onClick?: () => void;
  selected?: boolean;
}

export function DoctorCard({ doctor, onClick, selected }: DoctorCardProps) {
  return (
    <Card
      className={`${onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""} ${selected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Dr. {doctor.user.firstName} {doctor.user.lastName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Stethoscope className="h-3.5 w-3.5" />
          {doctor.specialization}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {doctor.slotDurationMin} min appointments
        </div>
        <Badge variant="secondary" className="text-xs">
          {doctor.specialization}
        </Badge>
      </CardContent>
    </Card>
  );
}
