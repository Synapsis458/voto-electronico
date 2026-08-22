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

// Peru doesn't observe DST, so a fixed America/Lima lookup is reliable
// regardless of the server's own timezone (e.g. UTC on Vercel/Netlify).
export function horaActualLima(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export type EstadoHorario =
  | { dentro: true }
  | { dentro: false; motivo: "no_iniciado"; horaInicio: string }
  | { dentro: false; motivo: "finalizado"; horaFin: string };

export function verificarHorarioVotacion(institucion: Institucion): EstadoHorario {
  const ahora = horaActualLima();

  if (institucion.hora_inicio) {
    const horaInicio = institucion.hora_inicio.slice(0, 5);
    if (ahora < horaInicio) return { dentro: false, motivo: "no_iniciado", horaInicio };
  }
  if (institucion.hora_fin) {
    const horaFin = institucion.hora_fin.slice(0, 5);
    if (ahora > horaFin) return { dentro: false, motivo: "finalizado", horaFin };
  }

  return { dentro: true };
}
