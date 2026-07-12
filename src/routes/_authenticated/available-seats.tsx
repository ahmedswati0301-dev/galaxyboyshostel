import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchOccupancy, fetchRoomTypes, qkOccupancy, qkTypes } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currency } from "@/lib/format";
import { useState } from "react";
import { BedDouble } from "lucide-react";

export const Route = createFileRoute("/_authenticated/available-seats")({ component: AvailableSeats });

function AvailableSeats() {
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });
  const { data: types = [] } = useQuery({ queryKey: qkTypes, queryFn: fetchRoomTypes });
  const [typeId, setTypeId] = useState<string>("all");

  const avail = rooms.filter((r) => (r.available ?? 0) > 0 && (typeId === "all" || r.room_type_id === typeId));

  return (
    <div>
      <PageHeader title="Available Seats" description="Rooms ready for new admissions." />
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip active={typeId === "all"} onClick={() => setTypeId("all")}>All Types</FilterChip>
        {types.map((t) => (
          <FilterChip key={t.id} active={typeId === t.id} onClick={() => setTypeId(t.id)}>{t.name}</FilterChip>
        ))}
      </div>
      {avail.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No available rooms in this filter.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {avail.map((r) => (
            <Link key={r.id!} to="/rooms/$roomId" params={{ roomId: r.id! }}>
              <Card className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                      <BedDouble className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">Room {r.number}</p>
                      <p className="text-xs text-muted-foreground">Floor {r.floor} · {r.room_type}</p>
                    </div>
                  </div>
                  <Badge className="bg-warning/20 text-warning-foreground">{r.available} free</Badge>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">{r.occupied}/{r.capacity} occupied</span>
                  <span className="text-sm font-semibold">{currency(r.rent_per_seat)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}>
      {children}
    </button>
  );
}
