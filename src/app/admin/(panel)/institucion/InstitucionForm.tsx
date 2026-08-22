"use client";

import { useActionState } from "react";
import { saveInstitucion } from "./actions";
import type { Institucion } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";
const labelClass =
  "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function InstitucionForm({
  institucion,
}: {
  institucion: Institucion;
}) {
  const [state, action, pending] = useActionState(saveInstitucion, undefined);

  return (
    <form
      action={action}
      className="grid max-w-2xl gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="id" value={institucion.id} />

      <div>
        <label className={labelClass} htmlFor="nombre">
          Nombre de la Institución Educativa
        </label>
        <input
          id="nombre"
          name="nombre"
          defaultValue={institucion.nombre}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="proceso_electoral">
          Nombre del proceso electoral
        </label>
        <input
          id="proceso_electoral"
          name="proceso_electoral"
          defaultValue={institucion.proceso_electoral}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mensaje_bienvenida">
          Mensaje de bienvenida
        </label>
        <textarea
          id="mensaje_bienvenida"
          name="mensaje_bienvenida"
          defaultValue={institucion.mensaje_bienvenida}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="fecha_proceso">
            Fecha del proceso electoral
          </label>
          <input
            id="fecha_proceso"
            name="fecha_proceso"
            type="date"
            defaultValue={institucion.fecha_proceso ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="anio_escolar">
            Año escolar
          </label>
          <input
            id="anio_escolar"
            name="anio_escolar"
            defaultValue={institucion.anio_escolar}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className={labelClass}>Horario de votación</p>
        <p className="mb-3 text-xs text-zinc-500">
          Fuera de este horario, la pantalla principal no permitirá emitir
          votos. Deja ambos campos vacíos para no aplicar ningún límite de
          horario.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="hora_inicio">
              Hora de inicio
            </label>
            <input
              id="hora_inicio"
              name="hora_inicio"
              type="time"
              defaultValue={institucion.hora_inicio?.slice(0, 5) ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="hora_fin">
              Hora de culminación
            </label>
            <input
              id="hora_fin"
              name="hora_fin"
              type="time"
              defaultValue={institucion.hora_fin?.slice(0, 5) ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="director">
          Director
        </label>
        <input
          id="director"
          name="director"
          defaultValue={institucion.director}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="comite_electoral">
          Comité Electoral
        </label>
        <textarea
          id="comite_electoral"
          name="comite_electoral"
          defaultValue={institucion.comite_electoral}
          rows={2}
          className={inputClass}
          placeholder="Nombres de los integrantes, uno por línea"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="logo">
            Logo institucional
          </label>
          {institucion.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institucion.logo_url}
              alt="Logo actual"
              className="mb-2 h-16 w-16 rounded-lg object-contain"
            />
          )}
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-zinc-800`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="foto_portada">
            Fotografía principal del proceso
          </label>
          {institucion.foto_portada_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={institucion.foto_portada_url}
              alt="Portada actual"
              className="mb-2 h-16 w-28 rounded-lg object-cover"
            />
          )}
          <input
            id="foto_portada"
            name="foto_portada"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-zinc-800`}
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">Cambios guardados.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
