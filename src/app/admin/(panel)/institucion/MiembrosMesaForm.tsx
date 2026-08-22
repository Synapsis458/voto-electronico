"use client";

import { useActionState, useEffect, useRef } from "react";
import { guardarMiembroMesa } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

const CARGOS = ["Presidente", "Secretario(a)", "Vocal"] as const;

export default function MiembrosMesaForm() {
  const [state, action, pending] = useActionState(guardarMiembroMesa, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <select name="cargo" required defaultValue="" className={inputClass}>
        <option value="" disabled>
          Cargo
        </option>
        {CARGOS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input name="apellidos" placeholder="Apellidos" required className={inputClass} />
      <input name="nombres" placeholder="Nombres" required className={inputClass} />
      <input name="dni" placeholder="DNI (opcional)" maxLength={8} className={inputClass} />
      <input name="mesa" placeholder="Mesa (vacío = todas)" className={inputClass} />

      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 sm:col-span-1"
      >
        {pending ? "Guardando..." : "Registrar"}
      </button>

      {state?.error && (
        <p className="col-span-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="col-span-full text-sm text-emerald-600">Miembro guardado.</p>
      )}
    </form>
  );
}
