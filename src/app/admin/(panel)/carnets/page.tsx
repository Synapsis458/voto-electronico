import QRCode from "qrcode";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import type { Elector } from "@/lib/types";
import Carnet from "./Carnet";

export default async function CarnetsPage({
  searchParams,
}: {
  searchParams: Promise<{ grado?: string; seccion?: string; mesa?: string }>;
}) {
  await requireAdmin();
  const { grado, seccion, mesa } = await searchParams;

  const institucion = await getInstitucion();

  let query = supabaseAdmin
    .from("electores")
    .select("*")
    .order("apellidos", { ascending: true });

  if (grado) query = query.eq("grado", grado);
  if (seccion) query = query.eq("seccion", seccion);
  if (mesa) query = query.eq("mesa", mesa);

  const { data } = await query.limit(200);
  const electores = (data ?? []) as Elector[];

  const fechaProceso = institucion.fecha_proceso
    ? new Date(institucion.fecha_proceso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : institucion.proceso_electoral;

  const carnets = await Promise.all(
    electores.map(async (e) => ({
      elector: e,
      // Vector SVG instead of a raster PNG: perfectly crisp at any zoom or
      // print DPI, with a much smaller payload than a high-resolution PNG.
      qrSvg: await QRCode.toString(e.dni, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#1e3a8a", light: "#ffffff" },
      }),
    }))
  );

  const downloadParams = new URLSearchParams();
  if (grado) downloadParams.set("grado", grado);
  if (seccion) downloadParams.set("seccion", seccion);
  if (mesa) downloadParams.set("mesa", mesa);
  const downloadHref = `/admin/carnets/download${downloadParams.size ? `?${downloadParams}` : ""}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Carnets
          </h1>
          <p className="text-sm text-zinc-500">
            El código QR de cada carnet representa únicamente el DNI del
            elector. Descarga uno individual en JPG o todos juntos en un ZIP
            de imágenes JPG.
          </p>
        </div>
        <a
          href={downloadHref}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Descargar todos (ZIP de JPG)
        </a>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" method="get">
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
      </form>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-4">
        {carnets.map(({ elector, qrSvg }) => (
          <div key={elector.id} className="flex flex-col items-center gap-2">
            <Carnet
              elector={elector}
              qrSvg={qrSvg}
              institucion={institucion}
              fechaProceso={fechaProceso}
            />
            <a
              href={`/admin/carnets/${elector.id}/download`}
              className="text-xs text-blue-600 hover:underline print:hidden dark:text-blue-400"
            >
              Descargar JPG
            </a>
          </div>
        ))}
        {carnets.length === 0 && (
          <p className="text-sm text-zinc-500">Sin electores registrados.</p>
        )}
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Fotografía del estudiante se agregará en una siguiente iteración.
      </p>
    </div>
  );
}
