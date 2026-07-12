export const currency = (n: number | null | undefined) =>
  `Rs. ${(Number(n) || 0).toLocaleString("en-PK")}`;

export const monthKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
};

export const monthLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export const dateLabel = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export const daysSince = (iso: string) => {
  const then = new Date(iso).getTime();
  return Math.floor((Date.now() - then) / 86400000);
};

export const genReceiptNo = () => {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SBH-${ym}-${rand}`;
};
