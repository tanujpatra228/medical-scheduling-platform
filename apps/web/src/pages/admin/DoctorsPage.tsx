import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useDoctors } from "@/hooks/use-doctors";

export function AdminDoctorsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDoctors(page, 20);

  const doctors = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <Button onClick={() => navigate("/admin/doctors/new")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : doctors.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No doctors registered yet.
        </p>
      ) : (
        <div className="space-y-3">
          {doctors.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium">
                    Dr. {doc.user.firstName} {doc.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {doc.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{doc.specialization}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {doc.slotDurationMin} min slots
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
