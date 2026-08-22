import type { Elector, Institucion } from "@/lib/types";

function CornerMarks() {
  const base = "absolute h-3 w-3 border-blue-400 print:border-blue-700";
  return (
    <>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2`} />
    </>
  );
}

export default function Carnet({
  elector,
  qrSvg,
  institucion,
  fechaProceso,
}: {
  elector: Elector;
  qrSvg: string;
  institucion: Institucion;
  fechaProceso: string;
}) {
  return (
    <div className="relative w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm break-inside-avoid dark:border-zinc-800 dark:bg-zinc-950 print:border-zinc-300 print:bg-white print:shadow-none">
      <div className="flex items-center gap-2 bg-blue-800 px-4 py-3 text-white print:bg-blue-800">
        {institucion.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={institucion.logo_url}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full bg-white object-contain p-0.5"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/15" />
        )}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide">
            {institucion.nombre || "Institución Educativa"}
          </p>
          <p className="truncate text-[10px] text-blue-100">
            {institucion.proceso_electoral || "Proceso Electoral"}
          </p>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-blue-300 via-blue-600 to-blue-300" />

      <div className="px-4 py-4 text-center">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 print:bg-transparent print:text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Credencial Electoral
        </span>

        <div className="relative mx-auto mt-3 h-32 w-32 p-1.5">
          <CornerMarks />
          <div
            className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
            role="img"
            aria-label={`Código QR de ${elector.dni}`}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-50 print:text-black">
          {elector.nombres} {elector.apellidos}
        </p>
        <p className="font-mono text-xs tracking-[0.2em] text-zinc-500 print:text-zinc-700">
          {elector.dni}
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {elector.grado && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 print:border print:border-zinc-300 print:bg-transparent">
              Grado {elector.grado}
            </span>
          )}
          {elector.seccion && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 print:border print:border-zinc-300 print:bg-transparent">
              Sec. {elector.seccion}
            </span>
          )}
          {elector.mesa && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 print:border print:border-zinc-300 print:bg-transparent">
              Mesa {elector.mesa}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-dashed border-zinc-200 px-4 py-2 text-center dark:border-zinc-800 print:border-zinc-300">
        <p className="text-[9px] text-zinc-400">{fechaProceso}</p>
      </div>
    </div>
  );
}
