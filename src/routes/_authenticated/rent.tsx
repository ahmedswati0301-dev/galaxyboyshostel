import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchStudents, qkStudents, fetchPaymentsForMonth, qkPayments } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { CollectRentDialog } from "@/components/hostel/CollectRentDialog";
import { currency, monthKey, dateLabel } from "@/lib/format";
import { Wallet, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rent")({ component: RentPage });

function RentPage() {
  const [month, setMonth] = useState(monthKey().slice(0, 7));
  const monthISO = `${month}-01`;
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | undefined>();
  const [q, setQ] = useState("");

  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });
  const { data: payments = [] } = useQuery({ queryKey: [...qkPayments, monthISO], queryFn: () => fetchPaymentsForMonth(monthISO) });

  const paidIds = useMemo(() => new Set(payments.map((p) => p.student_id)), [payments]);
  const active = students.filter((s: any) => s.status === "active");
  const filtered = active.filter((s: any) => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Rent Collection"
        description="Record payments and see who's paid this month."
        actions={<Button onClick={() => { setStudentId(undefined); setOpen(true); }}><Wallet className="mr-2 h-4 w-4" /> Collect Rent</Button>}
      />

      <Card className="glass-card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="mr-2 text-xs font-medium text-muted-foreground">Month</label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="inline-flex w-auto" />
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="pl-9" />
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Student</th>
                <th className="py-2 pr-3">Room</th>
                <th className="py-2 pr-3">Rent</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Paid</th>
                <th className="py-2 pr-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => {
                const pay = payments.find((p) => p.student_id === s.id);
                const paid = !!pay;
                return (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 font-medium">{s.name}</td>
                    <td className="py-3 pr-3">{s.rooms ? `Room ${s.rooms.number} · F${s.rooms.floor}` : "—"}</td>
                    <td className="py-3 pr-3">{currency(s.monthly_rent)}</td>
                    <td className="py-3 pr-3">
                      {paid ? <Badge className="bg-success/15 text-success">Paid</Badge> : <Badge className="bg-destructive/10 text-destructive">Pending</Badge>}
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">
                      {pay ? `${dateLabel(pay.paid_at)} · ${pay.method} · ${pay.receipt_no}` : "—"}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {!paid && (
                        <Button size="sm" variant="outline" onClick={() => { setStudentId(s.id); setOpen(true); }}>
                          Record
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No active students.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CollectRentDialog
        open={open}
        onOpenChange={setOpen}
        students={active.map((s: any) => ({ id: s.id, name: s.name, monthly_rent: Number(s.monthly_rent) }))}
        initialStudentId={studentId}
      />
    </div>
  );
}
