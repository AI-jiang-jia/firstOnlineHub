import { getCategories } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await requireAdmin();

  const categories = await getCategories();

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <div key={category.id} className="rounded bg-white p-5">
          <h2 className="font-semibold">{category.name}</h2>
          <p className="mt-2 text-sm text-muted">{category.description}</p>
          <p className="mt-4 text-xs uppercase text-muted">{category.slug}</p>
        </div>
      ))}
    </section>
  );
}
