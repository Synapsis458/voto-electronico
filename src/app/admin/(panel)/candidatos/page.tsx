import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Candidato } from "@/lib/types";
import CandidatoForm from "./CandidatoForm";
import { deleteCandidato } from "./actions";

export default async function CandidatosPage() {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("candidatos")
    .select("*")
    .order("orden", { ascending: true });
  const candidatos = (data ?? []) as Candidato[];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Candidatos
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        No hay límite en la cantidad de candidatos que pueden participar.
      </p>

      <CandidatoForm />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {candidatos.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">#{c.orden}</span>
              <form action={deleteCandidato}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs text-red-600 hover:underline">
                  Eliminar
                </button>
              </form>
            </div>
            <div className="mt-2 flex items-center gap-3">
              {c.fotografia_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.fotografia_url}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
              {c.simbolo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.simbolo_url} alt="" className="h-10 w-10 object-contain" />
              )}
            </div>
            <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-50">
              {c.nombres} {c.apellidos}
            </p>
            <p className="text-sm text-zinc-500">{c.agrupacion}</p>
            <p className="mt-1 font-mono text-xs text-zinc-400">{c.dni}</p>
          </div>
        ))}
        {candidatos.length === 0 && (
          <p className="text-sm text-zinc-500">Sin candidatos registrados.</p>
        )}
      </div>
    </div>
  );
}
