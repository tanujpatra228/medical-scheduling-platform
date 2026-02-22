import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAppointments } from "@/hooks/use-appointments";

export function DoctorSchedulePage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { data, isLoading } = useAppointments({
    fromDate: weekStart.toISOString(),
    toDate: weekEnd.toISOString(),
    limit: 100,
  });

  const appointments = data?.data ?? [];

  // Group by day
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const aptsByDay = new Map<string, typeof appointments>();
  for (const apt of appointments) {
    const key = format(new Date(apt.startsAt), "yyyy-MM-dd");
    if (!aptsByDay.has(key)) aptsByDay.set(key, []);
    aptsByDay.get(key)!.push(apt);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayApts = (aptsByDay.get(key) ?? []).sort((a, b) =>
              a.startsAt.localeCompare(b.startsAt),
            );
            const isToday =
              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div key={key} className="space-y-2">
                <div
                  className={`rounded-md p-2 text-center ${
                    isToday ? "bg-primary/10" : ""
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      isToday ? "text-primary" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayApts.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      —
                    </p>
                  ) : (
                    dayApts.map((apt) => (
                      <Card
                        key={apt.id}
                        className="cursor-pointer hover:shadow-sm"
                        onClick={() =>
                          navigate(`/doctor/appointments/${apt.id}`)
                        }
                      >
                        <CardContent className="p-2">
                          <p className="text-xs font-medium">
                            {format(new Date(apt.startsAt), "HH:mm")}
                          </p>
                          <AppointmentStatusBadge status={apt.status} />
                        </CardContent>
                      </Card>
                    ))
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
