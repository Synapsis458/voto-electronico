"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCandidato } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";
const fileInputClass = `${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-zinc-800`;

export default function CandidatoForm() {
  const [state, action, pending] = useActionState(createCandidato, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input name="dni" placeholder="DNI (8 dígitos)" required maxLength={8} className={inputClass} />
      <input name="apellidos" placeholder="Apellidos" required className={inputClass} />
      <input name="nombres" placeholder="Nombres" required className={inputClass} />
      <input name="agrupacion" placeholder="Agrupación política" required className={inputClass} />
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs text-zinc-500">Fotografía</span>
        <input
          name="fotografia"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={fileInputClass}
        />
      </label>
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs text-zinc-500">Símbolo de agrupación</span>
        <input
          name="simbolo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className={fileInputClass}
        />
      </label>
      <input name="orden" type="number" placeholder="Posición en la cédula" className={inputClass} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Guardando..." : "Registrar"}
      </button>
      {state?.error && (
        <p className="col-span-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
