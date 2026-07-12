import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchStudents, qkStudents, fetchPaymentsForMonth, qkPayments, fetchAllPayments } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/hostel/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { currency, monthKey, dateLabel, daysSince } from "@/lib/format";
import { TrendingUp, Wallet, AlertCircle, CheckCircle2, XCircle, Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  const [month, setMonth] = useState(monthKey().slice(0, 7));
  const monthISO = `${month}-01`;
  const [q, setQ] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });
  const { data: payments = [] } = useQuery({ queryKey: [...qkPayments, monthISO], queryFn: () => fetchPaymentsForMonth(monthISO) });
  const { data: allPayments = [] } = useQuery({ queryKey: [...qkPayments, "all"], queryFn: fetchAllPayments });
  const selectedStudent = useMemo(
    () => (selectedStudentId ? students.find((s: any) => s.id === selectedStudentId) : null),
    [students, selectedStudentId],
  );
  const selectedStudentPayments = useMemo(
    () => (selectedStudentId ? allPayments.filter((p: any) => p.student_id === selectedStudentId) : []),
    [allPayments, selectedStudentId],
  );

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

  function printStudentHistory() {
    if (!selectedStudent) return;
    const rows = selectedStudentPayments.map((payment: any) => `
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db;">${dateLabel(payment.paid_at)}</td>
        <td style="padding:8px;border:1px solid #d1d5db;">${payment.month}</td>
        <td style="padding:8px;border:1px solid #d1d5db;">${currency(payment.amount)}</td>
        <td style="padding:8px;border:1px solid #d1d5db;">${payment.method}</td>
        <td style="padding:8px;border:1px solid #d1d5db;">${payment.receipt_no}</td>
      </tr>
    `).join("");

    const html = `
      <html>
      <head>
        <title>Payment History - ${selectedStudent.name}</title>
        <style>
          body { font-family: Inter, sans-serif; background: #f8fafc; color: #111827; padding: 24px; }
          h1 { margin-bottom: 8px; font-size: 1.25rem; }
          p { margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 700; }
        </style>
      </head>
      <body>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#4f46e5;display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:1.25rem;">G</div>
          <div>
            <p style="margin:0;font-size:1rem;font-weight:700;color:#111827;">Galaxy Boys Hostel</p>
            <p style="margin:4px 0 0;color:#475569;font-size:0.95rem;">Hostel payment history</p>
          </div>
        </div>
        <h1>Payment History for ${selectedStudent.name}</h1>
        <p><strong>Room:</strong> ${selectedStudent.rooms ? `Room ${selectedStudent.rooms.number} · Floor ${selectedStudent.rooms.floor}` : "—"}</p>
        <p><strong>Phone:</strong> ${selectedStudent.phone || "—"}</p>
        <p><strong>Status:</strong> ${selectedStudent.status}</p>
        <table>
          <thead>
            <tr>
              <th>Paid on</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="5" style="padding:12px;text-align:center;">No payment history found.</td></tr>`}
          </tbody>
        </table>
        <div style="margin-top:36px; display:grid; grid-template-columns:1fr 1fr; gap:24px;">
          <div style="padding-top:16px;">
            <p style="margin:0 0 12px;font-weight:700;">Hostel Owner / Manager</p>
            <div style="border-bottom:1px solid #d1d5db; padding-bottom:10px; min-height:32px;"></div>
            <p style="margin:8px 0 0;font-size:0.9rem;color:#475569;">Signature</p>
          </div>
          <div style="padding-top:16px;">
            <p style="margin:0 0 12px;font-weight:700;">Student</p>
            <div style="border-bottom:1px solid #d1d5db; padding-bottom:10px; min-height:32px;"></div>
            <p style="margin:8px 0 0;font-size:0.9rem;color:#475569;">Signature</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
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
                    <td className="py-3 pr-3 font-medium">
                      <button className="hover:underline" onClick={() => setSelectedStudentId(s.id)}>{s.name}</button>
                    </td>
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

      <Dialog open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name ?? "Payment history"}</DialogTitle>
            <DialogDescription>All payments for this student over time.</DialogDescription>
          </DialogHeader>
          {selectedStudent ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Student</p>
                  <p className="mt-0.5 font-semibold">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Room</p>
                  <p className="mt-0.5">{selectedStudent.rooms ? `Room ${selectedStudent.rooms.number} · Floor ${selectedStudent.rooms.floor}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p className="mt-0.5">{selectedStudent.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-0.5 capitalize">{selectedStudent.status}</p>
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Payment history</h3>
                  <Button variant="outline" size="sm" onClick={printStudentHistory}>Print</Button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-border bg-background/80 p-0.5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3">Paid on</th>
                        <th className="py-2 pr-3">Month</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Method</th>
                        <th className="py-2 pr-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentPayments.map((payment: any) => (
                        <tr key={payment.id} className="border-b last:border-b-0">
                          <td className="py-2 pr-3">{dateLabel(payment.paid_at)}</td>
                          <td className="py-2 pr-3">{payment.month}</td>
                          <td className="py-2 pr-3">{currency(payment.amount)}</td>
                          <td className="py-2 pr-3 capitalize">{payment.method}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{payment.receipt_no}</td>
                        </tr>
                      ))}
                      {selectedStudentPayments.length === 0 && (
                        <tr><td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">No payment history found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
