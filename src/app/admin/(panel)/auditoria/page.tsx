import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

type EntradaAuditoria = {
  id: string;
  admin_email: string;
  accion: string;
  detalle: string;
  created_at: string;
};

export default async function AuditoriaPage() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("auditoria")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div>
        <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Auditoría
        </h1>
        <p className="mt-4 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          No se pudo cargar la tabla de auditoría. Es probable que aún falte
          crearla en Supabase — ejecuta la sección &ldquo;Auditoría&rdquo; de{" "}
          <code className="rounded bg-black/10 px-1 dark:bg-white/10">supabase/schema.sql</code>{" "}
          en el SQL Editor de tu proyecto.
        </p>
      </div>
    );
  }

  const entradas = (data ?? []) as EntradaAuditoria[];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Auditoría
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Registro de acciones realizadas en el panel de administración. Se
        muestran las últimas {entradas.length} entradas.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Fecha y hora</th>
              <th className="px-4 py-2">Administrador</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {entradas.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-4 py-2 text-zinc-500">
                  {new Date(e.created_at).toLocaleString("es-PE", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  })}
                </td>
                <td className="px-4 py-2">{e.admin_email}</td>
                <td className="px-4 py-2 font-medium">{e.accion}</td>
                <td className="px-4 py-2 text-zinc-500">{e.detalle}</td>
              </tr>
            ))}
            {entradas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Sin actividad registrada todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
