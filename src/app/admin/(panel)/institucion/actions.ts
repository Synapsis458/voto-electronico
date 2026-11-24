"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { optionalFile, uploadImage } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { buscarElectores } from "@/lib/electoresBusqueda";
import { CARGOS_MESA } from "@/lib/types";
import type { ElectorOpcion } from "@/lib/types";

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

// Search the electores table so a miembro de mesa can be picked from it.
export async function buscarElectoresParaMesa(q: string): Promise<ElectorOpcion[]> {
  await requireAdmin();
  return buscarElectores(q);
}

export async function guardarMiembroMesa(
  _prevState: MiembroMesaState,
  formData: FormData
): Promise<MiembroMesaState> {
  const admin = await requireAdmin();

  const mesa = String(formData.get("mesa") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const dni = String(formData.get("dni") ?? "").trim();

  if (!(CARGOS_MESA as readonly string[]).includes(cargo)) {
    return { error: "Selecciona un cargo válido." };
  }
  if (!/^\d{8}$/.test(dni)) {
    return { error: "Selecciona un elector de la lista para asignarlo como miembro de mesa." };
  }

  // The member MUST exist in the electores database; names come from there,
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
  const { apellidos, nombres } = elector;

  // Una misma persona no puede ocupar dos cargos en la misma mesa
  // (titular y suplente, por ejemplo).
  const { data: repetido } = await supabaseAdmin
    .from("miembros_mesa")
    .select("cargo")
    .eq("mesa", mesa)
    .eq("dni", dni)
    .neq("cargo", cargo)
    .limit(1)
    .maybeSingle();
  if (repetido) {
    return {
      error: `Ese elector ya está registrado como ${repetido.cargo} en esta mesa. Elige a otra persona.`,
    };
  }

  const { error } = await supabaseAdmin
    .from("miembros_mesa")
    .upsert({ mesa, cargo, apellidos, nombres, dni }, { onConflict: "mesa,cargo" });

  if (error) {
    return {
      error:
        "No se pudo guardar el miembro de mesa. Si es un suplente, verifica que ya ejecutaste la actualización SQL de la base de datos.",
    };
  }

  await logAudit(
    admin.email ?? "admin",
    "Registró miembro de mesa",
    `${cargo}${mesa ? ` (mesa ${mesa})` : ""}: ${nombres} ${apellidos}`
  );
  revalidatePath("/admin/institucion");
  revalidatePath("/admin/formatos/acta-electoral");
  revalidatePath("/admin/formatos/certificados");
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
