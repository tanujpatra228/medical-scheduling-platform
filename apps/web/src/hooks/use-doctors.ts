import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/doctors.api";
import { toast } from "sonner";

export function useDoctors(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["doctors", page, limit],
    queryFn: () => api.listDoctors({ page, limit }),
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ["doctors", id],
    queryFn: () => api.getDoctor(id),
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDoctor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor created successfully!");
    },
    onError: () => toast.error("Failed to create doctor"),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...params }: api.UpdateDoctorParams & { id: string }) =>
      api.updateDoctor(id, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor updated successfully!");
    },
    onError: () => toast.error("Failed to update doctor"),
  });
}
