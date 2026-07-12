import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchStudents, qkStudents, fetchPaymentsForMonth, qkPayments } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/hostel/StatCard";
import { currency, monthKey, dateLabel, daysSince } from "@/lib/format";
import { useState } from "react";
import { TrendingUp, Wallet, AlertCircle, CheckCircle2, XCircle, Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const [month, setMonth] = useState(monthKey().slice(0, 7));
  const monthISO = `${month}-01`;
  const [q, setQ] = useState("");
  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });
  const { data: payments = [] } = useQuery({ queryKey: [...qkPayments, monthISO], queryFn: () => fetchPaymentsForMonth(monthISO) });

  const active = students.filter((s: any) => s.status === "active");
  const paidIds = new Set(payments.map((p) => p.student_id));
  const expected = active.reduce((n, s: any) => n + Number(s.monthly_rent), 0);
  const received = payments.reduce((n, p) => n + Number(p.amount), 0);
  const pending = Math.max(0, expected - received);
  const paidStudents = active.filter((s: any) => paidIds.has(s.id));
  const pendingStudents = active.filter((s: any) => !paidIds.has(s.id));

  const filter = (arr: any[]) => arr.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  function exportCSV() {
    const header = "Type,Name,Room,Floor,Amount,Status,Details\n";
    const rows = [
      ...paidStudents.map((s: any) => {
        const p = payments.find((x) => x.student_id === s.id);
        return `Paid,${s.name},${s.rooms?.number ?? ""},${s.rooms?.floor ?? ""},${p?.amount ?? s.monthly_rent},Paid,${p?.receipt_no ?? ""}`;
      }),
      ...pendingStudents.map((s: any) => `Pending,${s.name},${s.rooms?.number ?? ""},${s.rooms?.floor ?? ""},${s.monthly_rent},Pending,${daysSince(monthISO)} days`),
    ];
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rent-report-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Rent Reports"
        description={`Detailed breakdown for ${new Date(monthISO).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
        actions={<Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>}
      />

      <Card className="glass-card mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Expected" value={currency(expected)} icon={TrendingUp} />
        <StatCard label="Received" value={currency(received)} icon={Wallet} tone="success" />
        <StatCard label="Pending" value={currency(pending)} icon={AlertCircle} tone="danger" />
        <StatCard label="Paid" value={paidStudents.length} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value={pendingStudents.length} icon={XCircle} tone="danger" />
      </div>

      <Card className="glass-card mt-6 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="h-5 w-5 text-success" /> Paid Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Room</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Method</th><th className="py-2 pr-3">Paid</th><th className="py-2 pr-3">Receipt</th>
            </tr></thead>
            <tbody>
              {filter(paidStudents).map((s: any) => {
                const p = payments.find((x) => x.student_id === s.id)!;
                return (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-3 font-medium">{s.name}</td>
                    <td className="py-3 pr-3">{s.rooms ? `Room ${s.rooms.number} · F${s.rooms.floor}` : "—"}</td>
                    <td className="py-3 pr-3">{currency(p.amount)}</td>
                    <td className="py-3 pr-3 capitalize">{p.method}</td>
                    <td className="py-3 pr-3">{dateLabel(p.paid_at)}</td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{p.receipt_no}</td>
                  </tr>
                );
              })}
              {filter(paidStudents).length === 0 && <tr><td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No paid students yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="glass-card mt-6 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><XCircle className="h-5 w-5 text-destructive" /> Pending Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Room</th><th className="py-2 pr-3">Due</th><th className="py-2 pr-3">Days</th><th className="py-2 pr-3">Status</th>
            </tr></thead>
            <tbody>
              {filter(pendingStudents).map((s: any) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-3 font-medium">{s.name}</td>
                  <td className="py-3 pr-3">{s.rooms ? `Room ${s.rooms.number} · F${s.rooms.floor}` : "—"}</td>
                  <td className="py-3 pr-3">{currency(s.monthly_rent)}</td>
                  <td className="py-3 pr-3">{Math.max(0, daysSince(monthISO))} days</td>
                  <td className="py-3 pr-3"><Badge variant="destructive">Pending</Badge></td>
                </tr>
              ))}
              {filter(pendingStudents).length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Everyone has paid 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
