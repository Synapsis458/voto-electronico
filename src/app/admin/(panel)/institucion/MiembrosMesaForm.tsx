"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import ElectorPicker from "@/components/ElectorPicker";
import { CARGOS_SUPLENTES, CARGOS_TITULARES } from "@/lib/types";
import { buscarElectoresParaMesa, guardarMiembroMesa } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export default function MiembrosMesaForm() {
  const [state, action, pending] = useActionState(guardarMiembroMesa, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // After a successful save, clear the elector picker (remount it) and the form.
  const [visto, setVisto] = useState(state);
  const [resetKey, setResetKey] = useState(0);
  if (state !== visto) {
    setVisto(state);
    if (state?.success) setResetKey((k) => k + 1);
  }

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <ElectorPicker
        key={resetKey}
        buscar={buscarElectoresParaMesa}
        placeholder="Buscar al miembro de mesa en la base de electores (DNI, apellidos o nombres)"
      />

      <select name="cargo" required defaultValue="" className={`${inputClass} sm:col-span-1`}>
        <option value="" disabled>
          Cargo
        </option>
        <optgroup label="Titulares">
          {CARGOS_TITULARES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
        <optgroup label="Suplentes">
          {CARGOS_SUPLENTES.map((c, i) => (
            <option key={c} value={c}>
              {c} (de {CARGOS_TITULARES[i]})
            </option>
          ))}
        </optgroup>
      </select>
      <input
        name="mesa"
        placeholder="Mesa (vacío = todas)"
        className={`${inputClass} sm:col-span-2`}
      />

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
