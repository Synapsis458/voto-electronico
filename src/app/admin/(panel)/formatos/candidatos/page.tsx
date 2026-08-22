import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import type { Candidato } from "@/lib/types";
import { EncabezadoOficial, PaginaDocumento } from "../DocumentoOficial";
import PrintButton from "../../resultados/PrintButton";

export default async function ListaCandidatosPage() {
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

      <PaginaDocumento>
        <EncabezadoOficial institucion={institucion} titulo="Lista de candidatos" />

        <div className="grid gap-4 sm:grid-cols-2">
          {candidatos.map((c) => (
            <div key={c.id} className="flex gap-3 border-b border-zinc-200 pb-4 print:border-black/30">
              {c.fotografia_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.fotografia_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-full bg-zinc-100 print:border print:border-black" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-zinc-500 print:text-black">#{c.orden}</p>
                <p className="font-semibold text-zinc-900 print:text-black dark:text-zinc-50">
                  {c.nombres} {c.apellidos}
                </p>
                <p className="text-sm text-zinc-600 print:text-black dark:text-zinc-400">{c.agrupacion}</p>
                <p className="font-mono text-xs text-zinc-500 print:text-black">DNI {c.dni}</p>
                {c.simbolo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.simbolo_url} alt="" className="mt-1 h-8 w-8 object-contain" />
                )}
              </div>
            </div>
          ))}
        </div>

        {candidatos.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">Sin candidatos registrados.</p>
        )}
      </PaginaDocumento>
    </div>
  );
}
