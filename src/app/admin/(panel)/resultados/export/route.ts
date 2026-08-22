import * as XLSX from "xlsx";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { getResultados } from "@/lib/resultados";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = request.nextUrl;
  const grado = searchParams.get("grado") ?? undefined;
  const seccion = searchParams.get("seccion") ?? undefined;
  const mesa = searchParams.get("mesa") ?? undefined;

  const r = await getResultados({ grado, seccion, mesa });

  const resumenRows = [
    { Indicador: "Total de electores", Valor: r.electores },
    { Indicador: "Total de votantes", Valor: r.votantes },
    { Indicador: "Participación (%)", Valor: r.participacion },
    { Indicador: "Abstenciones", Valor: r.abstenciones },
    { Indicador: "Votos válidos", Valor: r.votosValidos },
    { Indicador: "Votos en blanco", Valor: r.votosBlanco },
  ];
  if (grado) resumenRows.unshift({ Indicador: "Grado", Valor: grado as unknown as number });
  if (seccion) resumenRows.unshift({ Indicador: "Sección", Valor: seccion as unknown as number });
  if (mesa) resumenRows.unshift({ Indicador: "Mesa", Valor: mesa as unknown as number });

  const candidatosRows = r.porCandidato.map((p) => ({
    Candidato: `${p.candidato.nombres} ${p.candidato.apellidos}`,
    Agrupación: p.candidato.agrupacion,
    Votos: p.total,
    "Porcentaje (%)": p.porcentaje,
  }));
  candidatosRows.push({
    Candidato: "Voto en blanco",
    Agrupación: "—",
    Votos: r.votosBlanco,
    "Porcentaje (%)": r.porcentajeBlanco,
  });

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(resumenRows), "Resumen");
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(candidatosRows), "Por candidato");
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="resultados.xlsx"',
    },
  });
}
