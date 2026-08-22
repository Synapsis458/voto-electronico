"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { importElectores } from "./actions";

export default function ImportForm() {
  const [state, action, pending] = useActionState(importElectores, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.summary) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100"
      >
        Importar desde Excel
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <form ref={formRef} action={action} className="flex flex-wrap items-center gap-3">
        <input
          name="archivo"
          type="file"
          accept=".xlsx,.xls"
          required
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm dark:file:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Importando..." : "Importar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Cancelar
        </button>
      </form>

      <p className="mt-2 text-xs text-zinc-500">
        Columnas esperadas: DNI, Apellidos, Nombres, Grado, Sección, Mesa. Los
        electores con un DNI ya registrado se actualizan en vez de duplicarse.
      </p>

      {state?.error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {state?.summary && (
        <div className="mt-3 text-sm">
          <p className="text-emerald-600">
            {state.summary.importados} de {state.summary.total} filas
            importadas correctamente.
          </p>
          {state.summary.errores.length > 0 && (
            <div className="mt-2">
              <p className="text-red-600">
                {state.summary.errores.length} fila
                {state.summary.errores.length === 1 ? "" : "s"} con errores:
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-500">
                {state.summary.errores.map((e) => (
                  <li key={e.fila}>
                    Fila {e.fila}: {e.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
