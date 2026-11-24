"use client";

import { useState } from "react";

type Estado =
  | { fase: "inactivo" }
  | { fase: "generando" }
  | { fase: "listo" }
  | { fase: "error"; mensaje: string };

export default function DescargarPdf({ filtro }: { filtro: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "inactivo" });
  const ocupado = estado.fase === "generando";

  async function generar() {
    setEstado({ fase: "generando" });
    try {
      const res = await fetch(`/admin/carnets/pdf${filtro}`, { cache: "no-store" });
      const tipo = res.headers.get("content-type") ?? "";

      if (!res.ok || !tipo.includes("pdf")) {
        let motivo = `HTTP ${res.status}`;
        if (tipo.includes("json")) {
          const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
          if (cuerpo?.error) motivo = cuerpo.error;
        } else if (res.redirected || tipo.includes("html")) {
          motivo = "la sesión expiró o la página está desactualizada; recarga con Ctrl+F5 e inicia sesión.";
        }
        throw new Error(motivo);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carnets-A4.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setEstado({ fase: "listo" });
    } catch (e) {
      setEstado({
        fase: "error",
        mensaje: e instanceof Error ? e.message : "No se pudo generar el PDF.",
      });
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={generar}
        disabled={ocupado}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {ocupado ? "Generando PDF…" : "Generar PDF para imprimir (A4, 9 por hoja)"}
      </button>
      {estado.fase === "listo" && (
        <p className="text-xs text-emerald-600" role="status">
          PDF descargado.
        </p>
      )}
      {estado.fase === "error" && (
        <p className="max-w-xs text-right text-xs text-red-600" role="alert">
          {estado.mensaje}
        </p>
      )}
    </div>
  );
}
