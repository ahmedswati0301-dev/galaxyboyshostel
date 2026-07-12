import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchOccupancy, qkOccupancy } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currency } from "@/lib/format";
import { DoorOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rooms")({
  component: RoomsLayout,
});

function RoomsLayout() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/_authenticated/rooms/$roomId");
  if (hasChild) return <Outlet />;
  return <RoomsIndex />;
}

function RoomsIndex() {
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });

  return (
    <div>
      <PageHeader title="Rooms" description="All rooms with live occupancy and rent." />
      {rooms.length === 0 && (
        <p className="text-sm text-muted-foreground">No rooms yet.</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => {
          const status = (r.available ?? 0) === 0 ? "Full" : (r.occupied ?? 0) === 0 ? "Available" : "Partial";
          const tone = status === "Full" ? "bg-destructive/10 text-destructive" : status === "Available" ? "bg-warning/20 text-warning-foreground" : "bg-info/15 text-info";
          return (
            <Link key={r.id!} to="/rooms/$roomId" params={{ roomId: r.id! }}>
              <Card className="glass-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <DoorOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">Room {r.number}</p>
                      <p className="text-xs text-muted-foreground">Floor {r.floor} · {r.room_type}</p>
                    </div>
                  </div>
                  <Badge className={`${tone} shrink-0`}>{status}</Badge>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
                  <div>
                    <p className="text-xl font-bold">{r.capacity}</p>
                    <p className="text-xs text-muted-foreground">Seats</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{r.occupied}</p>
                    <p className="text-xs text-muted-foreground">Occupied</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-warning-foreground">{r.available}</p>
                    <p className="text-xs text-muted-foreground">Free</p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium">{currency(r.rent_per_seat)}<span className="text-xs text-muted-foreground"> / seat</span></p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
