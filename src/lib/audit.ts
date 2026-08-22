import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function logAudit(
  adminEmail: string,
  accion: string,
  detalle: string = ""
): Promise<void> {
  await supabaseAdmin.from("auditoria").insert({ admin_email: adminEmail, accion, detalle });
}
