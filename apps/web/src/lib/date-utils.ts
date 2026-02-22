import { format } from "date-fns";

export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${format(new Date(startsAt), "HH:mm")} \u2013 ${format(new Date(endsAt), "HH:mm")}`;
}
