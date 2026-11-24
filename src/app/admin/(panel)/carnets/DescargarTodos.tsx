"use client";

import { useState } from "react";
import JSZip from "jszip";

type Estado =
  | { fase: "inactivo" }
  | { fase: "descargando"; hechos: number; total: number }
  | { fase: "comprimiendo" }
  | { fase: "listo"; total: number; fallidos: number }
  | { fase: "error"; mensaje: string };

const SIMULTANEAS = 4;
const REINTENTOS = 3;

async function pedirJpg(id: string): Promise<Blob> {
  let ultimoError: unknown;
  for (let intento = 0; intento < REINTENTOS; intento++) {
    try {
      const res = await fetch(`/admin/carnets/${id}/download`, { cache: "no-store" });
      const tipo = res.headers.get("content-type") ?? "";
      if (res.ok && tipo.startsWith("image/")) return await res.blob();
      ultimoError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      ultimoError = e;
    }
    await new Promise((r) => setTimeout(r, 500 * (intento + 1)));
  }
  throw ultimoError;
}

// El ZIP se arma en el navegador: el servidor solo genera un JPG por vez.
// Así no depende del tiempo máximo ni del tamaño de respuesta del hosting.
export default function DescargarTodos({ filtro }: { filtro: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "inactivo" });
  const ocupado = estado.fase === "descargando" || estado.fase === "comprimiendo";

  async function descargar() {
    setEstado({ fase: "descargando", hechos: 0, total: 0 });
    try {
      const resLista = await fetch(`/admin/carnets/lista${filtro}`, { cache: "no-store" });
      if (!resLista.ok) throw new Error("No se pudo obtener la lista de electores.");
      const { electores } = (await resLista.json()) as {
        electores: { id: string; dni: string }[];
      };
      if (electores.length === 0) throw new Error("No hay electores para descargar.");

      const zip = new JSZip();
      let hechos = 0;
      let fallidos = 0;
      let siguiente = 0;
      setEstado({ fase: "descargando", hechos: 0, total: electores.length });

      async function trabajador() {
        while (siguiente < electores.length) {
          const e = electores[siguiente++];
          try {
            zip.file(`carnet-${e.dni}.jpg`, await pedirJpg(e.id));
          } catch {
            fallidos++;
          }
          hechos++;
          setEstado({ fase: "descargando", hechos, total: electores.length });
        }
      }
      await Promise.all(Array.from({ length: SIMULTANEAS }, trabajador));

      if (fallidos === electores.length) {
        throw new Error("No se pudo generar ningún carnet. Vuelve a iniciar sesión e inténtalo de nuevo.");
      }

      setEstado({ fase: "comprimiendo" });
      // JPG ya está comprimido: se guarda sin recomprimir para ir más rápido.
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carnets.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setEstado({ fase: "listo", total: electores.length - fallidos, fallidos });
    } catch (e) {
      setEstado({
        fase: "error",
        mensaje: e instanceof Error ? e.message : "No se pudo completar la descarga.",
      });
    }
  }

  const porcentaje =
    estado.fase === "descargando" && estado.total > 0
      ? Math.round((estado.hechos / estado.total) * 100)
      : estado.fase === "comprimiendo"
        ? 100
        : 0;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={descargar}
        disabled={ocupado}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {ocupado ? "Preparando ZIP…" : "Descargar todos (ZIP de JPG)"}
      </button>

      {ocupado && (
        <div className="w-56 text-right text-xs text-zinc-500" role="status">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="mt-1">
            {estado.fase === "descargando"
              ? estado.total > 0
                ? `Generando carnets ${estado.hechos} de ${estado.total}…`
                : "Obteniendo lista de electores…"
              : "Armando el archivo ZIP…"}
          </p>
        </div>
      )}

      {estado.fase === "listo" && (
        <p className="text-xs text-emerald-600" role="status">
          ZIP descargado con {estado.total} carnets.
          {estado.fallidos > 0 && (
            <span className="text-red-600"> No se pudieron generar {estado.fallidos}; vuelve a intentarlo.</span>
          )}
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
