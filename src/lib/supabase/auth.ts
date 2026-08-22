import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Session-aware client (anon key + cookies). Used only for Supabase Auth
// (login/logout/getUser) in the admin module — never for reading table data,
// since electores/candidatos/votos have no RLS policies for this role.
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render; the middleware/proxy
          // layer isn't used here, so refresh writes are a no-op — the
          // session is still re-set on the next Server Action/login.
        }
      },
    },
  });
}

// Data Access Layer: the single source of truth for "is this an
// authenticated admin". Call this at the top of every protected admin
// page and every admin Server Action — do not rely on the layout alone.
export async function requireAdmin(): Promise<User> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
