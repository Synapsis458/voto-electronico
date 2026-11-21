"use client";

import { useEffect, useState } from "react";
import { Search, UserCheck, X } from "lucide-react";
import { buscarElectoresParaCandidato, type ElectorOpcion } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

// Candidates must come from the electores table: the admin searches the elector
// by DNI / name and picks one. Only the DNI is submitted; the server reads the
// names from the electores table itself.
export default function ElectorPicker() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ElectorOpcion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [elegido, setElegido] = useState<ElectorOpcion | null>(null);

  useEffect(() => {
    const termino = q.trim();
    if (termino.length < 2) return;
    let cancelado = false;
    const t = setTimeout(async () => {
      setBuscando(true);
      const r = await buscarElectoresParaCandidato(termino);
      if (!cancelado) {
        setResultados(r);
        setBuscando(false);
      }
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [q]);

  const visibles = q.trim().length >= 2 ? resultados : [];

  if (elegido) {
    return (
      <div className="col-span-full flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/40">
        <input type="hidden" name="dni" value={elegido.dni} />
        <div className="flex min-w-0 items-center gap-2">
          <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {elegido.apellidos}, {elegido.nombres}
            </p>
            <p className="text-xs text-zinc-500">
              DNI {elegido.dni}
              {elegido.grado && ` · ${elegido.grado}`}
              {elegido.seccion && ` ${elegido.seccion}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setElegido(null);
            setQ("");
          }}
          className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <X className="h-3.5 w-3.5" />
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative col-span-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar elector por DNI, apellidos o nombres (obligatorio)"
          autoComplete="off"
          className={`${inputClass} pl-9`}
        />
      </div>
      {q.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {buscando && visibles.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-500">Buscando...</li>
          )}
          {!buscando && visibles.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-500">
              No hay electores con ese dato. Regístralo primero en la pestaña
              Electores.
            </li>
          )}
          {visibles.map((e) => (
            <li key={e.dni}>
              <button
                type="button"
                disabled={e.yaEsCandidato}
                onClick={() => setElegido(e)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <span className="min-w-0 truncate">
                  {e.apellidos}, {e.nombres}
                </span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {e.yaEsCandidato ? "Ya es candidato · " : ""}
                  {e.dni}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
