import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";

const FORMATOS = [
  { href: "/admin/formatos/electores", label: "Lista de electores", desc: "Con espacio para firma." },
  { href: "/admin/formatos/candidatos", label: "Lista de candidatos", desc: "Fotografía, símbolo y agrupación." },
  { href: "/admin/formatos/cedula", label: "Cédula de votación", desc: "Formato físico de respaldo." },
  {
    href: "/admin/formatos/cartel",
    label: "Cartel de candidatos para difusión",
    desc: "Afiche para pegar en lugares visibles, se adapta a la cantidad de candidatos.",
  },
  {
    href: "/admin/formatos/acta-electoral",
    label: "Acta Electoral",
    desc: "Instalación, sufragio y escrutinio en un solo formato, con resultados y personeros auto-completados.",
  },
  {
    href: "/admin/formatos/certificados",
    label: "Certificados de miembros de mesa",
    desc: "Uno por cada Presidente/Secretario(a)/Vocal registrado, con su mesa asignada.",
  },
];

export default async function FormatosPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Formatos
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Documentos oficiales listos para imprimir (Ctrl/Cmd+P).
      </p>
      <ul className="grid max-w-lg gap-2">
        {FORMATOS.map((f) => (
          <li key={f.href}>
            <Link
              href={f.href}
              className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-100"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{f.label}</p>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
