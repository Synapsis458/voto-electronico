"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const TABS = [
  { href: "/admin/institucion", label: "Institución" },
  { href: "/admin/electores", label: "Electores" },
  { href: "/admin/candidatos", label: "Candidatos" },
  { href: "/admin/carnets", label: "Carnets" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/formatos", label: "Formatos" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Panel de administración
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-2">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
