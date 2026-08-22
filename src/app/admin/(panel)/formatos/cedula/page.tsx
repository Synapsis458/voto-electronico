import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import type { Candidato } from "@/lib/types";
import PrintButton from "../../resultados/PrintButton";

export default async function CedulaVotacionPage() {
  await requireAdmin();
  const institucion = await getInstitucion();

  const { data } = await supabaseAdmin.from("candidatos").select("*").order("orden", { ascending: true });
  const candidatos = (data ?? []) as Candidato[];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/formatos" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Volver a Formatos
        </Link>
        <PrintButton />
      </div>
      <p className="mb-4 text-xs text-zinc-500 print:hidden">
        Formato físico de respaldo — la votación digital usa la pantalla principal. Imprime
        copias en blanco para usar como cédula de contingencia.
      </p>

      <div className="mx-auto max-w-md rounded-2xl border-2 border-zinc-900 bg-white p-6 text-zinc-900 dark:border-zinc-100 print:max-w-none print:rounded-none print:border-black print:text-black">
        <div className="mb-4 text-center">
          {institucion.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institucion.logo_url} alt="" className="mx-auto h-14 w-14 object-contain" />
          ) : null}
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide">
            {institucion.nombre || "Institución Educativa"}
          </p>
          <h1 className="text-lg font-bold">Cédula de votación</h1>
          <p className="text-sm">{institucion.proceso_electoral}</p>
        </div>

        <div className="divide-y divide-dashed divide-zinc-400 border-y-2 border-zinc-900 print:border-black">
          {candidatos.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-3">
              {c.fotografia_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.fotografia_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full border border-zinc-400" />
              )}
              {c.simbolo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.simbolo_url} alt="" className="h-8 w-8 shrink-0 object-contain" />
              ) : (
                <div className="h-8 w-8 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {c.nombres} {c.apellidos}
                </p>
                <p className="truncate text-xs">{c.agrupacion}</p>
              </div>
              <div className="h-8 w-8 shrink-0 rounded-full border-2 border-zinc-900 print:border-black" />
            </div>
          ))}

          <div className="flex items-center gap-3 py-3">
            <div className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Voto en blanco</p>
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full border-2 border-zinc-900 print:border-black" />
          </div>
        </div>

        {candidatos.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">Sin candidatos registrados.</p>
        )}
      </div>
    </div>
  );
}
