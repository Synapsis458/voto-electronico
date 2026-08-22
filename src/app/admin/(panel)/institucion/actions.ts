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
  const horaInicio = String(formData.get("hora_inicio") ?? "").trim();
  const horaFin = String(formData.get("hora_fin") ?? "").trim();

  if (horaInicio && horaFin && horaInicio >= horaFin) {
    return { error: "La hora de inicio debe ser anterior a la hora de culminación." };
  }

  const payload: Record<string, unknown> = {
    nombre: String(formData.get("nombre") ?? "").trim(),
    proceso_electoral: String(formData.get("proceso_electoral") ?? "").trim(),
    mensaje_bienvenida: String(formData.get("mensaje_bienvenida") ?? "").trim(),
    director: String(formData.get("director") ?? "").trim(),
    comite_electoral: String(formData.get("comite_electoral") ?? "").trim(),
    anio_escolar: String(formData.get("anio_escolar") ?? "").trim(),
    fecha_proceso: fechaProceso || null,
    hora_inicio: horaInicio || null,
    hora_fin: horaFin || null,
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

export type MiembroMesaState = { error?: string; success?: boolean } | undefined;

export async function guardarMiembroMesa(
  _prevState: MiembroMesaState,
  formData: FormData
): Promise<MiembroMesaState> {
  const admin = await requireAdmin();

  const mesa = String(formData.get("mesa") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const nombres = String(formData.get("nombres") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();

  if (!["Presidente", "Secretario(a)", "Vocal"].includes(cargo)) {
    return { error: "Selecciona un cargo válido." };
  }
  if (!apellidos || !nombres) {
    return { error: "Apellidos y nombres son obligatorios." };
  }
  if (dni && !/^\d{8}$/.test(dni)) {
    return { error: "El DNI debe tener 8 dígitos (o dejarse vacío)." };
  }

  const { error } = await supabaseAdmin
    .from("miembros_mesa")
    .upsert({ mesa, cargo, apellidos, nombres, dni }, { onConflict: "mesa,cargo" });

  if (error) {
    return { error: "No se pudo guardar el miembro de mesa." };
  }

  await logAudit(
    admin.email ?? "admin",
    "Registró miembro de mesa",
    `${cargo}${mesa ? ` (mesa ${mesa})` : ""}: ${nombres} ${apellidos}`
  );
  revalidatePath("/admin/institucion");
  revalidatePath("/admin/formatos/acta-electoral");
  return { success: true };
}

export async function eliminarMiembroMesa(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { data: miembro } = await supabaseAdmin
    .from("miembros_mesa")
    .select("cargo, mesa, nombres, apellidos")
    .eq("id", id)
    .maybeSingle();

  await supabaseAdmin.from("miembros_mesa").delete().eq("id", id);

  if (miembro) {
    await logAudit(
      admin.email ?? "admin",
      "Eliminó miembro de mesa",
      `${miembro.cargo}${miembro.mesa ? ` (mesa ${miembro.mesa})` : ""}: ${miembro.nombres} ${miembro.apellidos}`
    );
  }
  revalidatePath("/admin/institucion");
  revalidatePath("/admin/formatos/acta-electoral");
}
