"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileMinus,
  Keyboard,
  Loader2,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import QrScanner from "@/components/QrScanner";
import { buscarElector, emitirVoto } from "@/app/actions/votacion";
import type { Candidato, Elector } from "@/lib/types";

type Stage =
  | "escaneando"
  | "buscando"
  | "no_registrado"
  | "ya_voto"
  | "votando"
  | "confirmando"
  | "enviando"
  | "gracias"
  | "error";

const AUTO_RETURN_MS = 4000;
const THANKS_MS = 5000;

export default function VotingFlow({
  candidatos,
}: {
  candidatos: Candidato[];
}) {
  const [stage, setStage] = useState<Stage>("escaneando");
  const [elector, setElector] = useState<Elector | null>(null);
  const [seleccion, setSeleccion] = useState<Candidato | "blanco" | null>(
    null
  );
  const busyRef = useRef(false);

  const reset = useCallback(() => {
    setStage("escaneando");
    setElector(null);
    setSeleccion(null);
    busyRef.current = false;
  }, []);

  // Auto-return to the scanner from transient messages.
  useEffect(() => {
    if (
      stage === "no_registrado" ||
      stage === "ya_voto" ||
      stage === "error"
    ) {
      const t = setTimeout(reset, AUTO_RETURN_MS);
      return () => clearTimeout(t);
    }
    if (stage === "gracias") {
      const t = setTimeout(reset, THANKS_MS);
      return () => clearTimeout(t);
    }
  }, [stage, reset]);

  const handleDetected = useCallback(
    async (dni: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setStage("buscando");

      const result = await buscarElector(dni);

      if (result.status === "ok") {
        setElector(result.elector);
        setStage("votando");
        busyRef.current = false;
        return;
      }
      if (result.status === "ya_voto") {
        setStage("ya_voto");
        return;
      }
      setStage("no_registrado");
    },
    []
  );

  const handleConfirmar = useCallback(async () => {
    if (!elector || seleccion === null) return;
    setStage("enviando");
    const candidatoId = seleccion === "blanco" ? null : seleccion.id;
    const result = await emitirVoto(elector.dni, candidatoId);

    if (result.status === "ok") {
      setStage("gracias");
    } else {
      setStage("error");
    }
  }, [elector, seleccion]);

  if (stage === "escaneando" || stage === "buscando") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4">
        <QrScanner active={stage === "escaneando"} onDetected={handleDetected} />
        <p className="text-center text-slate-600 dark:text-slate-400">
          {stage === "buscando"
            ? "Verificando..."
            : "Presenta tu carnet con código QR frente a la cámara."}
        </p>
        {stage === "escaneando" && <EntradaManual onSubmit={handleDetected} />}
      </div>
    );
  }

  if (stage === "no_registrado") {
    return (
      <MensajeTransitorio
        tono="error"
        icono={SearchX}
        texto="Elector no registrado."
      />
    );
  }

  if (stage === "ya_voto") {
    return (
      <MensajeTransitorio
        tono="advertencia"
        icono={ShieldAlert}
        texto="Su voto ya fue registrado."
      />
    );
  }

  if (stage === "error") {
    return (
      <MensajeTransitorio
        tono="error"
        icono={AlertTriangle}
        texto="Ocurrió un problema al registrar tu voto. Intenta nuevamente."
      />
    );
  }

  if (stage === "gracias") {
    return (
      <MensajeTransitorio
        tono="exito"
        icono={CheckCircle2}
        texto="Gracias por participar."
      />
    );
  }

  if ((stage === "votando" || stage === "confirmando" || stage === "enviando") && elector) {
    return (
      <div className="w-full">
        <p className="mb-6 text-center text-slate-600 dark:text-slate-400">
          Bienvenido(a),{" "}
          <span className="font-semibold text-blue-900 dark:text-blue-200">
            {elector.nombres} {elector.apellidos}
          </span>
          . Selecciona tu candidato.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {candidatos.map((c) => {
            const selected = seleccion !== "blanco" && seleccion?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={stage !== "votando"}
                onClick={() => {
                  setSeleccion(c);
                  setStage("confirmando");
                }}
                className={`group flex flex-col items-center gap-2 rounded-2xl border bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-900 ${
                  selected
                    ? "border-blue-600 ring-2 ring-blue-600"
                    : "border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-800"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.fotografia_url || "/candidato-placeholder.svg"}
                  alt={`${c.nombres} ${c.apellidos}`}
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-100 transition-colors group-hover:ring-blue-100 dark:ring-slate-800 dark:group-hover:ring-blue-900"
                />
                {c.simbolo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.simbolo_url} alt="" className="h-8 w-8" />
                )}
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {c.nombres} {c.apellidos}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {c.agrupacion}
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={stage !== "votando"}
          onClick={() => {
            setSeleccion("blanco");
            setStage("confirmando");
          }}
          className={`mx-auto mt-6 flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
            seleccion === "blanco"
              ? "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              : "border-slate-300 text-slate-700 hover:border-blue-300 hover:text-blue-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-300"
          }`}
        >
          <FileMinus className="h-4 w-4" />
          Votar en Blanco
        </button>

        {stage === "confirmando" && (
          <ConfirmModal
            seleccion={seleccion}
            onCancelar={() => {
              setSeleccion(null);
              setStage("votando");
            }}
            onConfirmar={handleConfirmar}
          />
        )}

        {stage === "enviando" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl dark:bg-slate-900">
              <Loader2 className="h-5 w-5 animate-spin text-blue-700 dark:text-blue-400" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                Registrando tu voto...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ConfirmModal({
  seleccion,
  onCancelar,
  onConfirmar,
}: {
  seleccion: Candidato | "blanco" | null;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          ¿Está seguro de emitir su voto?
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {seleccion === "blanco"
            ? "Voto en blanco"
            : `${seleccion?.nombres} ${seleccion?.apellidos} — ${seleccion?.agrupacion}`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function EntradaManual({ onSubmit }: { onSubmit: (dni: string) => void }) {
  const [open, setOpen] = useState(false);
  const [dni, setDni] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-slate-500 underline-offset-2 hover:text-blue-800 hover:underline dark:text-slate-400 dark:hover:text-blue-300"
      >
        <Keyboard className="h-4 w-4" />
        ¿No puedes escanear? Ingresa tu DNI
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (/^\d{8}$/.test(dni)) {
          onSubmit(dni);
          setDni("");
          setOpen(false);
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        value={dni}
        onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
        placeholder="DNI (8 dígitos)"
        inputMode="numeric"
        autoFocus
        className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-blue-500 dark:focus:ring-blue-950"
      />
      <button
        type="submit"
        className="rounded-xl bg-blue-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        Continuar
      </button>
    </form>
  );
}

const TONO_STYLES = {
  error: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  advertencia: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  exito: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
} as const;

const TONO_TEXTO = {
  error: "text-rose-700 dark:text-rose-400",
  advertencia: "text-amber-800 dark:text-amber-400",
  exito: "text-emerald-700 dark:text-emerald-400",
} as const;

function MensajeTransitorio({
  tono,
  icono: Icono,
  texto,
}: {
  tono: keyof typeof TONO_STYLES;
  icono: typeof CheckCircle2;
  texto: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${TONO_STYLES[tono]}`}
      >
        <Icono className="h-8 w-8" />
      </div>
      <p className={`text-xl font-semibold ${TONO_TEXTO[tono]}`}>{texto}</p>
    </div>
  );
}
