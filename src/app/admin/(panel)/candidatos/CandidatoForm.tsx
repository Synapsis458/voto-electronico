"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCandidato, updateCandidato } from "./actions";
import type { Candidato } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";
const fileInputClass = `${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-zinc-800`;

export default function CandidatoForm({ candidato }: { candidato?: Candidato }) {
  const [state, action, pending] = useActionState(
    candidato ? updateCandidato : createCandidato,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && !candidato) formRef.current?.reset();
  }, [state, candidato]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {candidato && <input type="hidden" name="id" value={candidato.id} />}
      <input
        name="dni"
        placeholder="DNI (8 dígitos)"
        required
        maxLength={8}
        defaultValue={candidato?.dni}
        className={inputClass}
      />
      <input
        name="apellidos"
        placeholder="Apellidos"
        required
        defaultValue={candidato?.apellidos}
        className={inputClass}
      />
      <input
        name="nombres"
        placeholder="Nombres"
        required
        defaultValue={candidato?.nombres}
        className={inputClass}
      />
      <input
        name="agrupacion"
        placeholder="Agrupación política"
        required
        defaultValue={candidato?.agrupacion}
        className={inputClass}
      />
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs text-zinc-500">
          Fotografía{candidato ? " (dejar vacío para no cambiar)" : ""}
        </span>
        {candidato?.fotografia_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidato.fotografia_url}
            alt=""
            className="mb-1 h-10 w-10 rounded-full object-cover"
          />
        )}
        <input
          name="fotografia"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={fileInputClass}
        />
      </label>
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs text-zinc-500">
          Símbolo de agrupación{candidato ? " (dejar vacío para no cambiar)" : ""}
        </span>
        {candidato?.simbolo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={candidato.simbolo_url} alt="" className="mb-1 h-10 w-10 object-contain" />
        )}
        <input
          name="simbolo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={fileInputClass}
        />
      </label>
      <input
        name="orden"
        type="number"
        placeholder="Posición en la cédula"
        defaultValue={candidato?.orden}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Guardando..." : candidato ? "Guardar cambios" : "Registrar"}
      </button>
      {state?.error && (
        <p className="col-span-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && candidato && (
        <p className="col-span-full text-sm text-emerald-600">Cambios guardados.</p>
      )}
    </form>
  );
}
