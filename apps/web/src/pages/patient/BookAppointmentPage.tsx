import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DoctorList } from "@/components/doctors/DoctorList";
import { SlotPicker } from "@/components/appointments/SlotPicker";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useDoctors } from "@/hooks/use-doctors";
import { useBookAppointment } from "@/hooks/use-appointments";
import type { Doctor, Slot } from "@/types/api.types";

type Step = "doctor" | "slot" | "confirm";

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const { data: docsData, isLoading: docsLoading } = useDoctors(1, 100);
  const bookMutation = useBookAppointment();

  const [step, setStep] = useState<Step>("doctor");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");

  const doctors = docsData?.data ?? [];

  function handleDoctorSelect(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setStep("slot");
  }

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!selectedDoctor || !selectedSlot) return;

    await bookMutation.mutateAsync({
      doctorId: selectedDoctor.id,
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,
      reason: reason || undefined,
    });
    navigate("/patient");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book an Appointment</h1>
        <p className="text-muted-foreground">
          {step === "doctor" && "Select a doctor"}
          {step === "slot" && "Pick an available time slot"}
          {step === "confirm" && "Review and confirm your booking"}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {(["doctor", "slot", "confirm"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              (["doctor", "slot", "confirm"] as Step[]).indexOf(step) >= i
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Doctor */}
      {step === "doctor" && (
        docsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <DoctorList
            doctors={doctors}
            onSelect={handleDoctorSelect}
            selectedId={selectedDoctor?.id}
          />
        )
      )}

      {/* Step 2: Slot */}
      {step === "slot" && selectedDoctor && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep("doctor")}>
            &larr; Change doctor
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>
                Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
              </CardTitle>
              <CardDescription>
                {selectedDoctor.specialization} &middot;{" "}
                {selectedDoctor.slotDurationMin} min slots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SlotPicker
                doctorId={selectedDoctor.id}
                onSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && selectedDoctor && selectedSlot && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep("slot")}>
            &larr; Change time
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Confirm Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Doctor</span>
                  <p className="font-medium">
                    Dr. {selectedDoctor.user.firstName}{" "}
                    {selectedDoctor.user.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Specialization</span>
                  <p className="font-medium">{selectedDoctor.specialization}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">
                    {format(new Date(selectedSlot.startsAt), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium">
                    {format(new Date(selectedSlot.startsAt), "HH:mm")} –{" "}
                    {format(new Date(selectedSlot.endsAt), "HH:mm")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for visit (optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your reason for the visit..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={bookMutation.isPending}
              >
                {bookMutation.isPending
                  ? "Booking..."
                  : "Confirm Appointment"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
