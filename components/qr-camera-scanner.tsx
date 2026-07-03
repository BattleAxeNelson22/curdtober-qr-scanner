"use client"

import { useEffect, useRef, useState } from "react"
import QrScanner from "qr-scanner"
import { CameraOff } from "lucide-react"

type QrCameraScannerProps = {
  active: boolean
  onScan: (value: string) => void
}

export function QrCameraScanner({ active, onScan }: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState<string | null>(null)

  // Keep the latest callback without re-initializing the scanner.
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!active) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false

    const scanner = new QrScanner(
      video,
      (result) => {
        onScanRef.current(result.data)
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
        maxScansPerSecond: 5,
      },
    )
    scannerRef.current = scanner

    scanner
      .start()
      .then(() => {
        if (cancelled) scanner.stop()
      })
      .catch((err) => {
        console.log("[v0] camera start error:", err?.message ?? err)
        setError("Unable to access the camera. Check permissions or use manual entry below.")
      })

    return () => {
      cancelled = true
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [active])

  if (error) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted p-6 text-center">
        <CameraOff className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground text-pretty">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-black">
      {/* qr-scanner attaches to this video element */}
      <video ref={videoRef} className="size-full object-cover" aria-label="QR code camera preview" />
    </div>
  )
}
