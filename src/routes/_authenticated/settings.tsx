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
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const { data: types = [] } = useQuery({ queryKey: qkTypes, queryFn: fetchRoomTypes });
  const [rents, setRents] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
      toast.success("Settings saved");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

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
        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      </Card>
    </div>
  );
}
