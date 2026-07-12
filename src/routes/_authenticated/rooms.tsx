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
          const isLastSeat = (r.available ?? 0) === 1;
          return (
            <Link key={r.id!} to="/rooms/$roomId" params={{ roomId: r.id! }} className="group">
              <Card className="relative overflow-hidden border border-slate-100 dark:border-slate-800 bg-card p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md rounded-2xl">
                <div className={`absolute top-0 inset-x-0 h-1 ${isLastSeat ? "bg-amber-400/80" : (r.available ?? 0) > 0 ? "bg-emerald-400/80" : "bg-transparent"}`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Room {r.number}</h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">Floor {r.floor} · {r.room_type}</p>
                  </div>

                  {/* Circular availability indicator (matches available-seats) */}
                  {(r.available ?? 0) > 0 ? (
                    <div className="status-circle status-circle-available text-[12px] font-semibold">
                      <div className="flex flex-col items-center">
                        <span>{r.available}</span>
                        <span className="text-[9px] font-medium -mt-0.5 opacity-90">free</span>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="status-full">Full</Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground/80 font-medium mt-3">{r.capacity} Seater</p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between text-xs">
                  <div className="text-muted-foreground font-medium">
                    <span className="text-foreground font-semibold">{r.occupied}/{r.capacity}</span> occupied
                  </div>
                  <div className="text-right">
                    <span className="font-black text-[14px] text-slate-900 dark:text-slate-100">{currency(r.rent_per_seat)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
