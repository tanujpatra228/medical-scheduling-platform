import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "@/api/availability.api";

export function useAvailableSlots(
  doctorId: string,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ["slots", doctorId, from, to],
    queryFn: () => getAvailableSlots(doctorId, from, to),
    enabled: !!doctorId && !!from && !!to,
  });
}
