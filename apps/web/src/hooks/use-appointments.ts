import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/appointments.api";
import { toast } from "sonner";

interface UseAppointmentsParams {
  status?: string;
  doctorId?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useAppointments(params: UseAppointmentsParams = {}) {
  const { enabled = true, ...filters } = params;
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => api.listAppointments(filters),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: () => api.getAppointment(id),
    enabled: !!id,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked successfully!");
    },
    onError: () => {
      toast.error("Failed to book appointment. The slot may no longer be available.");
    },
  });
}

export function useConfirmAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.confirmAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment confirmed");
    },
    onError: () => toast.error("Failed to confirm appointment"),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.cancelAppointment(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
    },
    onError: () => toast.error("Failed to cancel appointment"),
  });
}

export function useCompleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.completeAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment marked as completed");
    },
    onError: () => toast.error("Failed to complete appointment"),
  });
}
