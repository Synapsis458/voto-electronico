import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Candidato, Voto } from "@/lib/types";

export default async function ResultadosPage() {
  await requireAdmin();

  const [{ count: totalElectores }, { count: totalVotantes }, { data: votosData }, { data: candidatosData }] =
    await Promise.all([
      supabaseAdmin.from("electores").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("electores")
        .select("*", { count: "exact", head: true })
        .eq("ya_voto", true),
      supabaseAdmin.from("votos").select("*"),
      supabaseAdmin.from("candidatos").select("*").order("orden", { ascending: true }),
    ]);

  const votos = (votosData ?? []) as Voto[];
  const candidatos = (candidatosData ?? []) as Candidato[];

  const electores = totalElectores ?? 0;
  const votantes = totalVotantes ?? 0;
  const abstenciones = Math.max(electores - votantes, 0);
  const participacion = electores > 0 ? Math.round((votantes / electores) * 1000) / 10 : 0;
  const votosBlanco = votos.filter((v) => v.tipo_voto === "blanco").length;
  const votosValidos = votos.length - votosBlanco;

  const conteoPorCandidato = candidatos.map((c) => {
    const total = votos.filter((v) => v.candidato_id === c.id).length;
    const porcentaje = votos.length > 0 ? Math.round((total / votos.length) * 1000) / 10 : 0;
    return { candidato: c, total, porcentaje };
  });

  const stats = [
    { label: "Total de electores", value: electores },
    { label: "Total de votantes", value: votantes },
    { label: "Participación", value: `${participacion}%` },
    { label: "Abstenciones", value: abstenciones },
    { label: "Votos válidos", value: votosValidos },
    { label: "Votos en blanco", value: votosBlanco },
  ];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Resultados
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Datos en tiempo real. Recarga la página para actualizar.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Candidato</th>
              <th className="px-4 py-2">Agrupación</th>
              <th className="px-4 py-2">Votos</th>
              <th className="px-4 py-2">Porcentaje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {conteoPorCandidato.map(({ candidato, total, porcentaje }) => (
              <tr key={candidato.id}>
                <td className="px-4 py-2">
                  {candidato.nombres} {candidato.apellidos}
                </td>
                <td className="px-4 py-2">{candidato.agrupacion}</td>
                <td className="px-4 py-2">{total}</td>
                <td className="px-4 py-2">{porcentaje}%</td>
              </tr>
            ))}
            <tr>
              <td className="px-4 py-2 font-medium">Voto en blanco</td>
              <td className="px-4 py-2">—</td>
              <td className="px-4 py-2">{votosBlanco}</td>
              <td className="px-4 py-2">
                {votos.length > 0 ? Math.round((votosBlanco / votos.length) * 1000) / 10 : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Filtros por grado/sección/mesa, gráficos e impresión/exportación se
        agregarán en una siguiente iteración.
      </p>
    </div>
  );
}
