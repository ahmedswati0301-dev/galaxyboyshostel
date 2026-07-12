import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DoorOpen, Users, BedDouble, Wallet, TrendingUp, AlertCircle, Home, UserPlus, Percent, Activity,
} from "lucide-react";
import { StatCard, PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchOccupancy, fetchStudents, fetchActivity, fetchPaymentsForMonth,
  qkOccupancy, qkStudents, qkActivity, qkPayments,
} from "@/lib/hostel-queries";
import { currency, dateLabel, monthKey } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });
  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });
  const { data: activity = [] } = useQuery({ queryKey: qkActivity, queryFn: () => fetchActivity(10) });
  const month = monthKey();
  const { data: payments = [] } = useQuery({ queryKey: [...qkPayments, month], queryFn: () => fetchPaymentsForMonth(month) });

  const active = students.filter((s) => s.status === "active");
  const capacity = rooms.reduce((n, r) => n + (r.capacity ?? 0), 0);
  const occupied = rooms.reduce((n, r) => n + (r.occupied ?? 0), 0);
  const available = capacity - occupied;
  const occPct = capacity ? Math.round((occupied / capacity) * 100) : 0;
  const expected = active.reduce((n, s) => n + Number(s.monthly_rent), 0);
  const received = payments.reduce((n, p) => n + Number(p.amount), 0);
  const pending = Math.max(0, expected - received);
  const today = new Date().toISOString().slice(0, 10);
  const todayAdmissions = students.filter((s) => s.admission_date === today).length;
  const vacantRooms = rooms.filter((r) => (r.occupied ?? 0) === 0).length;

  const paidStudentIds = new Set(payments.map((p) => p.student_id));
  const pendingStudents = active.filter((s) => !paidStudentIds.has(s.id));
  const availableRooms = rooms.filter((r) => (r.available ?? 0) > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-2 pb-6 sm:px-6 lg:px-8 mt-2">
      <PageHeader
        title="Dashboard"
        description="Live snapshot of Galaxy Boys Hostel."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Rooms" value={rooms.length} icon={DoorOpen} />
          <StatCard label="Students" value={active.length} icon={Users} />
          <StatCard label="Total Capacity" value={capacity} icon={Home} />
          <StatCard label="Occupied" value={occupied} icon={BedDouble} tone="info" />
          <StatCard label="Available" value={available} icon={BedDouble} tone="warning" />
          <StatCard label="Occupancy" value={`${occPct}%`} icon={Percent} tone="success" />
          <StatCard label="Vacant Rooms" value={vacantRooms} icon={Home} />
          <StatCard label="New Today" value={todayAdmissions} icon={UserPlus} tone="info" />
          <StatCard label="Pending Students" value={pendingStudents.length} icon={Users} tone="danger" />
        </div>

        <Card className="glass-card p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Quick summary</p>
              <h2 className="mt-2 text-2xl font-bold">Hostel health at a glance</h2>
            </div>

            <div className="grid gap-3">
              <div className="rounded-3xl border border-sky-200/80 bg-sky-50/80 p-4">
                <p className="text-sm text-sky-700">Open seats</p>
                <p className="mt-2 text-3xl font-semibold text-sky-800">{available}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-4">
                <p className="text-sm text-emerald-700">Vacant rooms</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-900">{vacantRooms}</p>
              </div>
              <div className="rounded-3xl border border-rose-200/80 bg-rose-50/80 p-4">
                <p className="text-sm text-rose-700">Pending rent balance</p>
                <p className="mt-2 text-3xl font-semibold text-rose-900">{currency(pending)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {pendingStudents.length > 0 && (
        <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium text-destructive text-center">
            {pendingStudents.length} student{pendingStudents.length > 1 ? "s have" : " has"} not paid rent this month.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_420px]">
        <Card className="glass-card p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Available Seats</h2>
              <p className="text-sm text-muted-foreground">Rooms with open seats right now.</p>
            </div>
            <Link to="/available-seats" className="text-sm font-medium text-primary hover:underline">View all →</Link>
          </div>

          {availableRooms.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">All rooms are full 🎉</p>
          ) : (
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {availableRooms.slice(0, 6).map((r) => (
                <Link
                  key={r.id!}
                  to="/rooms/$roomId"
                  params={{ roomId: r.id! }}
                  className="group rounded-[28px] border border-border/60 bg-background p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">Room {r.number}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Floor {r.floor} · {r.room_type}</p>
                    </div>
                    <Badge className="rounded-full bg-warning/20 px-3 py-1 text-sm text-warning-foreground">{r.available} free</Badge>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{r.occupied}/{r.capacity} occupied</span>
                    <span className="font-semibold text-foreground">{currency(r.rent_per_seat)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {activity.map((a) => (
              <div key={a.id} className="rounded-3xl border border-border/70 bg-muted/50 p-4">
                <p className="text-sm font-medium">{a.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{dateLabel(a.created_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 glass-card p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pending Rent</h2>
            <p className="text-sm text-muted-foreground">Students who haven't paid for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.</p>
          </div>
          <Link to="/rent" className="text-sm font-medium text-primary hover:underline">Collect →</Link>
        </div>
        {pendingStudents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Everyone has paid for this month 🎉</p>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/70 bg-muted/50 p-1">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.slice(0, 8).map((s) => {
                  const room = (s as any).rooms;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-4 font-medium text-foreground">{s.name}</td>
                      <td className="px-4 py-4">Room {room?.number ?? "—"}</td>
                      <td className="px-4 py-4">Floor {room?.floor ?? "—"}</td>
                      <td className="px-4 py-4">{currency(s.monthly_rent)}</td>
                      <td className="px-4 py-4"><Badge variant="destructive">Pending</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
