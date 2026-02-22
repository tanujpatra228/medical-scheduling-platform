import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAvailableSlots } from "@/hooks/use-slots";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Slot } from "@/types/api.types";

interface SlotPickerProps {
  doctorId: string;
  onSelect: (slot: Slot) => void;
  selectedSlot?: Slot | null;
}

export function SlotPicker({ doctorId, onSelect, selectedSlot }: SlotPickerProps) {
  const [baseDate, setBaseDate] = useState(() => startOfDay(new Date()));

  const from = baseDate.toISOString();
  const to = addDays(baseDate, 5).toISOString();

  const { data, isLoading } = useAvailableSlots(doctorId, from, to);

  const slots = data?.data ?? [];
  const availableSlots = slots.filter((s) => s.isAvailable);

  // Group slots by date
  const slotsByDate = new Map<string, Slot[]>();
  for (const slot of availableSlots) {
    const dateKey = format(new Date(slot.startsAt), "yyyy-MM-dd");
    if (!slotsByDate.has(dateKey)) slotsByDate.set(dateKey, []);
    slotsByDate.get(dateKey)!.push(slot);
  }

  // Generate 5-day range for display
  const days = Array.from({ length: 5 }, (_, i) => addDays(baseDate, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBaseDate((d) => addDays(d, -5))}
          disabled={startOfDay(baseDate) <= startOfDay(new Date())}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(baseDate, "MMM d")} – {format(addDays(baseDate, 4), "MMM d, yyyy")}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBaseDate((d) => addDays(d, 5))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const daySlots = slotsByDate.get(key) ?? [];

            return (
              <div key={key} className="space-y-2">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p className="text-sm font-semibold">{format(day, "MMM d")}</p>
                </div>
                <div className="space-y-1">
                  {daySlots.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      No slots
                    </p>
                  ) : (
                    daySlots.map((slot) => {
                      const isSelected =
                        selectedSlot?.startsAt === slot.startsAt;
                      return (
                        <Button
                          key={slot.startsAt}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={cn("w-full text-xs")}
                          onClick={() => onSelect(slot)}
                        >
                          {format(new Date(slot.startsAt), "HH:mm")}
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
