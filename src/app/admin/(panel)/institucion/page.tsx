import { requireAdmin } from "@/lib/supabase/auth";
import { getInstitucion } from "@/lib/institucion";
import InstitucionForm from "./InstitucionForm";

export default async function InstitucionPage() {
  await requireAdmin();
  const institucion = await getInstitucion();

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Institución Educativa
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Esta información aparece en la pantalla principal, carnets, formatos,
        reportes y cédulas de votación.
      </p>
      <InstitucionForm institucion={institucion} />
    </div>
  );
}
