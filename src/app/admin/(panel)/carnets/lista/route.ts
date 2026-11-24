import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

// Lista (id, dni) de TODOS los electores que cumplen el filtro. La descarga
// masiva de carnets la arma el navegador pidiendo un JPG por elector, así que
// aquí solo se devuelve la lista, paginando para no toparse con el límite de
// filas por consulta de Supabase.
export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = request.nextUrl;
  const grado = searchParams.get("grado");
  const seccion = searchParams.get("seccion");
  const mesa = searchParams.get("mesa");

  const PAGINA = 1000;
  const electores: { id: string; dni: string }[] = [];

  for (let desde = 0; ; desde += PAGINA) {
    let query = supabaseAdmin
      .from("electores")
      .select("id,dni")
      .order("apellidos", { ascending: true })
      .order("dni", { ascending: true })
      .range(desde, desde + PAGINA - 1);

    if (grado) query = query.eq("grado", grado);
    if (seccion) query = query.eq("seccion", seccion);
    if (mesa) query = query.eq("mesa", mesa);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "No se pudo leer la lista de electores." }, { status: 500 });
    }
    electores.push(...(data ?? []));
    if (!data || data.length < PAGINA) break;
  }

  return NextResponse.json({ electores });
}
