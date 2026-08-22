import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getInstitucion } from "@/lib/institucion";
import { generateCarnetJpg, loadLogoDataUri } from "@/lib/carnetImage";
import type { Elector } from "@/lib/types";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = request.nextUrl;
  const grado = searchParams.get("grado");
  const seccion = searchParams.get("seccion");
  const mesa = searchParams.get("mesa");

  let query = supabaseAdmin
    .from("electores")
    .select("*")
    .order("apellidos", { ascending: true });

  if (grado) query = query.eq("grado", grado);
  if (seccion) query = query.eq("seccion", seccion);
  if (mesa) query = query.eq("mesa", mesa);

  const { data } = await query.limit(500);
  const electores = (data ?? []) as Elector[];

  const institucion = await getInstitucion();
  const fechaTexto = institucion.fecha_proceso
    ? new Date(institucion.fecha_proceso).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : institucion.proceso_electoral;

  const logoDataUri = await loadLogoDataUri(institucion);

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const elector of electores) {
    const jpgBytes = await generateCarnetJpg(elector, institucion, fechaTexto, logoDataUri);
    let name = `carnet-${elector.dni}.jpg`;
    // DNI is unique per the schema, but guard against edge cases anyway.
    if (usedNames.has(name)) name = `carnet-${elector.dni}-${elector.id.slice(0, 8)}.jpg`;
    usedNames.add(name);
    zip.file(name, jpgBytes);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="carnets.zip"',
    },
  });
}
