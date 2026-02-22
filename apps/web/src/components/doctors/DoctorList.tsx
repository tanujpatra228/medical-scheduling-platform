import type { Doctor } from "@/types/api.types";
import { DoctorCard } from "./DoctorCard";

interface DoctorListProps {
  doctors: Doctor[];
  onSelect?: (doctor: Doctor) => void;
  selectedId?: string;
}

export function DoctorList({ doctors, onSelect, selectedId }: DoctorListProps) {
  if (doctors.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No doctors available.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {doctors.map((doc) => (
        <DoctorCard
          key={doc.id}
          doctor={doc}
          onClick={onSelect ? () => onSelect(doc) : undefined}
          selected={doc.id === selectedId}
        />
      ))}
    </div>
  );
}
