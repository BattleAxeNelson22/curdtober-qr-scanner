"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { CheckCircle2, XCircle, Loader2, QrCode, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QrCameraScanner } from "@/components/qr-camera-scanner"

type Prize = {
  id: string
  name: string
  description: string
  image: string
}

type Screen =
  | { view: "scan" }
  | { view: "loading" }
  | { view: "success"; prize: Prize }
  | { view: "error"; message: string }

export function RedeemScanner() {
  const [screen, setScreen] = useState<Screen>({ view: "scan" })
  const [manualCode, setManualCode] = useState("")
  // Guard so a burst of camera scans only triggers one request.
  const submittingRef = useRef(false)

  const redeem = useCallback(async (code: string) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setScreen({ view: "loading" })

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (data.status === "valid") {
        setScreen({ view: "success", prize: data.prize })
      } else {
        setScreen({ view: "error", message: data.message ?? "The QR code was bad." })
      }
    } catch {
      setScreen({ view: "error", message: "Something went wrong. Please try again." })
    } finally {
      submittingRef.current = false
    }
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    redeem(manualCode)
  }

  const reset = () => {
    setManualCode("")
    submittingRef.current = false
    setScreen({ view: "scan" })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <header className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <QrCode className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-balance">Scan &amp; Win</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Point your camera at a QR code, or enter the 6-digit code to reveal your prize.
        </p>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        {screen.view === "scan" && (
          <div className="flex flex-col gap-6">
            <QrCameraScanner active onScan={redeem} />

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">or enter manually</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <label htmlFor="code" className="sr-only">
                6-digit code
              </label>
              <input
                id="code"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                autoComplete="off"
                placeholder="000000"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-center text-2xl font-semibold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="lg" disabled={manualCode.length !== 6} className="w-full">
                <ScanLine className="size-4" aria-hidden="true" />
                Redeem Code
              </Button>
            </form>
          </div>
        )}

        {screen.view === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="size-10 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Checking your code…</p>
          </div>
        )}

        {screen.view === "success" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="size-6" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-wide">You won!</span>
            </div>
            <div className="relative aspect-square w-56 overflow-hidden rounded-2xl border border-border bg-muted">
              <Image
                src={screen.prize.image || "/placeholder.svg"}
                alt={screen.prize.name}
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-balance">{screen.prize.name}</h2>
              <p className="text-sm text-muted-foreground text-pretty">{screen.prize.description}</p>
            </div>
            <Button onClick={reset} size="lg" className="w-full">
              Scan Another Code
            </Button>
          </div>
        )}

        {screen.view === "error" && (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-9" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-balance">Bad QR Code</h2>
              <p className="text-sm text-muted-foreground text-pretty">{screen.message}</p>
            </div>
            <Button onClick={reset} size="lg" variant="secondary" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
