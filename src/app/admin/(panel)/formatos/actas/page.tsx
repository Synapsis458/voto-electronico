import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { getInstitucion } from "@/lib/institucion";
import { getResultados } from "@/lib/resultados";
import PrintButton from "../../resultados/PrintButton";

const linea = "inline-block min-w-[10rem] border-b border-zinc-900 print:border-black";

export default async function ActasPage() {
  await requireAdmin();
  const [institucion, r] = await Promise.all([getInstitucion(), getResultados()]);

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
      <p className="mb-4 text-xs text-zinc-500 print:hidden">
        Las cuatro actas se completan a mano el día del proceso (hora, incidencias,
        firmas). El acta de escrutinio ya trae los resultados actuales cargados.
      </p>

      <div className="flex flex-col gap-8">
        {/* Acta de instalación */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 leading-relaxed text-zinc-900 dark:border-zinc-800 print:break-after-page print:rounded-none print:border-0 print:p-0 print:text-black">
          <Cabecera institucion={institucion} titulo="Acta de Instalación" />
          <p className="mt-4">
            En el local de <strong>{institucion.nombre || "____________________"}</strong>,
            siendo las <span className={linea}>&nbsp;</span> horas del día{" "}
            <span className={linea}>{fecha}</span>, se procede a la instalación de la
            mesa de sufragio N° <span className={linea}>&nbsp;</span> para el proceso
            electoral <strong>{institucion.proceso_electoral || "____________________"}</strong>.
          </p>
          <p className="mt-4">
            Comité Electoral presente:{" "}
            {institucion.comite_electoral || "____________________________________________"}
          </p>
          <p className="mt-4">Se deja constancia de que se cuenta con:</p>
          <ul className="mt-2 list-inside list-disc">
            <li>Padrón de electores ({r.electores} electores registrados)</li>
            <li>Cédulas de votación / sistema de voto electrónico operativo</li>
            <li>Equipo de cómputo y cámara para lectura de código QR funcionando</li>
          </ul>
          <p className="mt-4">
            Sin más que hacer constar, se da por instalada la mesa siendo las{" "}
            <span className={linea}>&nbsp;</span> horas.
          </p>
          <Firmas />
        </section>

        {/* Acta de sufragio */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 leading-relaxed text-zinc-900 dark:border-zinc-800 print:break-after-page print:rounded-none print:border-0 print:p-0 print:text-black">
          <Cabecera institucion={institucion} titulo="Acta de Sufragio" />
          <p className="mt-4">
            Se deja constancia que el proceso de sufragio del proceso electoral{" "}
            <strong>{institucion.proceso_electoral || "____________________"}</strong> se
            desarrolló entre las <span className={linea}>&nbsp;</span> horas y las{" "}
            <span className={linea}>&nbsp;</span> horas del día{" "}
            <span className={linea}>{fecha}</span>.
          </p>
          <p className="mt-4">Total de electores hábiles: {r.electores}</p>
          <p className="mt-4">
            Incidencias durante la votación:
            <br />
            <span className="mt-2 block h-16 border-b border-zinc-400 print:border-black" />
          </p>
          <Firmas />
        </section>

        {/* Acta de escrutinio */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 leading-relaxed text-zinc-900 dark:border-zinc-800 print:break-after-page print:rounded-none print:border-0 print:p-0 print:text-black">
          <Cabecera institucion={institucion} titulo="Acta de Escrutinio" />
          <p className="mt-4">
            Siendo las <span className={linea}>&nbsp;</span> horas del día{" "}
            <span className={linea}>{fecha}</span>, se procede al escrutinio de los
            votos emitidos, obteniéndose los siguientes resultados:
          </p>
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-400 print:border-black">
                <th className="py-1.5 pr-2">Candidato</th>
                <th className="py-1.5 pr-2">Agrupación</th>
                <th className="py-1.5 pr-2">Votos</th>
                <th className="py-1.5 pr-2">%</th>
              </tr>
            </thead>
            <tbody>
              {r.porCandidato.map((p) => (
                <tr key={p.candidato.id} className="border-b border-zinc-200 print:border-black/30">
                  <td className="py-1.5 pr-2">
                    {p.candidato.nombres} {p.candidato.apellidos}
                  </td>
                  <td className="py-1.5 pr-2">{p.candidato.agrupacion}</td>
                  <td className="py-1.5 pr-2">{p.total}</td>
                  <td className="py-1.5 pr-2">{p.porcentaje}%</td>
                </tr>
              ))}
              <tr className="border-b border-zinc-200 print:border-black/30">
                <td className="py-1.5 pr-2 font-medium">Voto en blanco</td>
                <td className="py-1.5 pr-2">—</td>
                <td className="py-1.5 pr-2">{r.votosBlanco}</td>
                <td className="py-1.5 pr-2">{r.porcentajeBlanco}%</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4">
            Total de votos emitidos: {r.totalVotos} — Total de electores: {r.electores} —
            Participación: {r.participacion}%
          </p>
          <Firmas />
        </section>

        {/* Acta final */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 leading-relaxed text-zinc-900 dark:border-zinc-800 print:rounded-none print:border-0 print:p-0 print:text-black">
          <Cabecera institucion={institucion} titulo="Acta Final" />
          <p className="mt-4">
            Se certifica que el proceso electoral{" "}
            <strong>{institucion.proceso_electoral || "____________________"}</strong> de la
            institución educativa <strong>{institucion.nombre || "____________________"}</strong>,
            llevado a cabo el <span className={linea}>{fecha}</span>, concluyó conforme a lo
            establecido, con los resultados declarados en la Acta de Escrutinio
            precedente.
          </p>
          <p className="mt-4">
            Total de electores: {r.electores} — Votantes: {r.votantes} — Abstenciones:{" "}
            {r.abstenciones} — Participación: {r.participacion}%
          </p>
          <p className="mt-6">
            Dado en {institucion.nombre || "____________________"} a los{" "}
            <span className={linea}>&nbsp;</span> días del mes de{" "}
            <span className={linea}>&nbsp;</span> del año{" "}
            <span className={linea}>&nbsp;</span>.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
              <div className="border-t border-zinc-900 pt-1 print:border-black">Director(a)</div>
            </div>
            <div>
              <div className="border-t border-zinc-900 pt-1 print:border-black">
                Presidente(a) del Comité Electoral
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Cabecera({
  institucion,
  titulo,
}: {
  institucion: Awaited<ReturnType<typeof getInstitucion>>;
  titulo: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b-2 border-zinc-900 pb-4 print:border-black">
      {institucion.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={institucion.logo_url} alt="" className="h-14 w-14 shrink-0 object-contain" />
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 print:text-black">
          {institucion.nombre || "Institución Educativa"}
        </p>
        <h2 className="text-lg font-bold">{titulo}</h2>
      </div>
    </div>
  );
}

function Firmas() {
  return (
    <div className="mt-10 grid grid-cols-3 gap-6 text-center text-sm">
      <div className="border-t border-zinc-900 pt-1 print:border-black">Presidente</div>
      <div className="border-t border-zinc-900 pt-1 print:border-black">Secretario</div>
      <div className="border-t border-zinc-900 pt-1 print:border-black">Miembro</div>
    </div>
  );
}
