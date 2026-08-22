import { requireAdmin } from "@/lib/supabase/auth";

const FORMATOS = [
  "Lista de electores",
  "Lista de candidatos",
  "Cédula de votación",
  "Acta de instalación",
  "Acta de sufragio",
  "Acta de escrutinio",
  "Acta final",
];

export default async function FormatosPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Formatos
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        En construcción — próxima iteración.
      </p>
      <ul className="grid max-w-md gap-2">
        {FORMATOS.map((f) => (
          <li
            key={f}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
          >
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
