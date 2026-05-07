import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserRole() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  return profile?.role ?? "customer";
}

export async function requireAdmin() {
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/auth/login?message=需要管理员账号");
  }
}
