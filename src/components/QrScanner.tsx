"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOff } from "lucide-react";

const ELEMENT_ID = "qr-reader";

function ViewfinderCorners() {
  const base = "absolute h-8 w-8 border-cyan-400/80";
  return (
    <>
      <span className={`${base} left-4 top-4 border-l-4 border-t-4`} />
      <span className={`${base} right-4 top-4 border-r-4 border-t-4`} />
      <span className={`${base} bottom-4 left-4 border-b-4 border-l-4`} />
      <span className={`${base} bottom-4 right-4 border-b-4 border-r-4`} />
    </>
  );
}

export default function QrScanner({
  active,
  onDetected,
}: {
  active: boolean;
  onDetected: (text: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(ELEMENT_ID, { verbose: false } as never);
    scannerRef.current = scanner;

    async function startScanning() {
      setError(null);
      try {
        let cameraId: string | MediaTrackConstraints = { facingMode: "environment" };
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras.length > 0) cameraId = cameras[0].id;
        } catch {
          // No enumerable cameras yet (permission not granted) — fall back
          // to the constraint-based selector below.
        }

        if (cancelled) return;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: 260 },
          (decodedText) => {
            onDetected(decodedText.trim());
          },
          undefined
        );
      } catch {
        if (!cancelled) {
          setError(
            "No se pudo acceder a la cámara. Verifica los permisos del navegador."
          );
        }
      }
    }

    startScanning();

    return () => {
      cancelled = true;
      const current = scannerRef.current;
      scannerRef.current = null;
      if (current?.isScanning) {
        current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="frame-gradient rounded-3xl shadow-lg shadow-blue-950/10">
        <div className="relative min-h-[280px] w-full overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-slate-950">
          <div id={ELEMENT_ID} className="w-full [&>video]:mx-auto" />
          <ViewfinderCorners />
        </div>
      </div>
      {error && (
        <div className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-rose-600 dark:text-rose-400">
          <CameraOff className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
