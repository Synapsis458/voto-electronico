import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion, formatearFechaProceso } from "@/lib/institucion";
import { generateCarnetJpg, loadLogoDataUri } from "@/lib/carnetImage";
import type { Elector } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("electores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Elector no encontrado" }, { status: 404 });
  }
  const elector = data as Elector;
  const institucion = await getInstitucion();

  const fechaTexto = institucion.fecha_proceso
    ? formatearFechaProceso(institucion.fecha_proceso)
    : institucion.proceso_electoral;

  let jpgBytes: Buffer;
  try {
    const logoDataUri = await loadLogoDataUri(institucion);
    jpgBytes = await generateCarnetJpg(elector, institucion, fechaTexto, logoDataUri);
  } catch (e) {
    // Devolver la causa real para poder diagnosticar fallos del servidor.
    const detalle = e instanceof Error ? e.message : String(e);
    console.error("Error generando carnet", elector.dni, detalle);
    return NextResponse.json(
      { error: `No se pudo generar el carnet: ${detalle}`.slice(0, 300) },
      { status: 500 }
    );
  }

  return new NextResponse(new Uint8Array(jpgBytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="carnet-${elector.dni}.jpg"`,
    },
  });
}
