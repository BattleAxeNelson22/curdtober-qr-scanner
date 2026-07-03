import { NextResponse } from "next/server"
import { redeemCode } from "@/lib/codes"

export async function POST(request: Request) {
  let body: { code?: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: "invalid", reason: "bad_format", message: "Invalid request body." }, { status: 400 })
  }

  const code = typeof body.code === "string" ? body.code : ""

  const result = redeemCode(code)

  if (result.status === "valid") {
    return NextResponse.json({ status: "valid", prize: result.prize })
  }

  const messages: Record<string, string> = {
    not_found: "This QR code is not valid.",
    already_used: "This QR code has already been redeemed.",
    bad_format: "This QR code is not in the expected format.",
  }

  return NextResponse.json(
    { status: "invalid", reason: result.reason, message: messages[result.reason] },
    { status: 200 },
  )
}
