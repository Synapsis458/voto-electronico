"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { optionalFile, uploadImage } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { buscarElectores } from "@/lib/electoresBusqueda";
import type { ElectorOpcion } from "@/lib/types";

export type CandidatoState = { error?: string; success?: boolean } | undefined;

// Search the electores table so a candidate can be picked from it.
export async function buscarElectoresParaCandidato(q: string): Promise<ElectorOpcion[]> {
  await requireAdmin();

  const electores = await buscarElectores(q);
  if (electores.length === 0) return [];

  const { data: yaCandidatos } = await supabaseAdmin
    .from("candidatos")
    .select("dni")
    .in(
      "dni",
      electores.map((e) => e.dni)
    );
  const ocupados = new Set((yaCandidatos ?? []).map((c) => c.dni));

  return electores.map((e) => ({
    ...e,
    bloqueado: ocupados.has(e.dni) ? "Ya es candidato" : undefined,
  }));
}

export async function createCandidato(
  _prevState: CandidatoState,
  formData: FormData
): Promise<CandidatoState> {
  const admin = await requireAdmin();

  const dni = String(formData.get("dni") ?? "").trim();
  if (!/^\d{8}$/.test(dni)) {
    return { error: "Selecciona un elector de la lista para registrarlo como candidato." };
  }

  // The candidate MUST exist in the electores database; names come from there,
  // never from the submitted form.
  const { data: elector } = await supabaseAdmin
    .from("electores")
    .select("apellidos,nombres")
    .eq("dni", dni)
    .maybeSingle();
  if (!elector) {
    return {
      error:
        "Ese DNI no está en la base de electores. Regístralo primero en la pestaña Electores.",
    };
  }

  const fotografia = optionalFile(formData, "fotografia");
  const simbolo = optionalFile(formData, "simbolo");

  let fotografiaUrl = "";
  let simboloUrl = "";
  try {
    if (fotografia) fotografiaUrl = await uploadImage(`candidatos/${dni}-foto`, fotografia);
    if (simbolo) simboloUrl = await uploadImage(`candidatos/${dni}-simbolo`, simbolo);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
  }

  const { error } = await supabaseAdmin.from("candidatos").insert({
    dni,
    apellidos: elector.apellidos,
    nombres: elector.nombres,
    agrupacion: String(formData.get("agrupacion") ?? "").trim(),
    fotografia_url: fotografiaUrl,
    simbolo_url: simboloUrl,
    orden: Number(formData.get("orden") ?? 0) || 0,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un candidato con ese DNI." : "No se pudo registrar el candidato.",
    };
  }

  await logAudit(admin.email ?? "admin", "Registró candidato", `DNI ${dni}`);
  revalidatePath("/admin/candidatos");
  revalidatePath("/");
  return { success: true };
}

export async function updateCandidato(
  _prevState: CandidatoState,
  formData: FormData
): Promise<CandidatoState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");

  // Identity (DNI + names) comes from the electores database and is not editable
  // here: only agrupación, order and images can change.
  const { data: actual } = await supabaseAdmin
    .from("candidatos")
    .select("dni")
    .eq("id", id)
    .maybeSingle();
  if (!actual) return { error: "No se encontró el candidato." };
  const dni = actual.dni as string;

  const fotografia = optionalFile(formData, "fotografia");
  const simbolo = optionalFile(formData, "simbolo");

  const payload: Record<string, unknown> = {
    agrupacion: String(formData.get("agrupacion") ?? "").trim(),
    orden: Number(formData.get("orden") ?? 0) || 0,
  };

  try {
    if (fotografia) payload.fotografia_url = await uploadImage(`candidatos/${dni}-foto`, fotografia);
    if (simbolo) payload.simbolo_url = await uploadImage(`candidatos/${dni}-simbolo`, simbolo);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
  }

  const { error } = await supabaseAdmin.from("candidatos").update(payload).eq("id", id);

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un candidato con ese DNI." : "No se pudo actualizar el candidato.",
    };
  }

  await logAudit(admin.email ?? "admin", "Editó candidato", `DNI ${dni}`);
  revalidatePath("/admin/candidatos");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCandidato(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { data: candidato } = await supabaseAdmin
    .from("candidatos")
    .select("dni")
    .eq("id", id)
    .maybeSingle();

  await supabaseAdmin.from("candidatos").delete().eq("id", id);
  await logAudit(
    admin.email ?? "admin",
    "Eliminó candidato",
    candidato ? `DNI ${candidato.dni}` : `id ${id}`
  );
  revalidatePath("/admin/candidatos");
  revalidatePath("/");
}
