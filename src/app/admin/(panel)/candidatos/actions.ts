"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { optionalFile, uploadImage } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export type CandidatoState = { error?: string; success?: boolean } | undefined;

export async function createCandidato(
  _prevState: CandidatoState,
  formData: FormData
): Promise<CandidatoState> {
  const admin = await requireAdmin();

  const dni = String(formData.get("dni") ?? "").trim();
  if (!/^\d{8}$/.test(dni)) {
    return { error: "El DNI debe tener 8 dígitos." };
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
    apellidos: String(formData.get("apellidos") ?? "").trim(),
    nombres: String(formData.get("nombres") ?? "").trim(),
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
  const dni = String(formData.get("dni") ?? "").trim();
  if (!/^\d{8}$/.test(dni)) {
    return { error: "El DNI debe tener 8 dígitos." };
  }

  const fotografia = optionalFile(formData, "fotografia");
  const simbolo = optionalFile(formData, "simbolo");

  const payload: Record<string, unknown> = {
    dni,
    apellidos: String(formData.get("apellidos") ?? "").trim(),
    nombres: String(formData.get("nombres") ?? "").trim(),
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
