"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    complaint_sms: true,
    complaint_phone: "",
    daily_summary_email: true,
    daily_summary_address: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const row = data as {
          complaint_sms: boolean;
          complaint_phone: string | null;
          daily_summary_email: boolean;
          daily_summary_address: string | null;
        };
        setSettings({
          complaint_sms: row.complaint_sms,
          complaint_phone: row.complaint_phone || "",
          daily_summary_email: row.daily_summary_email,
          daily_summary_address: row.daily_summary_address || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notification_settings")
      .upsert({
        user_id: user.id,
        ...settings,
      });

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you get notified about important messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={settings.complaint_sms}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, complaint_sms: checked as boolean }))
              }
            />
            <label className="text-sm">SMS alert for complaints</label>
          </div>
          {settings.complaint_sms && (
            <Input
              placeholder="Phone number for SMS alerts"
              value={settings.complaint_phone}
              onChange={(e) =>
                setSettings((s) => ({ ...s, complaint_phone: e.target.value }))
              }
            />
          )}

          <div className="flex items-center gap-3 mt-4">
            <Checkbox
              checked={settings.daily_summary_email}
              onCheckedChange={(checked) =>
                setSettings((s) => ({
                  ...s,
                  daily_summary_email: checked as boolean,
                }))
              }
            />
            <label className="text-sm">Daily summary email</label>
          </div>
          {settings.daily_summary_email && (
            <Input
              type="email"
              placeholder="Email for daily summaries"
              value={settings.daily_summary_address}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  daily_summary_address: e.target.value,
                }))
              }
            />
          )}

          <Button onClick={handleSave} disabled={saving} className="mt-4">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
