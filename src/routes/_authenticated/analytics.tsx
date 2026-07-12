import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPayments, fetchOccupancy, fetchStudents, qkOccupancy, qkStudents } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Analytics });

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Analytics() {
  const { data: payments = [] } = useQuery({ queryKey: ["payments-all"], queryFn: fetchAllPayments });
  const { data: rooms = [] } = useQuery({ queryKey: qkOccupancy, queryFn: fetchOccupancy });
  const { data: students = [] } = useQuery({ queryKey: qkStudents, queryFn: fetchStudents });

  const monthly = new Map<string, number>();
  payments.forEach((p) => monthly.set(p.month, (monthly.get(p.month) ?? 0) + Number(p.amount)));
  const monthlyData = Array.from(monthly.entries()).sort().map(([m, v]) => ({
    month: new Date(m).toLocaleDateString("en-US", { month: "short" }), amount: v,
  }));

  const typeMap = new Map<string, number>();
  rooms.forEach((r) => typeMap.set(r.room_type ?? "?", (typeMap.get(r.room_type ?? "?") ?? 0) + 1));
  const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

  const capacity = rooms.reduce((n, r) => n + (r.capacity ?? 0), 0);
  const occupied = rooms.reduce((n, r) => n + (r.occupied ?? 0), 0);
  const occData = [{ name: "Occupied", value: occupied }, { name: "Available", value: capacity - occupied }];

  const seatAvail = rooms.map((r) => ({ room: `R${r.number}`, free: r.available ?? 0 })).sort((a, b) => b.free - a.free).slice(0, 8);

  return (
    <div>
      <PageHeader title="Analytics" description="Trends and distributions across your hostel." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Rent Collection">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="amount" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Occupancy">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={occData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                {occData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Room Type Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={95} label>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Available Seats by Room">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={seatAvail}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="room" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="free" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="amount" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Total students: {students.length}</p>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`glass-card p-5 ${className ?? ""}`}>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}
