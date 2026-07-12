import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { fetchOccupancy, fetchRoomTypes, qkOccupancy, qkTypes, logActivity } from "@/lib/hostel-queries";
import { currency } from "@/lib/format";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  father_name: z.string().optional(),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
  admission_date: z.string(),
  room_type_id: z.string().uuid("Select a room type"),
  room_id: z.string().uuid("Select a room"),
});
type Values = z.infer<typeof schema>;

export function AdmissionDialog({ open, onOpenChange, defaultRoomId }: { open: boolean; onOpenChange: (v: boolean) => void; defaultRoomId?: string }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data: types = [] } = useQuery({ queryKey: qkTypes, queryFn: fetchRoomTypes });
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", father_name: "", phone: "", cnic: "", emergency_contact: "",
      address: "",
      admission_date: new Date().toISOString().slice(0, 10),
      room_type_id: "", room_id: defaultRoomId ?? "",
    },
  });

  const typeId = form.watch("room_type_id");
  const availRooms = rooms.filter((r) => (!typeId || r.room_type_id === typeId) && (r.available ?? 0) > 0);

  async function onSubmit(v: Values) {
    setSaving(true);
    try {
      const room = rooms.find((r) => r.id === v.room_id);
      if (!room) throw new Error("Room not found");

      const { data: existing, error: exErr } = await supabase
        .from("students").select("seat_number")
        .eq("room_id", v.room_id).eq("status", "active");
      if (exErr) throw exErr;
      const taken = new Set((existing ?? []).map((s) => s.seat_number));
      let seat = 1;
      while (taken.has(seat)) seat++;
      if (seat > (room.capacity ?? 0)) throw new Error("Room is already full");

      const { data: student, error } = await supabase.from("students").insert({
        name: v.name,
        father_name: v.father_name || null,
        phone: v.phone || null,
        cnic: v.cnic || null,
        emergency_contact: v.emergency_contact || null,
        address: v.address || null,
        admission_date: v.admission_date,
        room_id: v.room_id,
        seat_number: seat,
        monthly_rent: room.rent_per_seat ?? 0,
      }).select().single();
      if (error) throw error;

      await logActivity("admission", `${v.name} admitted into Room ${room.number} (Seat ${seat})`, student.id, room.id ?? undefined);
      toast.success(`${v.name} admitted — Room ${room.number}, Seat ${seat}`);
      qc.invalidateQueries();
      onOpenChange(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Admission failed");
    } finally {
      setSaving(false);
    }
  }

  function printForm() {
    const values = form.getValues();
    const room = rooms.find((r) => r.id === values.room_id);
    const type = types.find((t) => t.id === values.room_type_id);

    const printWindow = window.open("", "PRINT", "height=800,width=900,top=100,left=100");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Admission Form — Galaxy Boys Hostel</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 24px; color: #111827; background: #f8fafc; }
            .report-shell { width: 100%; max-width: 860px; margin: 0 auto; }
            .report-card { border-radius: 28px; background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08); overflow: hidden; }
            .report-hero { padding: 36px 42px; background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); color: white; }
            .report-hero h1 { margin: 0; font-size: 2.1rem; letter-spacing: -0.04em; }
            .report-hero p { margin: 10px 0 0; color: rgba(255,255,255,0.85); }
            .report-content { padding: 36px 42px; }
            .report-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
            .report-section { padding: 24px; border-radius: 22px; background: #f8fafc; border: 1px solid #e5e7eb; }
            .report-section h2 { margin: 0 0 16px; font-size: 1.05rem; color: #111827; }
            .report-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .report-item:last-child { border-bottom: none; }
            .report-item label { color: #6b7280; font-size: 0.92rem; }
            .report-item span { color: #111827; font-size: 1rem; font-weight: 600; }
            .report-footer { padding: 24px 42px 32px; color: #6b7280; font-size: 0.94rem; text-align: center; border-top: 1px solid #e5e7eb; }
            @media print { body { padding: 0; background: #fff; } .report-shell { box-shadow: none; margin: 0; } .report-card { box-shadow: none; border: none; } }
          </style>
        </head>
        <body>
          <div class="report-shell">
            <div class="report-card">
              <div class="report-hero">
                <h1>Admission Form</h1>
                <p>Galaxy Boys Hostel · Registered student admission details</p>
              </div>
              <div class="report-content">
                <div class="report-grid">
                  <div class="report-section">
                    <h2>Student Information</h2>
                    <div class="report-item"><label>Name</label><span>${values.name || "—"}</span></div>
                    <div class="report-item"><label>Father Name</label><span>${values.father_name || "—"}</span></div>
                    <div class="report-item"><label>Phone</label><span>${values.phone || "—"}</span></div>
                    <div class="report-item"><label>CNIC</label><span>${values.cnic || "—"}</span></div>
                    <div class="report-item"><label>Emergency Contact</label><span>${values.emergency_contact || "—"}</span></div>
                    <div class="report-item"><label>Admission Date</label><span>${values.admission_date || "—"}</span></div>
                  </div>
                  <div class="report-section">
                    <h2>Room Assignment</h2>
                    <div class="report-item"><label>Room Type</label><span>${type?.name || "—"}</span></div>
                    <div class="report-item"><label>Room</label><span>${room ? `Room ${room.number}` : "—"}</span></div>
                    <div class="report-item"><label>Floor</label><span>${room?.floor ?? "—"}</span></div>
                    <div class="report-item"><label>Rent / Seat</label><span>${room ? currency(room.rent_per_seat) : "—"}</span></div>
                    <div class="report-item"><label>Available Seats</label><span>${room?.available ?? "—"}</span></div>
                  </div>
                </div>
                <div class="report-section" style="margin-top: 22px;">
                  <h2>Address</h2>
                  <div class="report-item" style="grid-template-columns: 1fr; padding: 0; border: none;"><span style="color: #111827; font-weight: 600;">${values.address || "—"}</span></div>
                </div>
              </div>
              <div class="report-footer">Generated by Galaxy Boys Hostel — Admission Form</div>
            </div>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Admission</DialogTitle>
          <DialogDescription>Register a new student and assign them to an available seat.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Student Name*"><Input {...form.register("name")} /></Field>
            <Field label="Father Name"><Input {...form.register("father_name")} /></Field>
            <Field label="Phone"><Input {...form.register("phone")} /></Field>
            <Field label="CNIC"><Input {...form.register("cnic")} /></Field>
            <Field label="Emergency Contact"><Input {...form.register("emergency_contact")} /></Field>
            <Field label="Admission Date"><Input type="date" {...form.register("admission_date")} /></Field>
          </div>
          <Field label="Address"><Textarea rows={2} {...form.register("address")} /></Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={typeId} onValueChange={(v) => { form.setValue("room_type_id", v); form.setValue("room_id", ""); }}>
                <SelectTrigger><SelectValue placeholder="Pick a type" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {currency(t.default_rent)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Available Room</Label>
              <Select value={form.watch("room_id")} onValueChange={(v) => form.setValue("room_id", v)}>
                <SelectTrigger><SelectValue placeholder={availRooms.length ? "Select a room" : "No rooms available"} /></SelectTrigger>
                <SelectContent>
                  {availRooms.map((r) => (
                    <SelectItem key={r.id!} value={r.id!}>Room {r.number} · Floor {r.floor} · {r.available} seat(s) · {currency(r.rent_per_seat)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {Object.values(form.formState.errors).map((e) => e && (
            <p key={e.message} className="text-xs text-destructive">{e.message as string}</p>
          ))}

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" variant="secondary" onClick={printForm}>Print / Download PDF</Button>
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Admit Student"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
