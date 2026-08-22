import { requireAdmin } from "@/lib/supabase/auth";
import { getInstitucion } from "@/lib/institucion";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MiembroMesa } from "@/lib/types";
import InstitucionForm from "./InstitucionForm";
import MiembrosMesaForm from "./MiembrosMesaForm";
import { eliminarMiembroMesa } from "./actions";

export default async function InstitucionPage() {
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
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Institución Educativa
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Esta información aparece en la pantalla principal, carnets, formatos,
        reportes y cédulas de votación.
      </p>
      <InstitucionForm institucion={institucion} />

      <h2 className="mb-1 mt-10 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Miembros de mesa
      </h2>
      <p className="mb-4 text-sm text-zinc-500">
        Presidente, Secretario(a) y Vocal se incorporan automáticamente en el
        Acta Electoral. Deja el campo &ldquo;Mesa&rdquo; vacío si tu proceso
        tiene una sola mesa de sufragio.
      </p>

      <MiembrosMesaForm />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Mesa</th>
              <th className="px-4 py-2">Cargo</th>
              <th className="px-4 py-2">Apellidos y nombres</th>
              <th className="px-4 py-2">DNI</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {miembros.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2">{m.mesa || "Todas"}</td>
                <td className="px-4 py-2">{m.cargo}</td>
                <td className="px-4 py-2">
                  {m.apellidos}, {m.nombres}
                </td>
                <td className="px-4 py-2 font-mono">{m.dni || "—"}</td>
                <td className="px-4 py-2 text-right">
                  <form action={eliminarMiembroMesa}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="text-xs text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {miembros.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Sin miembros de mesa registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
