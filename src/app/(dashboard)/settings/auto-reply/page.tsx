"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Power,
  MessageSquare,
  MessageCircle,
  Shield,
  Zap,
  Clock,
  Gauge,
} from "lucide-react";
import type { AutoReplySettings, AutomationMode } from "@/types";

const MODE_LABELS: Record<AutomationMode, string> = {
  auto_send: "Auto-send",
  auto_draft: "Auto-draft (timed)",
  manual: "Manual approval",
  ignore: "Ignore (no reply)",
};

const MODE_DESCRIPTIONS: Record<AutomationMode, string> = {
  auto_send: "Sends immediately without approval",
  auto_draft: "Creates draft, auto-sends after delay if not reviewed",
  manual: "Creates draft, waits for your approval",
  ignore: "No reply generated",
};

const CLASSIFICATION_LABELS: Record<string, { label: string; description: string }> = {
  dm_faq_mode: {
    label: "FAQ / General Questions",
    description: "Standard questions about trips, hours, location, etc.",
  },
  dm_booking_mode: {
    label: "Booking Inquiries",
    description: "Questions about availability, pricing, reservations",
  },
  dm_compliment_mode: {
    label: "Compliments & Thanks",
    description: "Positive feedback, thank you messages",
  },
  dm_complaint_mode: {
    label: "Complaints",
    description: "Negative feedback, refund requests, issues",
  },
  dm_complex_mode: {
    label: "Complex Questions",
    description: "Multi-part or unclear questions needing human judgment",
  },
  dm_spam_mode: {
    label: "Spam",
    description: "Promotional, suspicious, or irrelevant messages",
  },
};

export default function AutoReplySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AutoReplySettings | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/auto-reply");
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch {
      toast.error("Failed to load auto-reply settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);

    try {
      const res = await fetch("/api/settings/auto-reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("Auto-reply settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof AutoReplySettings>(
    field: K,
    value: AutoReplySettings[K]
  ) {
    setSettings((s) => (s ? { ...s, [field]: value } : s));
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auto-Reply Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control how the AI bot responds to messages and comments
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Save Changes
        </Button>
      </div>

      {/* ── Section 1: Global Controls ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            Global Controls
          </CardTitle>
          <CardDescription>
            Master switch and thresholds that apply to all auto-replies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Kill switch */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={settings.global_auto_reply_enabled}
                onCheckedChange={(checked) =>
                  updateField("global_auto_reply_enabled", checked as boolean)
                }
              />
              <div>
                <label className="text-sm font-medium">Enable Auto-Replies</label>
                <p className="text-xs text-muted-foreground">
                  Turn off to pause all automated responses. Messages will still be stored.
                </p>
              </div>
            </div>
            <Badge variant={settings.global_auto_reply_enabled ? "default" : "secondary"}>
              {settings.global_auto_reply_enabled ? "Active" : "Paused"}
            </Badge>
          </div>

          <Separator />

          {/* Confidence threshold */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">
                Confidence Threshold
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Only auto-send when AI confidence is at or above this level (0.0 – 1.0)
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={1}
                step={0.05}
                className="w-24"
                value={settings.confidence_threshold}
                onChange={(e) =>
                  updateField("confidence_threshold", parseFloat(e.target.value) || 0.75)
                }
              />
              <span className="text-sm text-muted-foreground">
                ({Math.round(settings.confidence_threshold * 100)}%)
              </span>
            </div>
          </div>

          {/* Max per hour */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">
                Max Auto-Replies Per Hour
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Safety limit to prevent runaway replies (Meta limit is 200/hr)
            </p>
            <Input
              type="number"
              min={1}
              max={200}
              className="w-24"
              value={settings.max_auto_replies_per_hour}
              onChange={(e) =>
                updateField(
                  "max_auto_replies_per_hour",
                  parseInt(e.target.value) || 50
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: DM Automation ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            DM Automation
          </CardTitle>
          <CardDescription>
            Control how each type of DM is handled. Choose per category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(CLASSIFICATION_LABELS).map(([field, { label, description }]) => (
            <div key={field} className="flex items-center justify-between gap-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Select
                value={settings[field as keyof AutoReplySettings] as string}
                onValueChange={(value) =>
                  updateField(field as keyof AutoReplySettings, value as AutomationMode)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(MODE_LABELS) as [AutomationMode, string][]).map(
                    ([mode, modeLabel]) => (
                      <SelectItem key={mode} value={mode}>
                        <div>
                          <span>{modeLabel}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            — {MODE_DESCRIPTIONS[mode]}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}

          <Separator />

          {/* Auto-draft delay */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Auto-Draft Delay</label>
            </div>
            <p className="text-xs text-muted-foreground">
              For &ldquo;Auto-draft&rdquo; categories: how many minutes to wait before sending.
              You can edit or cancel the draft during this window.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                className="w-20"
                value={settings.auto_draft_delay_minutes}
                onChange={(e) =>
                  updateField(
                    "auto_draft_delay_minutes",
                    parseInt(e.target.value) || 5
                  )
                }
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Comment Automation ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comment Automation
          </CardTitle>
          <CardDescription>
            Control how the bot replies to Facebook post comments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Comment toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={settings.comment_auto_reply_enabled}
                onCheckedChange={(checked) =>
                  updateField("comment_auto_reply_enabled", checked as boolean)
                }
              />
              <div>
                <label className="text-sm font-medium">
                  Enable Comment Auto-Replies
                </label>
                <p className="text-xs text-muted-foreground">
                  When enabled, the bot replies to relevant comments with a public message + private DM
                </p>
              </div>
            </div>
            <Badge variant={settings.comment_auto_reply_enabled ? "default" : "secondary"}>
              {settings.comment_auto_reply_enabled ? "Active" : "Off"}
            </Badge>
          </div>

          <Separator />

          {/* Public reply text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Public Reply Text</label>
            <p className="text-xs text-muted-foreground">
              This short message gets posted as a public comment reply. The full AI answer goes via DM.
            </p>
            <Textarea
              value={settings.comment_public_reply_text}
              onChange={(e) =>
                updateField("comment_public_reply_text", e.target.value)
              }
              rows={2}
              placeholder="Great question! Check your DMs for the full answer 🎣"
            />
          </div>

          {/* Delay range */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Reply Delay</label>
            </div>
            <p className="text-xs text-muted-foreground">
              Random delay before replying to a comment (makes it look natural)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={5}
                max={120}
                className="w-20"
                value={settings.comment_delay_min_seconds}
                onChange={(e) =>
                  updateField(
                    "comment_delay_min_seconds",
                    parseInt(e.target.value) || 15
                  )
                }
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                min={5}
                max={300}
                className="w-20"
                value={settings.comment_delay_max_seconds}
                onChange={(e) =>
                  updateField(
                    "comment_delay_max_seconds",
                    parseInt(e.target.value) || 45
                  )
                }
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom save button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
