"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export type ElectorState = { error?: string; success?: boolean } | undefined;

export async function createElector(
  _prevState: ElectorState,
  formData: FormData
): Promise<ElectorState> {
  const admin = await requireAdmin();

  const dni = String(formData.get("dni") ?? "").trim();
  if (!/^\d{8}$/.test(dni)) {
    return { error: "El DNI debe tener 8 dígitos." };
  }

  const { error } = await supabaseAdmin.from("electores").insert({
    dni,
    apellidos: String(formData.get("apellidos") ?? "").trim(),
    nombres: String(formData.get("nombres") ?? "").trim(),
    grado: String(formData.get("grado") ?? "").trim(),
    seccion: String(formData.get("seccion") ?? "").trim(),
    mesa: String(formData.get("mesa") ?? "").trim(),
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un elector con ese DNI." : "No se pudo registrar el elector.",
    };
  }

  await logAudit(admin.email ?? "admin", "Registró elector", `DNI ${dni}`);
  revalidatePath("/admin/electores");
  return { success: true };
}

export async function deleteElector(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { data: elector } = await supabaseAdmin
    .from("electores")
    .select("dni")
    .eq("id", id)
    .maybeSingle();

  await supabaseAdmin.from("electores").delete().eq("id", id);
  await logAudit(admin.email ?? "admin", "Eliminó elector", elector ? `DNI ${elector.dni}` : `id ${id}`);
  revalidatePath("/admin/electores");
}

// Administrative override for the elector's voting status:
// - Ya votó -> Pendiente: deletes the recorded vote so the count stays
//   accurate and the elector can vote again (unique constraint on
//   votos.elector_dni would otherwise block a re-vote).
// - Pendiente -> Ya votó: flags the elector as voted without a vote record
//   (e.g. voted on a paper backup, or excluded), so the kiosk turns them away.
export async function toggleVotoElector(id: string) {
  const admin = await requireAdmin();

  const { data: elector } = await supabaseAdmin
    .from("electores")
    .select("dni, ya_voto")
    .eq("id", id)
    .maybeSingle();

  if (!elector) return;

  if (elector.ya_voto) {
    await supabaseAdmin.from("votos").delete().eq("elector_dni", elector.dni);
    await supabaseAdmin
      .from("electores")
      .update({ ya_voto: false, voto_at: null })
      .eq("id", id);
    await logAudit(
      admin.email ?? "admin",
      "Restableció voto a Pendiente",
      `DNI ${elector.dni} — se eliminó su voto registrado`
    );
  } else {
    await supabaseAdmin
      .from("electores")
      .update({ ya_voto: true, voto_at: new Date().toISOString() })
      .eq("id", id);
    await logAudit(
      admin.email ?? "admin",
      "Marcó como Ya votó (manual)",
      `DNI ${elector.dni} — sin registrar candidato`
    );
  }

  revalidatePath("/admin/electores");
  revalidatePath("/admin/resultados");
}

type ElectorRow = {
  dni: string;
  apellidos: string;
  nombres: string;
  grado: string;
  seccion: string;
  mesa: string;
};

export type ImportState =
  | {
      error?: string;
      summary?: {
        total: number;
        importados: number;
        errores: { fila: number; motivo: string }[];
      };
    }
  | undefined;

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.trim().toLowerCase()] = String(value ?? "").trim();
  }
  return out;
}

function field(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return "";
}

export async function importElectores(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const admin = await requireAdmin();

  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo Excel (.xlsx)." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "El archivo no debe superar 5 MB." };
  }

  let rows: Record<string, unknown>[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que sea un Excel válido." };
  }

  const errores: { fila: number; motivo: string }[] = [];
  const validos: ElectorRow[] = [];

  rows.forEach((raw, index) => {
    const n = normalizeRow(raw);
    const dni = field(n, "dni").replace(/\D/g, "");
    const apellidos = field(n, "apellidos", "apellido");
    const nombres = field(n, "nombres", "nombre");
    const fila = index + 2; // header occupies row 1

    if (!/^\d{8}$/.test(dni)) {
      errores.push({ fila, motivo: "DNI inválido (debe tener 8 dígitos)" });
      return;
    }
    if (!apellidos || !nombres) {
      errores.push({ fila, motivo: "Falta apellidos o nombres" });
      return;
    }

    validos.push({
      dni,
      apellidos,
      nombres,
      grado: field(n, "grado"),
      seccion: field(n, "sección", "seccion"),
      mesa: field(n, "mesa"),
    });
  });

  const BATCH_SIZE = 500;
  for (let i = 0; i < validos.length; i += BATCH_SIZE) {
    const batch = validos.slice(i, i + BATCH_SIZE);
    const { error } = await supabaseAdmin
      .from("electores")
      .upsert(batch, { onConflict: "dni" });
    if (error) {
      return { error: `Error al guardar en la base de datos: ${error.message}` };
    }
  }

  await logAudit(
    admin.email ?? "admin",
    "Importó electores desde Excel",
    `${validos.length} de ${rows.length} filas`
  );
  revalidatePath("/admin/electores");

  return {
    summary: {
      total: rows.length,
      importados: validos.length,
      errores: errores.slice(0, 20),
    },
  };
}
