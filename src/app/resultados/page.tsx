import Link from "next/link";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import { ArrowLeft, Radio, Users } from "lucide-react";
import { getInstitucion } from "@/lib/institucion";
import { getResultados } from "@/lib/resultados";
import AutoRefresh from "@/components/AutoRefresh";
import FullscreenButton from "@/components/FullscreenButton";

const sourceSerif = Source_Serif_4({
  variable: "--font-kiosk-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-kiosk-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const dynamic = "force-dynamic";

export default async function ResultadosPublicosPage() {
  const [institucion, r] = await Promise.all([getInstitucion(), getResultados()]);

  const filas = [
    ...r.porCandidato.map((p) => ({
      key: p.candidato.id,
      nombre: `${p.candidato.nombres} ${p.candidato.apellidos}`,
      agrupacion: p.candidato.agrupacion,
      foto: p.candidato.fotografia_url,
      total: p.total,
      porcentaje: p.porcentaje,
    })),
    {
      key: "blanco",
      nombre: "Voto en blanco",
      agrupacion: "",
      foto: "",
      total: r.votosBlanco,
      porcentaje: r.porcentajeBlanco,
    },
  ].sort((a, b) => b.total - a.total);

  const stats = [
    { label: "Electores", value: r.electores },
    { label: "Votantes", value: r.votantes },
    { label: "Participación", value: `${r.participacion}%` },
    { label: "Abstenciones", value: r.abstenciones },
  ];

  return (
    <div
      className={`${sourceSerif.variable} ${sourceSans.variable} relative flex min-h-dvh flex-1 flex-col items-center overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 dark:from-[#0B1220] dark:via-[#0F172A] dark:to-[#0B1220]`}
      style={{ fontFamily: "var(--font-kiosk-sans)" }}
    >
      <AutoRefresh intervalMs={8000} />
      <FullscreenButton />

      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl dark:bg-blue-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-400/10"
      />
      <div aria-hidden className="bg-dot-grid pointer-events-none absolute inset-0" />

      <div className="rd-container relative w-full max-w-3xl transition-[max-width]">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-800 print:hidden dark:text-slate-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la pantalla principal
        </Link>

        <div className="frame-gradient rounded-[2rem] shadow-2xl shadow-blue-950/10">
          <div className="rounded-[calc(2rem-1.5px)] bg-white/90 backdrop-blur-sm dark:bg-slate-900/90">
            <div className="px-6 pb-6 pt-8 text-center sm:px-10 sm:pt-10">
              {institucion.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institucion.logo_url}
                  alt={institucion.nombre}
                  className="mx-auto h-14 w-14 rounded-full bg-white object-contain p-1 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900"
                />
              ) : null}

              <p className="rd-subtitle mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {institucion.nombre || "Institución Educativa"}
              </p>
              <h1
                className="rd-title mt-1 text-balance text-2xl font-bold text-blue-900 sm:text-3xl dark:text-blue-100"
                style={{ fontFamily: "var(--font-kiosk-serif)" }}
              >
                {institucion.proceso_electoral || "Resultados Electorales"}
              </h1>

              <span className="rd-badge mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                EN VIVO — se actualiza automáticamente
              </span>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            <div className="px-6 py-6 sm:px-10">
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
                  >
                    <p className="rd-stat-label text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    <p className="rd-stat-value mt-1 text-xl font-bold text-blue-900 dark:text-blue-200">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {filas.map((fila) => (
                  <div
                    key={fila.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      {fila.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fila.foto}
                          alt=""
                          className="rd-photo h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100 transition-[height,width] dark:ring-slate-800"
                        />
                      ) : (
                        <div className="rd-photo flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-[height,width] dark:bg-slate-800">
                          <Users className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="rd-row-name truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {fila.nombre}
                        </p>
                        {fila.agrupacion && (
                          <p className="rd-row-agrupacion truncate text-xs text-slate-500 dark:text-slate-400">
                            {fila.agrupacion}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="rd-row-total text-sm font-bold text-blue-900 dark:text-blue-200">
                          {fila.total}
                        </p>
                        <p className="rd-row-pct text-xs text-slate-500 dark:text-slate-400">
                          {fila.porcentaje}%
                        </p>
                      </div>
                    </div>
                    <div className="rd-bar h-2 w-full overflow-hidden rounded-full bg-slate-100 transition-[height] dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-700 to-cyan-500 transition-all duration-700"
                        style={{ width: `${Math.min(fila.porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {filas.every((f) => f.total === 0) && (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Aún no se han registrado votos.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
