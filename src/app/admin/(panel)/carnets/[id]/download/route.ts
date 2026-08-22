import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
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
    ? new Date(institucion.fecha_proceso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : institucion.proceso_electoral;

  const logoDataUri = await loadLogoDataUri(institucion);
  const jpgBytes = await generateCarnetJpg(elector, institucion, fechaTexto, logoDataUri);

  return new NextResponse(new Uint8Array(jpgBytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="carnet-${elector.dni}.jpg"`,
    },
  });
}
