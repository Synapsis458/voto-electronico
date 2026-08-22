import { supabaseAdmin } from "@/lib/supabase/server";
import type { Institucion } from "@/lib/types";

// The table is expected to hold exactly one row (seeded by supabase/seed.sql).
// If it's empty — e.g. schema applied without seeding — create it on first read.
export async function getInstitucion(): Promise<Institucion> {
  const { data } = await supabaseAdmin
    .from("institucion")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (data) return data as Institucion;

  const { data: created, error } = await supabaseAdmin
    .from("institucion")
    .insert({})
    .select("*")
    .single();

  if (error || !created) {
    throw new Error("No se pudo cargar la configuración de la institución.");
  }

  return created as Institucion;
}
