import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import { getResultados } from "@/lib/resultados";
import type { CargoMesa, MiembroMesa } from "@/lib/types";
import PrintButton from "../../resultados/PrintButton";

const CARGOS: CargoMesa[] = ["Presidente", "Secretario(a)", "Vocal"];

const linea = "inline-block min-w-[7rem] border-b border-zinc-900 print:border-black";
const casilla =
  "flex h-11 w-24 items-center justify-center border border-zinc-900 text-sm font-semibold print:border-black";

export default async function ActaElectoralPage({
  searchParams,
}: {
  searchParams: Promise<{ mesa?: string }>;
}) {
  await requireAdmin();
  const { mesa } = await searchParams;
  const [institucion, r, { data: miembrosData }] = await Promise.all([
    getInstitucion(),
    getResultados({ mesa }),
    supabaseAdmin.from("miembros_mesa").select("*"),
  ]);
  const miembros = (miembrosData ?? []) as MiembroMesa[];

  function resolverMiembro(cargo: CargoMesa): MiembroMesa | undefined {
    const candidatos = miembros.filter((m) => m.cargo === cargo);

    if (mesa) {
      // Se pidió una mesa concreta: esa mesa, o el registro genérico
      // (mesa en blanco) si no hay uno específico para ella.
      return candidatos.find((m) => m.mesa === mesa) ?? candidatos.find((m) => m.mesa === "");
    }

    // Sin filtro de mesa (vista de "todas"): si todo lo registrado para
    // este cargo es de una sola mesa —el caso típico de un colegio con
    // una única mesa— se usa ese registro sin necesidad de filtrar por
    // mesa explícitamente. Si hay más de una mesa distinta, se deja en
    // blanco para no atribuir el cargo de la mesa equivocada.
    const mesasDistintas = new Set(candidatos.map((m) => m.mesa));
    if (mesasDistintas.size === 1) return candidatos[0];
    return candidatos.find((m) => m.mesa === "");
  }

  const fecha = institucion.fecha_proceso
    ? new Date(institucion.fecha_proceso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "____________________";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/formatos" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Volver a Formatos
        </Link>
        <PrintButton />
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2 print:hidden" method="get">
        <label className="text-sm text-zinc-500">Mesa (opcional, deja vacío para todas):</label>
        <input
          name="mesa"
          defaultValue={mesa}
          placeholder="Mesa"
          className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
          Aplicar
        </button>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 dark:border-zinc-800 sm:p-8 print:rounded-none print:border-0 print:p-0 print:text-black">
        {/* Encabezado */}
        <div className="flex items-start gap-4 border-b-2 border-zinc-900 pb-4 print:border-black">
          {institucion.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institucion.logo_url} alt="" className="h-20 w-20 shrink-0 object-contain" />
          ) : (
            <div className="h-20 w-20 shrink-0" />
          )}
          <div className="flex-1 text-center">
            <p className="text-xl font-extrabold uppercase leading-tight text-blue-900 print:text-black">
              {institucion.proceso_electoral || "Proceso Electoral Escolar"}
            </p>
            <p className="text-base font-bold uppercase">{institucion.nombre || "Institución Educativa"}</p>
            <p className="mt-1 text-lg font-black uppercase tracking-wide">Acta Electoral</p>
          </div>
          <div className="shrink-0 text-right text-sm font-semibold">
            Mesa número:
            <br />
            <span className={linea}>{mesa || " "}</span>
          </div>
        </div>

        {/* Instalación + Sufragio */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-zinc-900 print:border-black">
            <div className="bg-emerald-600 px-3 py-1.5 text-center text-sm font-bold uppercase text-white print:bg-emerald-700">
              Instalación
            </div>
            <div className="flex items-center justify-between gap-3 p-3 text-sm">
              <p>
                La mesa de votación se instala a las <span className={linea}>&nbsp;</span> horas
                del día <strong>{fecha}</strong>.
                <br />
                <br />
                Cantidad de electores hábiles:
              </p>
              <div className={casilla}>{r.electores}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-900 print:border-black">
            <div className="bg-amber-500 px-3 py-1.5 text-center text-sm font-bold uppercase text-white print:bg-amber-600">
              Sufragio o Votación
            </div>
            <div className="flex items-center justify-between gap-3 p-3 text-sm">
              <p>
                El sufragio concluye a las <span className={linea}>&nbsp;</span> horas del día{" "}
                <strong>{fecha}</strong>.
                <br />
                <br />
                Total de electores que votaron:
              </p>
              <div className={casilla}>{r.votantes}</div>
            </div>
          </div>
        </div>

        {/* Escrutinio */}
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-900 print:border-black">
          <div className="bg-blue-800 px-3 py-1.5 text-center text-sm font-bold uppercase text-white">
            Escrutinio o Conteo de Votos
          </div>
          <div className="p-4">
            <p className="mb-3 text-sm">
              Siendo las <span className={linea}>&nbsp;</span> horas del día{" "}
              <strong>{fecha}</strong>, se da inicio al escrutinio, obteniéndose los
              siguientes resultados registrados por el sistema:
            </p>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-400 print:border-black">
                    <th className="py-1.5 pr-2">Agrupación / Candidato(a)</th>
                    <th className="py-1.5 pr-2 text-right">Votos</th>
                  </tr>
                </thead>
                <tbody>
                  {r.porCandidato.map((p) => (
                    <tr key={p.candidato.id} className="border-b border-zinc-200 print:border-black/30">
                      <td className="py-1.5 pr-2">
                        <span className="font-semibold">{p.candidato.agrupacion}</span>
                        <br />
                        <span className="text-zinc-600 print:text-black">
                          {p.candidato.nombres} {p.candidato.apellidos}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 text-right text-base font-bold">{p.total}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-zinc-200 print:border-black/30">
                    <td className="py-1.5 pr-2 font-semibold">Votos en blanco</td>
                    <td className="py-1.5 pr-2 text-right text-base font-bold">{r.votosBlanco}</td>
                  </tr>
                  <tr className="border-b border-zinc-200 print:border-black/30">
                    <td className="py-1.5 pr-2 font-semibold">
                      Votos nulos
                      <span className="ml-1 text-xs font-normal text-zinc-500">
                        (no aplica — sistema digital)
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-right text-base font-bold">0</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2 font-bold">Total de votos</td>
                    <td className="py-1.5 pr-2 text-right text-base font-bold">{r.totalVotos}</td>
                  </tr>
                </tbody>
              </table>

              <div className="min-w-[14rem] rounded-lg border border-zinc-300 p-3 text-xs print:border-black">
                <p className="mb-2 font-semibold uppercase">Observaciones</p>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="mt-3 border-b border-dotted border-zinc-400 print:border-black" />
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              Hora de fin del escrutinio: <div className={casilla}>&nbsp;</div>
            </div>
          </div>
        </div>

        {/* Firmas de la mesa — misma grilla de 3 columnas que Personeros, para que
            ambos bloques queden alineados verticalmente en la página. */}
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 text-center text-sm sm:grid-cols-3">
          {CARGOS.map((cargo) => {
            const miembro = resolverMiembro(cargo);
            return (
              <div key={cargo} className="flex flex-col">
                <p className="mb-10 font-semibold uppercase">{cargo}</p>
                <div className="border-t border-zinc-900 pt-1 print:border-black">
                  {miembro ? `${miembro.nombres} ${miembro.apellidos}` : "Nombres y apellidos"}
                </div>
                <p className="mt-3 text-left">
                  DNI:{" "}
                  {miembro?.dni ? (
                    <span className="font-semibold">{miembro.dni}</span>
                  ) : (
                    <span className={linea}>&nbsp;</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        {/* Personeros — una columna por cada agrupación registrada, envolviendo
            de a 3 por fila para mantener el mismo ancho de columna de arriba. */}
        {r.porCandidato.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 text-center text-xs sm:grid-cols-3">
            {r.porCandidato.map((p) => (
              <div key={p.candidato.id} className="flex flex-col">
                <p className="mb-10 font-semibold uppercase">Personero(a)</p>
                <div className="border-t border-zinc-900 pt-1 print:border-black">{p.candidato.agrupacion}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
