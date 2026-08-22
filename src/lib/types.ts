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

export type CargoMesa = "Presidente" | "Secretario(a)" | "Vocal";

export type MiembroMesa = {
  id: string;
  mesa: string;
  cargo: CargoMesa;
  apellidos: string;
  nombres: string;
  dni: string;
  created_at: string;
};

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
