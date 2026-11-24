import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Elector } from "@/lib/types";

export type FiltroElectores = {
  grado?: string | null;
  seccion?: string | null;
  mesa?: string | null;
};

// Todos los electores que cumplen el filtro, leídos por tandas para no
// toparse con el límite de filas por consulta de Supabase.
export async function listarElectoresFiltrados(filtro: FiltroElectores): Promise<Elector[]> {
  const PAGINA = 1000;
  const electores: Elector[] = [];

  for (let desde = 0; ; desde += PAGINA) {
    let query = supabaseAdmin
      .from("electores")
      .select("*")
      .order("apellidos", { ascending: true })
      .order("dni", { ascending: true })
      .range(desde, desde + PAGINA - 1);

    if (filtro.grado) query = query.eq("grado", filtro.grado);
    if (filtro.seccion) query = query.eq("seccion", filtro.seccion);
    if (filtro.mesa) query = query.eq("mesa", filtro.mesa);

    const { data, error } = await query;
    if (error) throw new Error("No se pudo leer la lista de electores.");
    electores.push(...((data ?? []) as Elector[]));
    if (!data || data.length < PAGINA) break;
  }

  return electores;
}
