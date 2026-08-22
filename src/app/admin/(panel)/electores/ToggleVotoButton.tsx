"use client";

import { useTransition } from "react";
import { toggleVotoElector } from "./actions";

export default function ToggleVotoButton({
  id,
  yaVoto,
}: {
  id: string;
  yaVoto: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const mensaje = yaVoto
      ? "¿Restablecer a Pendiente? Esto elimina su voto registrado y le permite volver a votar."
      : "¿Marcar como Ya votó? No se registrará un candidato; el elector ya no podrá votar desde la pantalla principal.";

    if (!confirm(mensaje)) return;
    startTransition(() => {
      toggleVotoElector(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-blue-600 hover:underline disabled:opacity-60 dark:text-blue-400"
    >
      {pending ? "..." : yaVoto ? "Marcar pendiente" : "Marcar como votado"}
    </button>
  );
}
