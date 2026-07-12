import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchOccupancy, qkOccupancy } from "@/lib/hostel-queries";
import { useState } from "react";
import { ArrowLeft, Building2, Users, LayoutGrid, Radio, Sun, Moon, Bell, Utensils, PhoneCall, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tv")({ component: TvMode });

function TvMode() {
  const { data: rooms = [] } = useQuery({ 
    queryKey: qkOccupancy, 
    queryFn: fetchOccupancy, 
    refetchInterval: 15000 
  });

  const [isDark, setIsDark] = useState(true);

  const avail = rooms.filter((r) => (r.available ?? 0) > 0);
  
  // Floor wise grouping
  const byFloor = new Map<number, typeof avail>();
  avail.forEach((r) => {
    const list = byFloor.get(r.floor!) ?? [];
    list.push(r); 
    byFloor.set(r.floor!, list);
  });
  const floors = Array.from(byFloor.entries()).sort(([a], [b]) => a - b);

  const totalAvailableSeats = avail.reduce((n, r) => n + (r.available ?? 0), 0);

  const getFloorName = (floorNum: number) => {
    const j = floorNum % 10, k = floorNum % 100;
    if (j === 1 && k !== 11) return floorNum + "st Floor";
    if (j === 2 && k !== 12) return floorNum + "nd Floor";
    if (j === 3 && k !== 13) return floorNum + "rd Floor";
    return floorNum + "th Floor";
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto font-sans transition-colors duration-300 antialiased ${
      isDark ? "bg-[#090d16] text-slate-100" : "bg-[#f4f7fe] text-slate-800"
    }`}>
      {/* Decorative Blur Backgrounds */}
      <div className={`pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full blur-[120px] transition-opacity duration-500 ${
        isDark ? "bg-indigo-600/10 opacity-100" : "bg-indigo-400/20 opacity-70"
      }`} />

      <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        
        {/* HEADER SECTION */}
        <header className={`mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b pb-8 transition-colors ${
          isDark ? "border-slate-800/80" : "border-slate-200/80"
        }`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/" className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all backdrop-blur-md ${
              isDark 
                ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white" 
                : "border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
            }`}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-extrabold tracking-tight md:text-4xl ${
                  isDark ? "bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent" : "text-slate-900"
                }`}>
                  Galaxy Boys Hostel
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className={`flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> Live Dashboard
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 self-start lg:self-auto">
            <div className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-md transition-all ${
              isDark ? "border-slate-800/60 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"
            }`}>
              <div className={`rounded-xl p-3 ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-3xl font-black tabular-nums ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{totalAvailableSeats}</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Available Seats</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-md transition-all ${
              isDark ? "border-slate-800/60 bg-slate-900/40" : "border-slate-200 bg-white shadow-sm"
            }`}>
              <div className={`rounded-xl p-3 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-3xl font-black tabular-nums ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{avail.length}</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Available Rooms</p>
              </div>
            </div>

            <button 
              onClick={() => setIsDark(!isDark)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm ${
                isDark ? "border-slate-800 bg-slate-900/60 text-amber-400 hover:bg-slate-800" : "border-slate-200 bg-white text-indigo-600 hover:bg-slate-50"
              }`}
            >
              {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* MAIN TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 items-start">
          
          {/* LEFT SIDE: ROOMS GRID (Occupies 3 columns out of 4) */}
          <div className="lg:col-span-3 space-y-12">
            {floors.length === 0 && (
              <div className={`relative overflow-hidden rounded-3xl border p-16 text-center backdrop-blur-md ${
                isDark ? "border-slate-800 bg-slate-900/20" : "border-slate-200 bg-white shadow-sm"
              }`}>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                  <Building2 className="h-8 w-8" />
                </div>
                <h3 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>All Rooms are Fully Occupied</h3>
              </div>
            )}

            {floors.map(([floor, list]) => (
              <section key={floor} className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className={`h-px w-8 ${isDark ? "bg-indigo-500/40" : "bg-indigo-400/50"}`} />
                  <h2 className={`text-lg font-black tracking-wider uppercase ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                    {getFloorName(floor)}
                  </h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"}`}>
                    {list.length} {list.length === 1 ? 'Room' : 'Rooms'} Avail.
                  </span>
                  <span className={`flex-1 h-px ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                  {list.map((r) => {
                    const isLastSeat = r.available === 1;
                    return (
                      <div key={r.id!} className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        isDark ? "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                        <div className={`absolute top-0 inset-x-0 h-1.5 ${isLastSeat ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />
                        <div className="flex items-start justify-between mt-1">
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Room</p>
                            <h3 className={`text-2xl font-black transition-colors ${isDark ? "text-white group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-600"}`}>{r.number}</h3>
                          </div>
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-wider ${isLastSeat ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {r.available} Left
                          </span>
                        </div>
                        <div className={`mt-6 flex items-center justify-between border-t pt-4 ${isDark ? "border-slate-800/60" : "border-slate-100"}`}>
                          <span className={`text-xs font-semibold rounded-md px-2 py-1 ${isDark ? "text-slate-400 bg-slate-800/50" : "text-slate-600 bg-slate-100"}`}>
                            {r.room_type || "Standard"}
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: r.available ?? 0 }).map((_, idx) => (
                              <span key={idx} className={`h-2 w-2 rounded-full ${isLastSeat ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* RIGHT SIDE: HOSTEL HUB INFO SIDEBAR (Occupies 1 column out of 4) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            
            {/* NOTICE BOARD CARD */}
            <div className={`rounded-2xl border p-5 backdrop-blur-md transition-all ${
              isDark ? "border-slate-800/60 bg-slate-900/30" : "border-slate-200 bg-white shadow-sm"
            }`}>
              <div className="flex items-center gap-2 mb-4 text-amber-500">
                <Bell className="h-5 w-5 animate-bounce" />
                <h3 className="font-bold tracking-wide uppercase text-sm">Notice Board</h3>
              </div>
              <ul className="space-y-3 text-xs">
                <li className={`p-3 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                  <span className="font-bold block text-indigo-500 mb-1">Wi-Fi Maintenance</span>
                  Internet will be down tonight from 2:00 AM to 4:00 AM.
                </li>
                <li className={`p-3 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                  <span className="font-bold block text-emerald-500 mb-1">Rent Reminder</span>
                  Please clear your dues before the 5th of this month.
                </li>
              </ul>
            </div>

            {/* MESS MENU CARD */}
            <div className={`rounded-2xl border p-5 backdrop-blur-md transition-all ${
              isDark ? "border-slate-800/60 bg-slate-900/30" : "border-slate-200 bg-white shadow-sm"
            }`}>
              <div className="flex items-center gap-2 mb-4 text-indigo-500">
                <Utensils className="h-5 w-5" />
                <h3 className="font-bold tracking-wide uppercase text-sm">Today's Mess Menu</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Lunch</span>
                  <span className="font-semibold">Chicken Biryani + Raita</span>
                </div>
                <div className={`h-px ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Dinner</span>
                  <span className="font-semibold">Daal Makhni + Roti + Kheer</span>
                </div>
              </div>
            </div>

            {/* HELPLINE & EMERGENCY */}
            <div className={`rounded-2xl border p-5 backdrop-blur-md transition-all ${
              isDark ? "border-slate-800/60 bg-slate-900/30" : "border-slate-200 bg-white shadow-sm"
            }`}>
              <div className="flex items-center gap-2 mb-4 text-rose-500">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-bold tracking-wide uppercase text-sm">Helpline & Security</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className={`flex items-center justify-between p-2 rounded-lg ${isDark ? "bg-slate-900/40" : "bg-slate-50"}`}>
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Warden Office</span>
                  <a href="tel:+923001234567" className="flex items-center gap-1 font-bold text-rose-500 hover:underline">
                    <PhoneCall className="h-3 w-3" /> Call
                  </a>
                </div>
                <div className={`flex items-center justify-between p-2 rounded-lg ${isDark ? "bg-slate-900/40" : "bg-slate-50"}`}>
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Main Gate Guard</span>
                  <a href="tel:+923007654321" className="flex items-center gap-1 font-bold text-rose-500 hover:underline">
                    <PhoneCall className="h-3 w-3" /> Call
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <footer className={`mt-16 flex items-center justify-center gap-2 border-t pt-6 text-center text-xs font-bold uppercase tracking-widest ${
          isDark ? "border-slate-900 text-slate-500" : "border-slate-200 text-slate-400"
        }`}>
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Auto-refreshes every 15 seconds · Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </footer>

      </div>
    </div>
  );
}