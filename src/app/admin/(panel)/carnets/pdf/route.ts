import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { getInstitucion, formatearFechaProceso } from "@/lib/institucion";
import { listarElectoresFiltrados } from "@/lib/electoresFiltro";
import { generarCarnetsPdf } from "@/lib/carnetPdf";

export const maxDuration = 60;

// PDF A4 con 9 carnets por hoja (3 x 3), ordenados por grado, sección y
// apellidos para repartirlos fácilmente después de imprimir y recortar.
export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = request.nextUrl;

  try {
    const electores = await listarElectoresFiltrados({
      grado: searchParams.get("grado"),
      seccion: searchParams.get("seccion"),
      mesa: searchParams.get("mesa"),
    });
    electores.sort(
      (a, b) =>
        (a.grado ?? "").localeCompare(b.grado ?? "", "es", { numeric: true }) ||
        (a.seccion ?? "").localeCompare(b.seccion ?? "", "es", { numeric: true }) ||
        a.apellidos.localeCompare(b.apellidos, "es") ||
        a.nombres.localeCompare(b.nombres, "es")
    );

    const institucion = await getInstitucion();
    const fechaTexto = institucion.fecha_proceso
      ? formatearFechaProceso(institucion.fecha_proceso)
      : institucion.proceso_electoral;

    const pdf = await generarCarnetsPdf(electores, institucion, fechaTexto);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="carnets-A4.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    console.error("Error generando PDF de carnets", detalle);
    return NextResponse.json(
      { error: `No se pudo generar el PDF: ${detalle}`.slice(0, 300) },
      { status: 500 }
    );
  }
}
