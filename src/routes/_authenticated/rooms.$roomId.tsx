import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOccupancy, qkOccupancy, qkStudents, qkPayments, logActivity } from "@/lib/hostel-queries";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, monthKey } from "@/lib/format";
import { ArrowLeft, UserPlus, BedDouble } from "lucide-react";
import { useState } from "react";
import { AdmissionDialog } from "@/components/hostel/AdmissionDialog";
import { CollectRentDialog } from "@/components/hostel/CollectRentDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/rooms/$roomId")({
  component: RoomDetails,
});

function RoomDetails() {
  const { roomId } = Route.useParams();
  const qc = useQueryClient();
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });
  const room = rooms.find((r) => r.id === roomId);

  const { data: seatData } = useQuery({
    queryKey: ["room-seats", roomId, monthKey()],
    queryFn: async () => {
      const [{ data: students }, { data: payments }] = await Promise.all([
        supabase.from("students").select("*").eq("room_id", roomId).eq("status", "active").order("seat_number"),
        supabase.from("payments").select("student_id").eq("month", monthKey()),
      ]);
      return { students: students ?? [], paid: new Set((payments ?? []).map((p) => p.student_id)) };
    },
  });

  const [admitOpen, setAdmitOpen] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const [rentStudentId, setRentStudentId] = useState<string | undefined>();

  if (!room) return <p className="text-sm text-muted-foreground">Room not found.</p>;

  const seats = Array.from({ length: room.capacity ?? 0 }, (_, i) => i + 1);

  async function vacate(studentId: string, name: string) {
    if (!confirm(`Vacate ${name}?`)) return;
    const { error } = await supabase.from("students").update({ status: "vacated", vacated_at: new Date().toISOString().slice(0, 10) }).eq("id", studentId);
    if (error) return toast.error(error.message);
    await logActivity("vacate", `${name} vacated Room ${room?.number}`, studentId, room?.id ?? undefined);
    toast.success(`${name} vacated`);
    qc.invalidateQueries();
  }

  return (
    <div>
      <Link to="/rooms" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to rooms
      </Link>
      <PageHeader
        title={`Room ${room.number}`}
        description={`Floor ${room.floor} · ${room.room_type} · ${currency(room.rent_per_seat)} per seat`}
        actions={
          (room.available ?? 0) > 0 ? (
            <Button onClick={() => setAdmitOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Admit</Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {seats.map((n) => {
          const student = seatData?.students.find((s) => s.seat_number === n);
          const paid = student ? seatData?.paid.has(student.id) : false;
          return (
            <Card key={n} className="glass-card flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <BedDouble className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seat {n}</p>
                {student ? (
                  <>
                    <p className="truncate text-base font-semibold">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{student.phone ?? "No phone"} · {currency(student.monthly_rent)}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Empty seat</p>
                )}
              </div>
              {student ? (
                <>
                  <Badge className={paid ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}>
                    {paid ? "Paid" : "Pending"}
                  </Badge>
                  {!paid && (
                    <Button size="sm" variant="outline" onClick={() => { setRentStudentId(student.id); setRentOpen(true); }}>
                      Collect Rent
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => vacate(student.id, student.name)}>Vacate</Button>
                </>
              ) : (
                <Badge className="bg-warning/20 text-warning-foreground">Available</Badge>
              )}
            </Card>
          );
        })}
      </div>

      <AdmissionDialog open={admitOpen} onOpenChange={setAdmitOpen} defaultRoomId={room.id ?? undefined} />
      <CollectRentDialog
        open={rentOpen}
        onOpenChange={setRentOpen}
        students={(seatData?.students ?? []).map((s) => ({ id: s.id, name: s.name, monthly_rent: Number(s.monthly_rent) }))}
        initialStudentId={rentStudentId}
      />
    </div>
  );
}
