import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/meta/auth/pages
 * Returns the list of pages from the OAuth cookie so the page picker can display them.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("meta_oauth_data");

  if (!cookie?.value) {
    return NextResponse.json(
      { error: "No OAuth data found. Please connect with Facebook first." },
      { status: 400 }
    );
  }

  try {
    const data = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    return NextResponse.json({
      pages: data.pages,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid OAuth data" },
      { status: 400 }
    );
  }
}
