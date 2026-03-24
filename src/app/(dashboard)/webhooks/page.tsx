"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  Webhook,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface WebhookSubscription {
  name: string;
  subscribed_fields: string[];
}

interface WebhookEvent {
  id: string;
  platform: string;
  event_type: string;
  page_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

export default function WebhooksPage() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [page, setPage] = useState<{ id: string; name: string } | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/meta/pages/webhooks");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setPage(data.page || null);
    } catch {
      toast.error("Failed to load webhook subscriptions");
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/meta/webhook-events?limit=50");
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast.error("Failed to load webhook events");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
    loadEvents();
  }, [loadSubscriptions, loadEvents]);

  async function handleRefreshSubscriptions() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/meta/pages/webhooks", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Webhook subscriptions refreshed");
      await loadSubscriptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhook Management</h1>
          {page && (
            <p className="text-sm text-muted-foreground mt-1">
              Page: {page.name} (ID: {page.id})
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadSubscriptions(); loadEvents(); }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Webhook Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Subscriptions
          </CardTitle>
          <CardDescription className="text-xs">
            Fields your app is subscribed to receive from Meta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSubs ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !page ? (
            <p className="text-sm text-muted-foreground">
              No Facebook Page connected. Go to Settings &gt; Integrations to connect.
            </p>
          ) : subscriptions.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No active subscriptions found.
              </p>
              <Button
                size="sm"
                onClick={handleRefreshSubscriptions}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Webhook className="h-4 w-4 mr-1" />
                )}
                Subscribe to Events
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.name} className="p-3 rounded-lg border">
                  <p className="text-sm font-medium">{sub.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sub.subscribed_fields.map((field) => (
                      <Badge key={field} variant="outline" className="text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshSubscriptions}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh Subscriptions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Webhook Events
            {events.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {events.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Live feed of incoming webhook events from Meta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No webhook events yet. Events will appear here when your Page receives messages or comments.
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={event.platform === "facebook" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {event.platform === "facebook" ? "Facebook" : "Instagram"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {event.event_type}
                      </Badge>
                      {event.page_id && (
                        <span className="text-[10px] text-muted-foreground">
                          Page: {event.page_id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {JSON.stringify(event.payload).slice(0, 120)}...
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
