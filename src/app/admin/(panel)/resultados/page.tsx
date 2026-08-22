import { requireAdmin } from "@/lib/supabase/auth";
import { getResultados } from "@/lib/resultados";

export default async function ResultadosPage() {
  await requireAdmin();
  const r = await getResultados();

  const stats = [
    { label: "Total de electores", value: r.electores },
    { label: "Total de votantes", value: r.votantes },
    { label: "Participación", value: `${r.participacion}%` },
    { label: "Abstenciones", value: r.abstenciones },
    { label: "Votos válidos", value: r.votosValidos },
    { label: "Votos en blanco", value: r.votosBlanco },
  ];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Resultados
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Datos en tiempo real.{" "}
        <a href="/resultados" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
          Ver dashboard público
        </a>
        .
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
            {r.porCandidato.map(({ candidato, total, porcentaje }) => (
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
              <td className="px-4 py-2">{r.votosBlanco}</td>
              <td className="px-4 py-2">{r.porcentajeBlanco}%</td>
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
