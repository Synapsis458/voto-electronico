import Link from "next/link";
import { Vote } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import type { Candidato } from "@/lib/types";
import PrintButton from "../../resultados/PrintButton";

export default async function CartelCandidatosPage() {
  await requireAdmin();
  const institucion = await getInstitucion();

  const { data } = await supabaseAdmin.from("candidatos").select("*").order("orden", { ascending: true });
  const candidatos = (data ?? []) as Candidato[];

  const infoAl = new Date().toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/formatos" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Volver a Formatos
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl border-2 border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 print:max-w-none print:rounded-none print:border-black print:text-black">
        <div className="border-b border-dashed border-zinc-400 px-4 py-1 text-right text-[10px] print:border-black">
          Información al: {infoAl}
        </div>
        <div className="bg-zinc-900 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white print:bg-black">
          PARA SER PEGADO EN LUGARES VISIBLES DE LA INSTITUCIÓN EDUCATIVA
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          {institucion.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institucion.logo_url} alt="" className="h-16 w-16 shrink-0 object-contain" />
          ) : (
            <div className="h-16 w-16 shrink-0" />
          )}
          <div className="flex-1 text-center">
            <p className="text-lg font-extrabold uppercase leading-tight">
              {institucion.proceso_electoral || "Proceso Electoral Escolar"}
            </p>
            <p className="text-sm font-semibold uppercase text-zinc-600 print:text-black">
              {institucion.nombre || "Institución Educativa"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-zinc-900 px-2 py-1.5 text-[9px] font-bold uppercase leading-none print:border-black">
            <Vote className="h-5 w-5" />
            Comité
            <br />
            Electoral
          </div>
        </div>

        <h2 className="border-t-2 border-zinc-900 py-3 text-center text-xl font-extrabold uppercase print:border-black">
          Cartel de candidatos para difusión
        </h2>

        <div
          className="grid gap-px border-t-2 border-zinc-900 bg-zinc-900 print:border-black print:bg-black"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        >
          {candidatos.map((c) => (
            <div key={c.id} className="bg-white p-5">
              <p className="mb-3 text-center text-base font-extrabold uppercase">{c.agrupacion}</p>
              <div className="mb-4 flex items-center justify-center gap-4">
                {c.simbolo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.simbolo_url}
                    alt=""
                    className="h-20 w-20 rounded-full border border-zinc-300 object-contain p-1"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full border border-dashed border-zinc-300" />
                )}
                {c.fotografia_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.fotografia_url} alt="" className="h-20 w-20 object-cover" />
                ) : (
                  <div className="h-20 w-20 border border-dashed border-zinc-300" />
                )}
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-28 py-0.5 font-semibold">Candidato(a)</td>
                    <td className="py-0.5">
                      : {c.nombres} {c.apellidos}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-semibold">DNI</td>
                    <td className="py-0.5">: {c.dni}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-semibold">N.° de cédula</td>
                    <td className="py-0.5">: {c.orden}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {candidatos.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">Sin candidatos registrados.</p>
        )}
      </div>
    </div>
  );
}
