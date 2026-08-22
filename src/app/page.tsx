import Link from "next/link";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import { BarChart3, Settings, CalendarDays, ShieldCheck } from "lucide-react";
import { getInstitucion } from "@/lib/institucion";
import { obtenerCandidatos } from "@/app/actions/votacion";
import VotingFlow from "@/components/VotingFlow";
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

export default async function Home() {
  const [institucion, candidatos] = await Promise.all([
    getInstitucion(),
    obtenerCandidatos(),
  ]);

  const fechaFormateada = institucion.fecha_proceso
    ? new Date(institucion.fecha_proceso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`${sourceSerif.variable} ${sourceSans.variable} relative flex flex-1 flex-col items-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 dark:from-[#0B1220] dark:via-[#0F172A] dark:to-[#0B1220]`}
      style={{ fontFamily: "var(--font-kiosk-sans)" }}
    >
      {/* Decorative background: soft brand-color blobs + a faint dot texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl dark:bg-blue-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-400/10"
      />
      <div aria-hidden className="bg-dot-grid pointer-events-none absolute inset-0" />

      <div className="relative w-full max-w-2xl">
        {/* The frame: thin gradient border wrapping a glass card */}
        <div className="frame-gradient rounded-[2rem] shadow-2xl shadow-blue-950/10">
          <div className="rounded-[calc(2rem-1.5px)] bg-white/90 backdrop-blur-sm dark:bg-slate-900/90">
            <div className="px-6 pb-6 pt-8 text-center sm:px-10 sm:pt-10">
              {institucion.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institucion.logo_url}
                  alt={institucion.nombre}
                  className="mx-auto h-16 w-16 rounded-full bg-white object-contain p-1 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900"
                />
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-800 shadow-sm ring-2 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
                  <ShieldCheck className="h-7 w-7" />
                </div>
              )}

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {institucion.nombre || "Institución Educativa"}
              </p>
              <h1
                className="mt-1 text-balance text-2xl font-bold text-blue-900 sm:text-3xl dark:text-blue-100"
                style={{ fontFamily: "var(--font-kiosk-serif)" }}
              >
                {institucion.proceso_electoral || "Sistema de Voto Electrónico Escolar"}
              </h1>

              <div
                aria-hidden
                className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent dark:via-blue-500"
              />

              {institucion.mensaje_bienvenida && (
                <p className="mx-auto mt-4 max-w-lg text-balance text-slate-600 dark:text-slate-300">
                  {institucion.mensaje_bienvenida}
                </p>
              )}

              {fechaFormateada && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {fechaFormateada}
                </span>
              )}

              {institucion.foto_portada_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institucion.foto_portada_url}
                  alt=""
                  className="mt-6 max-h-56 w-full rounded-2xl object-cover shadow-inner"
                />
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800" />

            <div className="px-6 py-8 sm:px-10">
              <VotingFlow candidatos={candidatos} />
            </div>
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Tu voto es confidencial y seguro
        </p>
      </div>

      <FullscreenButton posicion="right-36 top-4" />

      <Link
        href="/resultados"
        aria-label="Resultados en vivo"
        className="fixed right-20 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
      >
        <BarChart3 className="h-5 w-5" />
      </Link>

      <Link
        href="/admin"
        aria-label="Configuración"
        className="fixed right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </div>
  );
}
