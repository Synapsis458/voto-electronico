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

export type ResultadosFiltro = {
  grado?: string;
  seccion?: string;
  mesa?: string;
};

export async function getResultados(filtro: ResultadosFiltro = {}): Promise<Resultados> {
  const { grado, seccion, mesa } = filtro;
  const hayFiltro = Boolean(grado || seccion || mesa);

  let electoresQuery = supabaseAdmin.from("electores").select("dni, ya_voto");
  if (grado) electoresQuery = electoresQuery.eq("grado", grado);
  if (seccion) electoresQuery = electoresQuery.eq("seccion", seccion);
  if (mesa) electoresQuery = electoresQuery.eq("mesa", mesa);

  const [{ data: electoresData }, { data: candidatosData }] = await Promise.all([
    electoresQuery,
    supabaseAdmin.from("candidatos").select("*").order("orden", { ascending: true }),
  ]);

  const electoresFiltrados = electoresData ?? [];
  const dnisFiltrados = electoresFiltrados.map((e) => e.dni);

  let votosQuery = supabaseAdmin.from("votos").select("*");
  if (hayFiltro) votosQuery = votosQuery.in("elector_dni", dnisFiltrados.length > 0 ? dnisFiltrados : [""]);
  const { data: votosData } = await votosQuery;

  const votos = (votosData ?? []) as Voto[];
  const candidatos = (candidatosData ?? []) as Candidato[];

  const electores = electoresFiltrados.length;
  const votantes = electoresFiltrados.filter((e) => e.ya_voto).length;
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
