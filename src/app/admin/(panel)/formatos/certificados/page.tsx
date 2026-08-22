import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import type { MiembroMesa } from "@/lib/types";
import PrintButton from "../../resultados/PrintButton";

export default async function CertificadosPage() {
  await requireAdmin();
  const institucion = await getInstitucion();

  const { data } = await supabaseAdmin
    .from("miembros_mesa")
    .select("*")
    .order("mesa", { ascending: true })
    .order("cargo", { ascending: true });
  const miembros = (data ?? []) as MiembroMesa[];

  return (
    <div>
      {/* Cada certificado ocupa su propia hoja apaisada al imprimir. */}
      <style>{"@media print { @page { size: landscape; } }"}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/formatos" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Volver a Formatos
        </Link>
        <PrintButton />
      </div>
      <p className="mb-4 text-xs text-zinc-500 print:hidden">
        Un certificado por cada miembro de mesa registrado en Institución.
        Regístralos ahí (con su cargo y número de mesa) para que aparezcan
        aquí.
      </p>

      <div className="flex flex-col gap-8">
        {miembros.map((m, i) => (
          <div
            key={m.id}
            className={`mx-auto w-full max-w-3xl rounded-[2.5rem] border-4 border-blue-900 bg-white p-10 text-center text-zinc-900 print:rounded-[2.5rem] print:border-black print:text-black ${
              i < miembros.length - 1 ? "print:break-after-page" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              {institucion.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={institucion.logo_url} alt="" className="h-20 w-20 object-contain" />
              ) : (
                <div className="h-20 w-20" />
              )}
              <h1 className="mt-4 text-3xl font-bold uppercase tracking-widest">Certificado</h1>
              {institucion.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={institucion.logo_url} alt="" className="h-20 w-20 object-contain" />
              ) : (
                <div className="h-20 w-20" />
              )}
            </div>

            <p className="mt-10 text-left text-sm">
              El director/a de la I.E.{" "}
              <strong>{institucion.nombre || "____________________"}</strong>:
            </p>

            <p className="mt-8 text-left text-sm">
              Otorga a{" "}
              <span className="font-bold uppercase underline decoration-1 underline-offset-4">
                {m.nombres} {m.apellidos}
              </span>
            </p>

            <p className="mx-auto mt-10 max-w-xl text-sm leading-relaxed">
              En agradecimiento por su participación como{" "}
              <strong>
                {m.cargo} de Mesa{m.mesa ? ` N° ${m.mesa}` : ""}
              </strong>{" "}
              en las <strong>{institucion.proceso_electoral || "Elecciones Escolares"}</strong>
              {institucion.anio_escolar ? ` — Año ${institucion.anio_escolar}` : ""}.
            </p>

            <div className="mt-16 flex justify-center">
              <div className="text-center text-xs">
                <div className="w-56 border-t border-zinc-900 pt-1 print:border-black">
                  {institucion.director || "Firma del Director/a"}
                </div>
                <p className="mt-0.5 text-zinc-500 print:text-black">
                  Firma del Director/a
                  <br />
                  (Nombres y apellidos)
                </p>
              </div>
            </div>
          </div>
        ))}

        {miembros.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Sin miembros de mesa registrados todavía. Ve a Institución para
            registrarlos.
          </p>
        )}
      </div>
    </div>
  );
}
