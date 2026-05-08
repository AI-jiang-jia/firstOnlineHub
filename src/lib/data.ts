import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { demoCategories, demoProducts } from "@/lib/mock-data";
import type { AiProduct, Category, Product } from "@/lib/types";

export const AI_PRODUCTS_BASE = [
  {
    id: "gemini-pro-12-months",
    name: "GeminiPro 12个月会员",
    slug: "gemini-pro-12-months",
    description:
      "适合需要长期使用 Gemini Pro 的用户。购买后领取授权卡密，并按教程进入会员开通处理中心完成充值。",
    price: 39.9,
    image_url: "/products/gemini.svg",
    recharge_url: "https://Gemini.mumuislin.xyz",
    tutorial_title: "按图完成 GeminiPro 会员开通",
    tutorial_images: [
      "/tutorials/gemini-step-1.jpg",
      "/tutorials/gemini-step-2.jpg",
      "/tutorials/gemini-step-3.jpg"
    ]
  },
  {
    id: "chatgpt-plus-monthly",
    name: "ChatGPT Plus月会员",
    slug: "chatgpt-plus-monthly",
    description:
      "适合需要短期体验 ChatGPT Plus 的用户。购买后领取授权卡密，并进入充值入口完成自助充值。",
    price: 138,
    image_url: "/products/chatgpt.svg",
    recharge_url: "http://aicz.it.com/",
    tutorial_title: "按图完成 ChatGPT Plus 会员开通",
    tutorial_images: [
      "/tutorials/gemini-step-1.jpg",
      "/tutorials/gemini-step-2.jpg",
      "/tutorials/gemini-step-3.jpg"
    ]
  }
];

async function getProductInventory(productSlug: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return productSlug === "chatgpt-plus-monthly"
      ? { availableCount: 1, soldCount: 0 }
      : { availableCount: 2, soldCount: 0 };
  }

  const [available, sold] = await Promise.all([
    supabase
      .from("gemini_cards")
      .select("id", { count: "exact", head: true })
      .eq("product_slug", productSlug)
      .eq("status", "available"),
    supabase
      .from("gemini_cards")
      .select("id", { count: "exact", head: true })
      .eq("product_slug", productSlug)
      .eq("status", "sold")
  ]);

  if (available.error || sold.error) {
    return { availableCount: 0, soldCount: 0 };
  }

  return {
    availableCount: available.count ?? 0,
    soldCount: sold.count ?? 0
  };
}

export async function getAiProducts(): Promise<AiProduct[]> {
  return Promise.all(
    AI_PRODUCTS_BASE.map(async (product) => ({
      ...product,
      ...(await getProductInventory(product.slug))
    }))
  );
}

export async function getAiProduct(slug: string): Promise<AiProduct | null> {
  const product = AI_PRODUCTS_BASE.find((item) => item.slug === slug);
  if (!product) return null;

  return {
    ...product,
    ...(await getProductInventory(product.slug))
  };
}

export async function getGeminiProduct(): Promise<AiProduct> {
  const product = await getAiProduct("gemini-pro-12-months");
  if (!product) throw new Error("Gemini product is missing");
  return product;
}

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
