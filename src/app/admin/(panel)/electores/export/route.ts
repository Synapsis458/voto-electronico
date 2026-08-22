import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Elector } from "@/lib/types";

export async function GET() {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("electores")
    .select("*")
    .order("apellidos", { ascending: true });
  const electores = (data ?? []) as Elector[];

  const rows = electores.map((e) => ({
    DNI: e.dni,
    Apellidos: e.apellidos,
    Nombres: e.nombres,
    Grado: e.grado,
    Sección: e.seccion,
    Mesa: e.mesa,
    Estado: e.ya_voto ? "Ya votó" : "Pendiente",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Electores");
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="electores.xlsx"',
    },
  });
}
