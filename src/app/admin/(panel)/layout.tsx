import { requireAdmin } from "@/lib/supabase/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
