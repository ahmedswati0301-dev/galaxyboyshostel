import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { currency, genReceiptNo, monthKey, monthLabel } from "@/lib/format";
import { logActivity } from "@/lib/hostel-queries";

const schema = z.object({
  student_id: z.string().uuid("Select a student"),
  month: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["cash", "bank", "jazzcash", "easypaisa"]),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

type Student = { id: string; name: string; monthly_rent: number };

export function CollectRentDialog({
  open, onOpenChange, students, initialStudentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: Student[];
  initialStudentId?: string;
}) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<{ number: string; studentName: string; amount: number; month: string; method: string; notes?: string | null } | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_id: initialStudentId ?? "",
      month: monthKey(),
      amount: 0,
      method: "cash",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        student_id: initialStudentId ?? "",
        month: monthKey(),
        amount: initialStudentId ? students.find((s) => s.id === initialStudentId)?.monthly_rent ?? 0 : 0,
        method: "cash", notes: "",
      });
    }
  }, [open, initialStudentId]);

  const studentId = form.watch("student_id");
  useEffect(() => {
    const s = students.find((x) => x.id === studentId);
    if (s) form.setValue("amount", s.monthly_rent);
  }, [studentId]);

  async function onSubmit(v: Values) {
    setSaving(true);
    try {
      const receiptNo = genReceiptNo();
      const { error } = await supabase.from("payments").insert({
        student_id: v.student_id, month: v.month, amount: v.amount,
        method: v.method, notes: v.notes ?? null, receipt_no: receiptNo,
      });
      if (error) throw error;
      const student = students.find((s) => s.id === v.student_id);
      await logActivity("payment", `${student?.name ?? "Student"} paid ${currency(v.amount)} — ${receiptNo}`, v.student_id);
      setReceipt({
        number: receiptNo,
        studentName: student?.name ?? "Student",
        amount: v.amount,
        month: monthLabel(v.month),
        method: v.method,
        notes: v.notes ?? null,
      });
      toast.success(`Payment recorded — ${receiptNo}`);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setReceipt(null);
      form.reset({
        student_id: initialStudentId ?? "",
        month: monthKey(),
        amount: initialStudentId ? students.find((s) => s.id === initialStudentId)?.monthly_rent ?? 0 : 0,
        method: "cash",
        notes: "",
      });
    }
    onOpenChange(nextOpen);
  }

  function printReceipt() {
    if (!receipt) return;
    const printWindow = window.open("", "PRINT", "height=800,width=900,top=100,left=100");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.number}</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 28px; background: #f8fafc; color: #111827; }
            .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 20px 50px rgba(15,23,42,.08); }
            .header { padding: 28px 32px; background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); color: white; }
            .header h1 { margin: 0 0 6px; font-size: 24px; }
            .header p { margin: 0; opacity: 0.9; }
            .body { padding: 28px 32px; }
            .row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .row:last-child { border-bottom: none; }
            .label { color: #6b7280; font-size: 0.92rem; }
            .value { font-weight: 700; text-align: right; }
            .footer { padding: 18px 32px 30px; color: #6b7280; font-size: 0.93rem; border-top: 1px solid #e5e7eb; }
            @media print { body { padding: 0; background: #fff; } .sheet { box-shadow: none; border: none; border-radius: 0; } }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <h1>Galaxy Boys Hostel</h1>
              <p>Official Rent Receipt</p>
            </div>
            <div class="body">
              <div class="row"><span class="label">Receipt No.</span><span class="value">${receipt.number}</span></div>
              <div class="row"><span class="label">Student</span><span class="value">${receipt.studentName}</span></div>
              <div class="row"><span class="label">Month</span><span class="value">${receipt.month}</span></div>
              <div class="row"><span class="label">Amount</span><span class="value">${currency(receipt.amount)}</span></div>
              <div class="row"><span class="label">Method</span><span class="value">${receipt.method}</span></div>
              <div class="row"><span class="label">Notes</span><span class="value">${receipt.notes || "—"}</span></div>
            </div>
            <div class="footer">Generated automatically by Galaxy Boys Hostel management system.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Collect Rent</DialogTitle>
          <DialogDescription>Record a rent payment. A receipt number is generated automatically.</DialogDescription>
        </DialogHeader>
        {receipt ? (
          <div className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Receipt generated</p>
                <h3 className="mt-2 text-xl font-semibold">{receipt.number}</h3>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Paid</div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Student</span><span className="font-semibold">{receipt.studentName}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Month</span><span className="font-semibold">{receipt.month}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{currency(receipt.amount)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Method</span><span className="font-semibold capitalize">{receipt.method}</span></div>
              {receipt.notes ? <div className="rounded-xl bg-muted/70 p-3 text-sm text-muted-foreground">{receipt.notes}</div> : null}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>Close</Button>
              <Button type="button" onClick={printReceipt}>Print Receipt</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={form.watch("student_id")} onValueChange={(v) => form.setValue("student_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {currency(s.monthly_rent)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.student_id && <p className="text-xs text-destructive">{form.formState.errors.student_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input type="month" value={form.watch("month").slice(0,7)}
                onChange={(e) => form.setValue("month", `${e.target.value}-01`)} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="1" {...form.register("amount")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={form.watch("method")} onValueChange={(v) => form.setValue("method", v as Values["method"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="jazzcash">JazzCash</SelectItem>
                <SelectItem value="easypaisa">EasyPaisa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={2} {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Record Payment"}</Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
