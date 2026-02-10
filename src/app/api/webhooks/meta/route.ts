import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  handleVerificationChallenge,
} from "@/lib/meta/webhooks";
import { processIncomingMessage } from "@/lib/ai/processor";
import type { MetaWebhookPayload, Platform } from "@/types";

/**
 * GET — Meta webhook verification challenge.
 * Meta sends this when you first set up the webhook subscription.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN!;
  const result = handleVerificationChallenge(mode, token, challenge, verifyToken);

  return new NextResponse(result.body, { status: result.status });
}

/**
 * POST — Receive incoming messages from Meta.
 * Returns 200 immediately, then processes async.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET!;

  // Verify the request came from Meta
  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: MetaWebhookPayload = JSON.parse(rawBody);

  // Determine platform from payload
  const platform: Platform =
    payload.object === "instagram" ? "instagram_dm" : "facebook_messenger";

  // Process each entry (message event)
  for (const entry of payload.entry) {
    const messagingEvents = entry.messaging || [];

    for (const event of messagingEvents) {
      if (!event.message?.text) continue; // skip non-text messages for now

      // Fire and forget — don't block the webhook response
      processIncomingMessage({
        platform,
        senderId: event.sender.id,
        recipientId: event.recipient.id,
        messageId: event.message.mid,
        text: event.message.text,
        timestamp: event.timestamp,
      }).catch((err) => {
        console.error("Error processing message:", err);
      });
    }
  }

  // Return 200 immediately as Meta requires
  return NextResponse.json({ status: "ok" });
}
