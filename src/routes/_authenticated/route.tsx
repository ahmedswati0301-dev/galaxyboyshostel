import { createFileRoute, Outlet, redirect, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, DoorOpen, Users, UserPlus, Wallet, BedDouble,
  FileBarChart, Tv, LineChart, Settings, LogOut, Building2, Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rooms", label: "Rooms", icon: DoorOpen },
  { to: "/students", label: "Students", icon: Users },
  { to: "/admissions", label: "Admissions", icon: UserPlus },
  { to: "/rent", label: "Rent Collection", icon: Wallet },
  { to: "/available-seats", label: "Available Seats", icon: BedDouble },
  { to: "/reports", label: "Rent Reports", icon: FileBarChart },
  { to: "/tv", label: "TV Display", icon: Tv },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Galaxy Boys Hostel</p>
          <p className="truncate text-xs text-muted-foreground">Manager console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((item) => {
          const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}

function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex min-h-screen">
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="fixed inset-y-0 w-64">
            <SidebarBody />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur lg:h-16 lg:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
