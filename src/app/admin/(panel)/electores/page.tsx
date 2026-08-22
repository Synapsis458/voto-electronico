import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Elector } from "@/lib/types";
import ElectorForm from "./ElectorForm";
import ImportForm from "./ImportForm";
import ToggleVotoButton from "./ToggleVotoButton";
import { deleteElector } from "./actions";

export default async function ElectoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    grado?: string;
    seccion?: string;
    mesa?: string;
  }>;
}) {
  await requireAdmin();
  const { q, grado, seccion, mesa } = await searchParams;

  let query = supabaseAdmin
    .from("electores")
    .select("*")
    .order("apellidos", { ascending: true });

  if (q) query = query.or(`dni.ilike.%${q}%,apellidos.ilike.%${q}%,nombres.ilike.%${q}%`);
  if (grado) query = query.eq("grado", grado);
  if (seccion) query = query.eq("seccion", seccion);
  if (mesa) query = query.eq("mesa", mesa);

  const { data } = await query.limit(500);
  const electores = (data ?? []) as Elector[];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Electores
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        {electores.length} elector{electores.length === 1 ? "" : "es"}{" "}
        registrado{electores.length === 1 ? "" : "s"}.
      </p>

      <ElectorForm />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ImportForm />
        <a
          href="/admin/electores/export"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100"
        >
          Exportar a Excel
        </a>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por DNI o nombre"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
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
      </form>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">DNI</th>
              <th className="px-4 py-2">Apellidos</th>
              <th className="px-4 py-2">Nombres</th>
              <th className="px-4 py-2">Grado</th>
              <th className="px-4 py-2">Sección</th>
              <th className="px-4 py-2">Mesa</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {electores.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 font-mono">{e.dni}</td>
                <td className="px-4 py-2">{e.apellidos}</td>
                <td className="px-4 py-2">{e.nombres}</td>
                <td className="px-4 py-2">{e.grado}</td>
                <td className="px-4 py-2">{e.seccion}</td>
                <td className="px-4 py-2">{e.mesa}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      e.ya_voto
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {e.ya_voto ? "Ya votó" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <ToggleVotoButton id={e.id} yaVoto={e.ya_voto} />
                    <form action={deleteElector}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-xs text-red-600 hover:underline">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {electores.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  Sin electores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
