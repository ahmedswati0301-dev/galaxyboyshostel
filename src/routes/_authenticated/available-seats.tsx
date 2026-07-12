import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchOccupancy, fetchRoomTypes, qkOccupancy, qkTypes } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currency } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/available-seats")({ component: AvailableSeats });

function AvailableSeats() {
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });
  const { data: types = [] } = useQuery({ queryKey: qkTypes, queryFn: fetchRoomTypes });
  const [typeId, setTypeId] = useState<string>("all");

  const avail = rooms.filter((r) => (r.available ?? 0) > 0 && (typeId === "all" || r.room_type_id === typeId));

  return (
    <div className="space-y-6 p-1">
      <PageHeader title="Available Seats" description="Rooms ready for new admissions." />
      
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <FilterChip active={typeId === "all"} onClick={() => setTypeId("all")}>
          All Types
        </FilterChip>
        {types.map((t) => (
          <FilterChip key={t.id} active={typeId === t.id} onClick={() => setTypeId(t.id)}>
            {t.name}
          </FilterChip>
        ))}
      </div>

      {avail.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/5">
          No available rooms in this filter.
        </div>
      ) : (
        /* Grid gap aur column sizes optimized for compact cards */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {avail.map((r) => {
            const isLastSeat = r.available === 1;

            return (
              <Link key={r.id!} to="/rooms/$roomId" params={{ roomId: r.id! }} className="group">
                <Card className="relative overflow-hidden border border-slate-100 dark:border-slate-800 bg-card p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md rounded-2xl">
                  
                  {/* Top line indicator */}
                  <div className={`absolute top-0 inset-x-0 h-1 ${
                    isLastSeat ? "bg-amber-400/80" : "bg-emerald-400/80"
                  }`} />

                  {/* Header: Room Name & Circular Badge like your image */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                        Room {r.number}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Floor {r.floor} · {r.capacity} Seater
                      </p>
                    </div>

                    {/* Compact badge mimicking your image circle style */}
                    <div className={`status-circle ${isLastSeat ? 'status-circle-last' : 'status-circle-available'} text-[11px] font-bold leading-tight`}>
                      <div className="flex flex-col items-center">
                        <span>{r.available}</span>
                        <span className="text-[9px] font-medium -mt-0.5 opacity-90">free</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Category Type Subtitle */}
                  <p className="text-xs text-muted-foreground/80 font-medium mt-1 truncate">
                    {r.room_type || "Standard"}
                  </p>

                  {/* Bottom Row: Occupied Count & Price side by side */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between text-xs">
                    <div className="text-muted-foreground font-medium">
                      <span className="text-foreground font-semibold">{r.occupied}/{r.capacity}</span> occupied
                    </div>
                    
                    <div className="text-right">
                      <span className="font-black text-[14px] text-slate-900 dark:text-slate-100">
                        {currency(r.rent_per_seat)}
                      </span>
                    </div>
                  </div>

                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
        active 
          ? "border-primary bg-primary text-primary-foreground shadow-sm" 
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}