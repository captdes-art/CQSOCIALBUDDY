"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IntegrationsPage() {
  // In production, these would check actual connection status
  const integrations = [
    {
      name: "Facebook Messenger",
      description: "Receive and reply to Facebook Messenger DMs",
      status: false, // Will be true once connected
      setupUrl: "https://developers.facebook.com",
      icon: "📘",
    },
    {
      name: "Instagram Direct",
      description: "Receive and reply to Instagram Direct Messages",
      status: false,
      setupUrl: "https://developers.facebook.com",
      icon: "📸",
    },
    {
      name: "Custom RAG Knowledge Base",
      description: "AI response generation via Celtic Quest Voice AI RAG endpoint",
      status: true,
      setupUrl: "https://celtic-quest-voice-ai.vercel.app",
      icon: "🤖",
    },
    {
      name: "GoHighLevel",
      description: "SMS notifications for complaints and daily summaries",
      status: false,
      icon: "📱",
    },
    {
      name: "Charter Booker Pro",
      description: "Booking links included in AI responses",
      status: false,
      icon: "🎣",
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Integrations</h1>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <span className="text-2xl">{integration.icon}</span>
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {integration.name}
                  <Badge
                    variant={integration.status ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {integration.status ? (
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
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {integration.description}
                </CardDescription>
              </div>
            </CardHeader>
            {integration.setupUrl && !integration.status && (
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={integration.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Set up
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta App Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to developers.facebook.com and create a new app (type: Business)</li>
            <li>Add Messenger and Instagram products to your app</li>
            <li>Connect your Celtic Quest Facebook Page</li>
            <li>Connect your Instagram Business Account</li>
            <li>Configure webhooks to point to your app&apos;s webhook URL</li>
            <li>Request pages_messaging and instagram_manage_messages permissions</li>
            <li>Submit for App Review (allow 2+ weeks)</li>
            <li>Generate a Page Access Token and add it to your environment variables</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
