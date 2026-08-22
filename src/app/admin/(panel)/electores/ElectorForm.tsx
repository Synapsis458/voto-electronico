"use client";

import { useActionState, useEffect, useRef } from "react";
import { createElector } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export default function ElectorForm() {
  const [state, action, pending] = useActionState(createElector, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input name="dni" placeholder="DNI (8 dígitos)" required maxLength={8} className={inputClass} />
      <input name="apellidos" placeholder="Apellidos" required className={`${inputClass} sm:col-span-2`} />
      <input name="nombres" placeholder="Nombres" required className={`${inputClass} sm:col-span-2`} />
      <input name="grado" placeholder="Grado" className={inputClass} />
      <input name="seccion" placeholder="Sección" className={inputClass} />
      <input name="mesa" placeholder="Mesa" className={inputClass} />
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
