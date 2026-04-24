"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { usePlatformAccounts } from "@/hooks/use-platform-accounts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading } = usePlatformAccounts();
  const [disconnecting, setDisconnecting] = useState(false);

  const error = searchParams.get("error");
  const connected = searchParams.get("connected");

  const fbAccount = accounts?.find((a) => a.platform === "facebook");
  const igAccount = accounts?.find((a) => a.platform === "instagram");
  const isConnected = !!fbAccount;

  // Handle OAuth redirect results
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (connected === "true") {
      toast.success("Connected to Facebook & Instagram!");
      queryClient.invalidateQueries({ queryKey: ["platform-accounts"] });
      window.history.replaceState({}, "", "/settings/integrations");
    }
  }, [error, connected, queryClient]);

  function handleConnect() {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (!appId) {
      toast.error("META_APP_ID is not configured");
      return;
    }
    const redirectUri = `${window.location.origin}/api/meta/auth/callback`;
    const configId = "801906359657326";

    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code&override_default_response_type=true`;
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/meta/auth/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success("Disconnected from Facebook");
      queryClient.invalidateQueries({ queryKey: ["platform-accounts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>

      {/* Show OAuth errors persistently so they can't be missed */}
      {error && (
        <div className="p-3 rounded-lg border-2 border-red-500 bg-red-50 text-sm">
          <p className="font-semibold text-red-700">Connection Error:</p>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* ── Meta Connection ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook & Instagram
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Badge variant={isConnected ? "default" : "secondary"} className="text-[10px]">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </>
                )}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Connect your Facebook Page to manage Messenger, Instagram DMs, comments, and engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Facebook Page</p>
                    <p className="text-xs text-muted-foreground">
                      {fbAccount.account_name} (ID: {fbAccount.platform_account_id})
                    </p>
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                {igAccount && (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Instagram Account</p>
                      <p className="text-xs text-muted-foreground">
                        @{igAccount.account_name} (ID: {igAccount.platform_account_id})
                      </p>
                    </div>
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                )}

                {fbAccount.permissions_granted && (
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Permissions Granted</p>
                    <div className="flex flex-wrap gap-1">
                      {fbAccount.permissions_granted.map((perm: string) => (
                        <Badge key={perm} variant="outline" className="text-[10px]">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive hover:text-destructive"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <LogOut className="h-4 w-4 mr-1" />
                )}
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                <Facebook className="h-4 w-4 mr-2" />
                Connect with Facebook
              </Button>
              <p className="text-xs text-muted-foreground">
                This will request permissions for Pages, Messenger, Instagram, and engagement data.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Other Integrations ── */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <span className="text-2xl">🤖</span>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              Custom RAG Knowledge Base
              <Badge variant="default" className="text-[10px]">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              AI response generation via Celtic Quest Voice AI RAG endpoint
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              GoHighLevel
              <Badge variant="secondary" className="text-[10px]">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              SMS notifications for complaints and daily summaries
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <span className="text-2xl">🎣</span>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              Charter Booker Pro
              <Badge variant="secondary" className="text-[10px]">
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Booking links included in AI responses
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
