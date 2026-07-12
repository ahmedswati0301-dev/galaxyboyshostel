import { supabase } from "@/integrations/supabase/client";
import { monthKey } from "./format";

export const qkRooms = ["rooms"] as const;
export const qkOccupancy = ["room_occupancy"] as const;
export const qkStudents = ["students"] as const;
export const qkPayments = ["payments"] as const;
export const qkActivity = ["activity_logs"] as const;
export const qkTypes = ["room_types"] as const;
export const qkSettings = ["settings"] as const;

export async function fetchOccupancy() {
  const { data, error } = await supabase.from("room_occupancy").select("*").order("floor").order("number");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRoomTypes() {
  const { data, error } = await supabase.from("room_types").select("*").order("capacity");
  if (error) throw error;
  return data ?? [];
}

export async function fetchStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*, rooms(number, floor)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActivity(limit = 15) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchPaymentsForMonth(monthISO = monthKey()) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, students(name, room_id, rooms(number, floor))")
    .eq("month", monthISO);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*, students(name, rooms(number, floor))")
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function logActivity(type: string, message: string, refStudent?: string, refRoom?: string) {
  await supabase.from("activity_logs").insert({
    type, message, ref_student: refStudent ?? null, ref_room: refRoom ?? null,
  });
}
