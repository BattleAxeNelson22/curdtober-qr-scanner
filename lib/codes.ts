// Mock in-memory store of redeemable codes -> prizes.
// NOTE: This is mock data. It lives in memory and resets when the server
// restarts (and is not shared across serverless instances). Swap this out
// for a real database (e.g. Neon) when you're ready to go to production.

export type Prize = {
  id: string
  name: string
  description: string
  image: string
}

export type CodeRecord = {
  code: string
  prize: Prize
  burned: boolean
}

const PRIZES: Record<string, Prize> = {
  coffee: {
    id: "coffee",
    name: "Free Coffee",
    description: "One free coffee of your choice, on the house.",
    image: "/prizes/free-coffee.png",
  },
  giftCard: {
    id: "giftCard",
    name: "$50 Gift Card",
    description: "A $50 gift card to spend however you like.",
    image: "/prizes/gift-card.png",
  },
  headphones: {
    id: "headphones",
    name: "Wireless Headphones",
    description: "A brand-new pair of wireless over-ear headphones.",
    image: "/prizes/headphones.png",
  },
}

// Seed some valid 6-digit codes. Use `globalThis` so the map survives
// hot-reloads in development.
function seed(): Map<string, CodeRecord> {
  const map = new Map<string, CodeRecord>()
  const entries: Array<[string, Prize]> = [
    ["123456", PRIZES.coffee],
    ["234567", PRIZES.giftCard],
    ["345678", PRIZES.headphones],
    ["111111", PRIZES.coffee],
    ["999999", PRIZES.giftCard],
  ]
  for (const [code, prize] of entries) {
    map.set(code, { code, prize, burned: false })
  }
  return map
}

const g = globalThis as unknown as { __codeStore?: Map<string, CodeRecord> }

export const codeStore: Map<string, CodeRecord> = g.__codeStore ?? seed()
if (!g.__codeStore) g.__codeStore = codeStore

export type RedeemResult =
  | { status: "valid"; prize: Prize }
  | { status: "invalid"; reason: "not_found" | "already_used" | "bad_format" }

// Validate and burn a code atomically. Since this is a single-threaded
// in-memory store, reading + writing here is effectively atomic per request.
export function redeemCode(rawCode: string): RedeemResult {
  const code = rawCode.trim()

  if (!/^\d{6}$/.test(code)) {
    return { status: "invalid", reason: "bad_format" }
  }

  const record = codeStore.get(code)
  if (!record) {
    return { status: "invalid", reason: "not_found" }
  }

  if (record.burned) {
    return { status: "invalid", reason: "already_used" }
  }

  // Burn it.
  record.burned = true
  codeStore.set(code, record)

  return { status: "valid", prize: record.prize }
}
