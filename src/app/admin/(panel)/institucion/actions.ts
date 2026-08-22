"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { optionalFile, uploadImage } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export type InstitucionState = { error?: string; success?: boolean } | undefined;

export async function saveInstitucion(
  _prevState: InstitucionState,
  formData: FormData
): Promise<InstitucionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const fechaProceso = String(formData.get("fecha_proceso") ?? "").trim();

  const payload: Record<string, unknown> = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    proceso_electoral: String(formData.get("proceso_electoral") ?? "").trim(),
    mensaje_bienvenida: String(formData.get("mensaje_bienvenida") ?? "").trim(),
    director: String(formData.get("director") ?? "").trim(),
    comite_electoral: String(formData.get("comite_electoral") ?? "").trim(),
    anio_escolar: String(formData.get("anio_escolar") ?? "").trim(),
    fecha_proceso: fechaProceso || null,
    updated_at: new Date().toISOString(),
  };

  const logo = optionalFile(formData, "logo");
  const portada = optionalFile(formData, "foto_portada");

  try {
    if (logo) payload.logo_url = await uploadImage("institucion/logo", logo);
    if (portada) payload.foto_portada_url = await uploadImage("institucion/portada", portada);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo subir la imagen." };
  }

  const { error } = await supabaseAdmin
    .from("institucion")
    .update(payload)
    .eq("id", id);

  if (error) {
    return { error: "No se pudo guardar la información." };
  }

  await logAudit(admin.email ?? "admin", "Actualizó datos de la institución");
  revalidatePath("/admin/institucion");
  revalidatePath("/");
  return { success: true };
}
