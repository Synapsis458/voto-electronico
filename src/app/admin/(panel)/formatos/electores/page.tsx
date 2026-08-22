import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import type { Elector } from "@/lib/types";
import { EncabezadoOficial, PaginaDocumento } from "../DocumentoOficial";
import PrintButton from "../../resultados/PrintButton";

export default async function ListaElectoresPage({
  searchParams,
}: {
  searchParams: Promise<{ grado?: string; seccion?: string; mesa?: string }>;
}) {
  await requireAdmin();
  const { grado, seccion, mesa } = await searchParams;
  const institucion = await getInstitucion();

  let query = supabaseAdmin.from("electores").select("*").order("apellidos", { ascending: true });
  if (grado) query = query.eq("grado", grado);
  if (seccion) query = query.eq("seccion", seccion);
  if (mesa) query = query.eq("mesa", mesa);
  const { data } = await query.limit(1000);
  const electores = (data ?? []) as Elector[];

  const subtitulo = [grado && `Grado ${grado}`, seccion && `Sección ${seccion}`, mesa && `Mesa ${mesa}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/formatos" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Volver a Formatos
        </Link>
        <PrintButton />
      </div>

      <form className="mb-4 flex flex-wrap gap-2 print:hidden" method="get">
        <input
          name="grado"
          defaultValue={grado}
          placeholder="Grado"
          className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="seccion"
          defaultValue={seccion}
          placeholder="Sección"
          className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="mesa"
          defaultValue={mesa}
          placeholder="Mesa"
          className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
          Filtrar
        </button>
        {(grado || seccion || mesa) && (
          <Link
            href="/admin/formatos/electores"
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Limpiar
          </Link>
        )}
      </form>

      <PaginaDocumento>
        <EncabezadoOficial
          institucion={institucion}
          titulo="Lista de electores"
          subtitulo={subtitulo || undefined}
        />

        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-300 print:border-black">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">DNI</th>
              <th className="py-2 pr-2">Apellidos y nombres</th>
              <th className="py-2 pr-2">Grado</th>
              <th className="py-2 pr-2">Sección</th>
              <th className="py-2 pr-2">Mesa</th>
              <th className="py-2 pr-2">Firma</th>
            </tr>
          </thead>
          <tbody>
            {electores.map((e, i) => (
              <tr key={e.id} className="border-b border-zinc-200 print:border-black/30">
                <td className="py-2 pr-2 text-zinc-500">{i + 1}</td>
                <td className="py-2 pr-2 font-mono">{e.dni}</td>
                <td className="py-2 pr-2">
                  {e.apellidos}, {e.nombres}
                </td>
                <td className="py-2 pr-2">{e.grado}</td>
                <td className="py-2 pr-2">{e.seccion}</td>
                <td className="py-2 pr-2">{e.mesa}</td>
                <td className="py-2 pr-2 w-32 border-b border-zinc-400 print:border-black" />
              </tr>
            ))}
          </tbody>
        </table>

        {electores.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-500">Sin electores registrados.</p>
        )}

        <p className="mt-6 text-xs text-zinc-500 print:text-black">
          Total: {electores.length} elector{electores.length === 1 ? "" : "es"}.
        </p>
      </PaginaDocumento>
    </div>
  );
}
