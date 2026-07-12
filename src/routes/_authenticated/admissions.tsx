import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchStudents, qkStudents } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AdmissionDialog } from "@/components/hostel/AdmissionDialog";
import { currency, dateLabel } from "@/lib/format";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admissions")({ component: AdmissionsPage });

function AdmissionsPage() {
  const [open, setOpen] = useState(false);
  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });
  const recent = students.slice(0, 20);

  return (
    <div>
      <PageHeader
        title="Admissions"
        description="Quickly admit a new student into an available seat."
        actions={<Button size="lg" onClick={() => setOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> New Admission</Button>}
      />

      <Card className="glass-card p-6">
        <div
          className="cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition hover:border-primary hover:bg-accent/40"
          onClick={() => setOpen(true)}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <UserPlus className="h-8 w-8" />
          </div>
          <p className="mt-4 text-lg font-semibold">Admit a New Student</p>
          <p className="mt-1 text-sm text-muted-foreground">Only rooms with free seats will be shown. Seat assignment is automatic.</p>
        </div>
      </Card>

      <h3 className="mt-8 mb-3 text-lg font-semibold">Recent Admissions</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((s: any) => (
          <Card key={s.id} className="glass-card p-4">
            <p className="font-semibold">{s.name}</p>
            <p className="text-xs text-muted-foreground">
              {s.rooms ? `Room ${s.rooms.number}, Seat ${s.seat_number}` : "—"} · {dateLabel(s.admission_date)}
            </p>
            <p className="mt-2 text-sm">{currency(s.monthly_rent)} <span className="text-xs text-muted-foreground">/ month</span></p>
          </Card>
        ))}
      </div>

      <AdmissionDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
