import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRoomTypes, qkTypes } from "@/lib/hostel-queries";
import { PageHeader } from "@/components/hostel/StatCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { data: types = [] } = useQuery({ queryKey: qkTypes, queryFn: fetchRoomTypes });
  const [rents, setRents] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [lateFee, setLateFee] = useState("0");
  const [noticeDays, setNoticeDays] = useState("0");

  async function save() {
    setSaving(true);
    try {
      for (const t of types) {
        const v = rents[t.id];
        if (v == null) continue;
        const num = Number(v);
        if (!Number.isFinite(num)) continue;
        const { error } = await supabase.from("room_types").update({ default_rent: num }).eq("id", t.id);
        if (error) throw error;
      }
      // persist admin settings (single-row table)
      const settingsRow = {
        id: 1,
        admin_email: adminEmail || null,
        contact_phone: contactPhone || null,
        late_fee_pct: Number(lateFee) || 0,
        default_notice_days: Number(noticeDays) || 0,
      };
      const { error: sError } = await supabase.from("settings").upsert(settingsRow, { onConflict: "id" });
      if (sError) throw sError;
      toast.success("Settings saved");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from("settings").select("*").maybeSingle();
        if (data) {
          setAdminEmail(data.admin_email ?? "");
          setContactPhone(data.contact_phone ?? "");
          setLateFee(String(data.late_fee_pct ?? 0));
          setNoticeDays(String(data.default_notice_days ?? 0));
        }
      } catch (e) {
        // ignore load errors for now
      }
    }
    loadSettings();
  }, []);

  return (
    <div>
      <PageHeader title="Settings" description="Default rent per room type. Applied to future admissions." />
      <Card className="glass-card max-w-2xl p-6">
        <div className="space-y-4">
          {types.map((t) => (
            <div key={t.id} className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.capacity} seat(s) per room</p>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Rs.</Label>
                <Input
                  type="number"
                  defaultValue={t.default_rent}
                  onChange={(e) => setRents((r) => ({ ...r, [t.id]: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="h-px my-6 bg-border" />
        <div className="space-y-4">
          <p className="font-semibold">Admin Settings</p>
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Admin email</Label>
              <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-72" />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Contact phone</Label>
              <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-48" />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Late fee (%)</Label>
              <Input type="number" value={lateFee} onChange={(e) => setLateFee(e.target.value)} className="w-24" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Default notice (days)</Label>
              <Input type="number" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} className="w-24" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      </Card>
    </div>
  );
}
