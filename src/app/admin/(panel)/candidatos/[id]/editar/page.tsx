import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Candidato } from "@/lib/types";
import CandidatoForm from "../../CandidatoForm";

export default async function EditarCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const { data } = await supabaseAdmin.from("candidatos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div>
      <Link
        href="/admin/candidatos"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Volver a Candidatos
      </Link>
      <h1 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Editar candidato
      </h1>
      <CandidatoForm candidato={data as Candidato} />
    </div>
  );
}
