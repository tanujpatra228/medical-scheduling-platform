import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "@/api/availability.api";

export function useAvailability(
  doctorId: string,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ["availability", doctorId, from, to],
    queryFn: () => getAvailableSlots(doctorId, from, to),
    enabled: !!doctorId && !!from && !!to,
  });
}
