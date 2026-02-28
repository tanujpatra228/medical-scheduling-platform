import { useCallback, useMemo, useState } from "react";

export interface AppointmentFilters {
  status: string;
  fromDate: string;
  toDate: string;
  doctorId: string;
}

const EMPTY_FILTERS: AppointmentFilters = {
  status: "",
  fromDate: "",
  toDate: "",
  doctorId: "",
};

export function useAppointmentFilters(defaults?: Partial<AppointmentFilters>) {
  const initial = useMemo(
    () => ({ ...EMPTY_FILTERS, ...defaults }),
    // Only compute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [filters, setFilters] = useState<AppointmentFilters>(initial);

  const resetFilters = useCallback(() => setFilters(initial), [initial]);

  const queryParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      status: filters.status || undefined,
      fromDate: filters.fromDate
        ? new Date(filters.fromDate).toISOString()
        : undefined,
      toDate: filters.toDate
        ? new Date(filters.toDate + "T23:59:59.999").toISOString()
        : undefined,
      doctorId: filters.doctorId || undefined,
    };
    return params;
  }, [filters]);

  return { filters, setFilters, resetFilters, queryParams };
}
