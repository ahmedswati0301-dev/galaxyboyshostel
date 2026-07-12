import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [preference, setPreference] = useState<"system" | "light" | "dark">(() => {
    try {
      if (typeof window === "undefined") return "system";
      return (localStorage.getItem("theme") as any) || "system";
    } catch (e) {
      return "system";
    }
  });

  useEffect(() => {
    const apply = (pref: string) => {
      const el = document.documentElement;
      if (pref === "system") {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) el.classList.add("dark"); else el.classList.remove("dark");
      } else if (pref === "dark") {
        el.classList.add("dark");
      } else {
        el.classList.remove("dark");
      }
    };

    apply(preference);

    const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (preference === "system") apply("system");
    };
    mql?.addEventListener?.("change", onChange);
    return () => { mql?.removeEventListener?.("change", onChange); };
  }, [preference]);

  const toggle = () => {
    const next = preference === "dark" ? "light" : "dark";
    setPreference(next);
    try { localStorage.setItem("theme", next); } catch (e) { }
  };

  const effectiveDark = typeof window !== "undefined" && (preference === "dark" || (preference === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches));

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        aria-label="Toggle color theme"
        title={effectiveDark ? "Switch to light" : "Switch to dark"}
        onClick={toggle}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm hover:shadow-md focus:outline-none"
      >
        {effectiveDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </div>
  );
}
