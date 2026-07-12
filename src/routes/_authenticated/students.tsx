import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStudents, qkStudents, fetchPaymentsForMonth, qkPayments, logActivity } from "@/lib/hostel-queries";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { currency, dateLabel, monthKey } from "@/lib/format";
import { AdmissionDialog } from "@/components/hostel/AdmissionDialog";
import { CollectRentDialog } from "@/components/hostel/CollectRentDialog";
import { toast } from "sonner";
import { UserPlus, Search, Wallet, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const qc = useQueryClient();
  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });
  const { data: payments = [] } = useQuery({ queryKey: [...qkPayments, monthKey()], queryFn: () => fetchPaymentsForMonth(monthKey()) });
  const paidIds = useMemo(() => new Set(payments.map((p) => p.student_id)), [payments]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "vacated">("all");
  const [admitOpen, setAdmitOpen] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [rentStudentId, setRentStudentId] = useState<string | undefined>();

  const filtered = students.filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return [s.name, s.phone, s.cnic, s.rooms?.number].some((v) => v?.toLowerCase().includes(t));
  });

  async function del(s: any) {
    if (!confirm(`Delete ${s.name}? This removes all payment history.`)) return;
    const { error } = await supabase.from("students").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Student deleted");
    qc.invalidateQueries();
  }

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.filter((s: any) => s.status === "active").length} active · ${students.length} total`}
        actions={<Button onClick={() => setAdmitOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> New Admission</Button>}
      />

      <Card className="glass-card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, CNIC, room…" className="pl-9" />
          </div>
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            {(["all", "active", "vacated"] as const).map((v) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${statusFilter === v ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{v}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Room</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Rent</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => {
                const paid = paidIds.has(s.id);
                return (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-accent/30">
                    <td className="py-3 pr-3">
                      <button className="text-left font-medium hover:underline" onClick={() => setSelected(s)}>{s.name}</button>
                      <p className="text-xs text-muted-foreground">Since {dateLabel(s.admission_date)}</p>
                    </td>
                    <td className="py-3 pr-3">
                      {s.rooms ? `Room ${s.rooms.number} · Floor ${s.rooms.floor}` : <span className="text-muted-foreground">—</span>}
                      {s.seat_number ? <p className="text-xs text-muted-foreground">Seat {s.seat_number}</p> : null}
                    </td>
                    <td className="py-3 pr-3">{s.phone ?? "—"}</td>
                    <td className="py-3 pr-3">{currency(s.monthly_rent)}</td>
                    <td className="py-3 pr-3">
                      {s.status === "vacated" ? <Badge variant="secondary">Vacated</Badge>
                        : paid ? <Badge className="bg-success/15 text-success">Paid</Badge>
                        : <Badge className="bg-destructive/10 text-destructive">Pending</Badge>}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex justify-end gap-1">
                        {s.status === "active" && !paid && (
                          <Button size="sm" variant="outline" onClick={() => { setRentStudentId(s.id); setRentOpen(true); }}>
                            <Wallet className="mr-1 h-3.5 w-3.5" /> Collect
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => del(s)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>Student profile</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Phone" value={selected.phone} />
              <Field label="CNIC" value={selected.cnic} />
              <Field label="Father Name" value={selected.father_name} />
              <Field label="Emergency" value={selected.emergency_contact} />
              <Field label="University" value={selected.university} />
              <Field label="Department" value={selected.department} />
              <Field label="Room" value={selected.rooms ? `Room ${selected.rooms.number} · Seat ${selected.seat_number}` : "—"} />
              <Field label="Monthly Rent" value={currency(selected.monthly_rent)} />
              <Field label="Admitted" value={dateLabel(selected.admission_date)} />
              <Field label="Status" value={selected.status} />
              <div className="col-span-2"><Field label="Address" value={selected.address} /></div>
              <div className="col-span-2"><Field label="Notes" value={selected.notes} /></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AdmissionDialog open={admitOpen} onOpenChange={setAdmitOpen} />
      <CollectRentDialog
        open={rentOpen}
        onOpenChange={setRentOpen}
        students={students.filter((s: any) => s.status === "active").map((s: any) => ({ id: s.id, name: s.name, monthly_rent: Number(s.monthly_rent) }))}
        initialStudentId={rentStudentId}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}
