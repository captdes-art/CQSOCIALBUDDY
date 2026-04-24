import crypto from "crypto";

/**
 * Verify that a webhook request actually came from Meta.
 * Uses HMAC-SHA256 signature verification with the app secret.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature) return false;

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(payload).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle the webhook verification challenge from Meta.
 * Meta sends a GET request with mode, token, and challenge params.
 */
export function handleVerificationChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string
): { status: number; body: string } {
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return { status: 200, body: challenge };
  }
  return { status: 403, body: "Forbidden" };
}
