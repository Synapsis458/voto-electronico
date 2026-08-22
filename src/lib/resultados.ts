import { supabaseAdmin } from "@/lib/supabase/server";
import type { Candidato, Voto } from "@/lib/types";

export type ResultadoCandidato = {
  candidato: Candidato;
  total: number;
  porcentaje: number;
};

export type Resultados = {
  electores: number;
  votantes: number;
  abstenciones: number;
  participacion: number;
  votosValidos: number;
  votosBlanco: number;
  totalVotos: number;
  porCandidato: ResultadoCandidato[];
  porcentajeBlanco: number;
};

export async function getResultados(): Promise<Resultados> {
  const [{ count: totalElectores }, { count: totalVotantes }, { data: votosData }, { data: candidatosData }] =
    await Promise.all([
      supabaseAdmin.from("electores").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("electores")
        .select("*", { count: "exact", head: true })
        .eq("ya_voto", true),
      supabaseAdmin.from("votos").select("*"),
      supabaseAdmin.from("candidatos").select("*").order("orden", { ascending: true }),
    ]);

  const votos = (votosData ?? []) as Voto[];
  const candidatos = (candidatosData ?? []) as Candidato[];

  const electores = totalElectores ?? 0;
  const votantes = totalVotantes ?? 0;
  const abstenciones = Math.max(electores - votantes, 0);
  const participacion = electores > 0 ? Math.round((votantes / electores) * 1000) / 10 : 0;
  const votosBlanco = votos.filter((v) => v.tipo_voto === "blanco").length;
  const votosValidos = votos.length - votosBlanco;

  const porCandidato = candidatos.map((candidato) => {
    const total = votos.filter((v) => v.candidato_id === candidato.id).length;
    const porcentaje = votos.length > 0 ? Math.round((total / votos.length) * 1000) / 10 : 0;
    return { candidato, total, porcentaje };
  });

  return {
    electores,
    votantes,
    abstenciones,
    participacion,
    votosValidos,
    votosBlanco,
    totalVotos: votos.length,
    porCandidato,
    porcentajeBlanco: votos.length > 0 ? Math.round((votosBlanco / votos.length) * 1000) / 10 : 0,
  };
}
