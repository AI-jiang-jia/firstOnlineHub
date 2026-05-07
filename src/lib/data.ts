import { createSupabaseServerClient } from "@/lib/supabase/server";
import { demoCategories, demoProducts } from "@/lib/mock-data";
import type { Category, Product } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoCategories;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error || !data?.length || data.length < demoCategories.length) return demoCategories;
  return data;
}

export async function getProducts(options?: {
  category?: string;
  query?: string;
  includeInactive?: boolean;
}): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return filterDemoProducts(options);

  let request = supabase
    .from("products")
    .select("*, categories(*)")
    .order("created_at", { ascending: false });

  if (!options?.includeInactive) {
    request = request.eq("is_active", true);
  }

  if (options?.query) {
    request = request.ilike("name", `%${options.query}%`);
  }

  if (options?.category) {
    const category = demoCategories.find((item) => item.slug === options.category);
    if (category) request = request.eq("category_id", category.id);
  }

  const { data, error } = await request;
  if (error || !data?.length) return filterDemoProducts(options);
  return data;
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return demoProducts.find((product) => product.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return demoProducts.find((product) => product.slug === slug) ?? null;
  }

  return data;
}

function filterDemoProducts(options?: {
  category?: string;
  query?: string;
  includeInactive?: boolean;
}) {
  return demoProducts.filter((product) => {
    const categoryMatch = !options?.category || product.categories?.slug === options.category;
    const queryMatch =
      !options?.query ||
      product.name.toLowerCase().includes(options.query.toLowerCase()) ||
      product.description?.toLowerCase().includes(options.query.toLowerCase());

    return categoryMatch && queryMatch && (options?.includeInactive || product.is_active);
  });
}
