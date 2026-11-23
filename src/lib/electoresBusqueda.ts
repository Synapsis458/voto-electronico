import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ElectorOpcion } from "@/lib/types";

// Search the electores table by DNI / apellidos / nombres (max 8 rows).
// Used to pick an existing elector when registering a candidate or a miembro de mesa.
export async function buscarElectores(q: string): Promise<ElectorOpcion[]> {
  // Strip characters that would break the PostgREST `or` filter syntax.
  const termino = q.replace(/[,()%*\\]/g, " ").trim();
  if (termino.length < 2) return [];

  const { data } = await supabaseAdmin
    .from("electores")
    .select("dni,apellidos,nombres,grado,seccion")
    .or(`dni.ilike.%${termino}%,apellidos.ilike.%${termino}%,nombres.ilike.%${termino}%`)
    .order("apellidos", { ascending: true })
    .limit(8);

  return (data ?? []) as ElectorOpcion[];
}
