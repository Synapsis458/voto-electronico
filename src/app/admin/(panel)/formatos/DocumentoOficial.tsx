import type { Institucion } from "@/lib/types";

export function EncabezadoOficial({
  institucion,
  titulo,
  subtitulo,
}: {
  institucion: Institucion;
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-4 border-b-2 border-zinc-900 pb-4 dark:border-zinc-100 print:border-black">
      {institucion.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={institucion.logo_url}
          alt=""
          className="h-16 w-16 shrink-0 object-contain print:h-14 print:w-14"
        />
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 print:text-black">
          {institucion.nombre || "Institución Educativa"}
        </p>
        <p className="text-xs text-zinc-500 print:text-black">
          {institucion.proceso_electoral}
          {institucion.anio_escolar ? ` — Año escolar ${institucion.anio_escolar}` : ""}
        </p>
        <h1 className="mt-1 text-lg font-bold text-zinc-900 print:text-black dark:text-zinc-50">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-sm text-zinc-600 print:text-black dark:text-zinc-400">{subtitulo}</p>
        )}
      </div>
    </div>
  );
}

// Wraps a printable document: white page, black text when printed,
// regardless of the admin panel's light/dark theme.
export function PaginaDocumento({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 dark:border-zinc-800 sm:p-8 print:rounded-none print:border-0 print:p-0 print:text-black">
      {children}
    </div>
  );
}
