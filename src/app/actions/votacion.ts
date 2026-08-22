"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Candidato, Elector } from "@/lib/types";

export type BuscarElectorResult =
  | { status: "ok"; elector: Elector }
  | { status: "ya_voto" }
  | { status: "no_registrado" }
  | { status: "invalido" };

export async function buscarElector(dni: string): Promise<BuscarElectorResult> {
  const clean = dni.trim();
  if (!/^\d{8}$/.test(clean)) {
    return { status: "invalido" };
  }

  const { data } = await supabaseAdmin
    .from("electores")
    .select("*")
    .eq("dni", clean)
    .maybeSingle();

  if (!data) return { status: "no_registrado" };

  const elector = data as Elector;
  if (elector.ya_voto) return { status: "ya_voto" };

  return { status: "ok", elector };
}

export async function obtenerCandidatos(): Promise<Candidato[]> {
  const { data } = await supabaseAdmin
    .from("candidatos")
    .select("*")
    .order("orden", { ascending: true });
  return (data ?? []) as Candidato[];
}

export type EmitirVotoResult =
  | { status: "ok" }
  | { status: "ya_voto" }
  | { status: "no_registrado" }
  | { status: "error" };

export async function emitirVoto(
  dni: string,
  candidatoId: string | null
): Promise<EmitirVotoResult> {
  const clean = dni.trim();
  if (!/^\d{8}$/.test(clean)) return { status: "error" };

  const { data: electorData } = await supabaseAdmin
    .from("electores")
    .select("*")
    .eq("dni", clean)
    .maybeSingle();

  if (!electorData) return { status: "no_registrado" };
  const elector = electorData as Elector;
  if (elector.ya_voto) return { status: "ya_voto" };

  const now = new Date();

  const { error: insertError } = await supabaseAdmin.from("votos").insert({
    elector_dni: clean,
    candidato_id: candidatoId,
    tipo_voto: candidatoId ? "candidato" : "blanco",
    mesa: elector.mesa,
    fecha: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 8),
  });

  if (insertError) {
    // Unique violation on elector_dni means this DNI already voted
    // (race condition between the initial check and this insert).
    if (insertError.code === "23505") return { status: "ya_voto" };
    return { status: "error" };
  }

  await supabaseAdmin
    .from("electores")
    .update({ ya_voto: true, voto_at: now.toISOString() })
    .eq("dni", clean);

  return { status: "ok" };
}
