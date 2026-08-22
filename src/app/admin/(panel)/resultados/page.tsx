import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { getResultados } from "@/lib/resultados";
import { BarChart, DonutChart } from "./Charts";
import PrintButton from "./PrintButton";

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ grado?: string; seccion?: string; mesa?: string }>;
}) {
  await requireAdmin();
  const { grado, seccion, mesa } = await searchParams;
  const r = await getResultados({ grado, seccion, mesa });

  const stats = [
    { label: "Total de electores", value: r.electores },
    { label: "Total de votantes", value: r.votantes },
    { label: "Participación", value: `${r.participacion}%` },
    { label: "Abstenciones", value: r.abstenciones },
    { label: "Votos válidos", value: r.votosValidos },
    { label: "Votos en blanco", value: r.votosBlanco },
  ];

  const segmentos = [
    ...r.porCandidato.map((p) => ({
      label: `${p.candidato.nombres} ${p.candidato.apellidos}`,
      total: p.total,
      porcentaje: p.porcentaje,
    })),
    { label: "Voto en blanco", total: r.votosBlanco, porcentaje: r.porcentajeBlanco },
  ];

  const exportParams = new URLSearchParams();
  if (grado) exportParams.set("grado", grado);
  if (seccion) exportParams.set("seccion", seccion);
  if (mesa) exportParams.set("mesa", mesa);
  const exportHref = `/admin/resultados/export${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Resultados
          </h1>
          <p className="text-sm text-zinc-500">
            Datos en tiempo real.{" "}
            <a href="/resultados" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
              Ver dashboard público
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={exportHref}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100"
          >
            Exportar a Excel
          </a>
          <PrintButton />
        </div>
      </div>

      <form className="mb-6 flex flex-wrap gap-2 print:hidden" method="get">
        <input
          name="grado"
          defaultValue={grado}
          placeholder="Grado"
          className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="seccion"
          defaultValue={seccion}
          placeholder="Sección"
          className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="mesa"
          defaultValue={mesa}
          placeholder="Mesa"
          className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
          Filtrar
        </button>
        {(grado || seccion || mesa) && (
          <Link
            href="/admin/resultados"
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Limpiar
          </Link>
        )}
      </form>

      {(grado || seccion || mesa) && (
        <p className="mb-4 text-xs text-zinc-500">
          Filtrando por{" "}
          {[grado && `grado ${grado}`, seccion && `sección ${seccion}`, mesa && `mesa ${mesa}`]
            .filter(Boolean)
            .join(", ")}
          .
        </p>
      )}

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

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Votos por candidato
          </h2>
          <BarChart datos={segmentos} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Participación
          </h2>
          <DonutChart
            datos={[
              { label: "Votaron", total: r.votantes, porcentaje: r.participacion },
              {
                label: "Abstenciones",
                total: r.abstenciones,
                porcentaje: Math.round((1 - r.participacion / 100) * 1000) / 10,
              },
            ]}
          />
        </div>
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
    </div>
  );
}
