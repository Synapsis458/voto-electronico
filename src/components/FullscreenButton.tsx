"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function FullscreenButton() {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    const onChange = () => setActivo(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }}
      aria-label={activo ? "Salir de pantalla completa" : "Ver en pantalla completa"}
      className="fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-slate-200 transition-colors hover:bg-slate-50 print:hidden dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
    >
      {activo ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
    </button>
  );
}
