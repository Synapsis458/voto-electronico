export type Institucion = {
  id: string;
  nombre: string;
  logo_url: string;
  proceso_electoral: string;
  mensaje_bienvenida: string;
  foto_portada_url: string;
  fecha_proceso: string | null;
  director: string;
  comite_electoral: string;
  anio_escolar: string;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export type Elector = {
  id: string;
  dni: string;
  apellidos: string;
  nombres: string;
  grado: string;
  seccion: string;
  mesa: string;
  ya_voto: boolean;
  voto_at: string | null;
  created_at: string;
};

export type Candidato = {
  id: string;
  dni: string;
  apellidos: string;
  nombres: string;
  agrupacion: string;
  fotografia_url: string;
  simbolo_url: string;
  orden: number;
  created_at: string;
};

// Titulares y sus suplentes: 1er Suplente (del Presidente), 2do Suplente
// (del Secretario/a) y 3er Suplente (del Vocal). El orden de este arreglo es
// el orden en que se muestran en listas y certificados.
export const CARGOS_TITULARES = ["Presidente", "Secretario(a)", "Vocal"] as const;
export const CARGOS_SUPLENTES = ["1er Suplente", "2do Suplente", "3er Suplente"] as const;
export const CARGOS_MESA = [...CARGOS_TITULARES, ...CARGOS_SUPLENTES] as const;

export type CargoMesa = (typeof CARGOS_MESA)[number];

export type MiembroMesa = {
  id: string;
  mesa: string;
  cargo: CargoMesa;
  apellidos: string;
  nombres: string;
  dni: string;
  created_at: string;
};

// Ordena por mesa y luego por cargo (titulares primero, después suplentes).
export function ordenarMiembros(miembros: MiembroMesa[]): MiembroMesa[] {
  return [...miembros].sort(
    (a, b) =>
      a.mesa.localeCompare(b.mesa, "es", { numeric: true }) ||
      CARGOS_MESA.indexOf(a.cargo) - CARGOS_MESA.indexOf(b.cargo)
  );
}

export type TipoVoto = "candidato" | "blanco";

export type Voto = {
  id: string;
  elector_dni: string;
  candidato_id: string | null;
  tipo_voto: TipoVoto;
  mesa: string;
  fecha: string;
  hora: string;
  created_at: string;
};

// Result row of the "pick an elector" search used when registering candidates
// and miembros de mesa. `bloqueado` (if set) is the reason it cannot be picked.
export type ElectorOpcion = {
  dni: string;
  apellidos: string;
  nombres: string;
  grado: string;
  seccion: string;
  bloqueado?: string;
};
