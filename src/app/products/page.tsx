import Link from "next/link";
import { Search } from "lucide-react";
import { getCategories, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ category: params.category, query: params.q })
  ]);

  return (
    <main className="container-shell py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-brand">服饰商城</p>
          <h1 className="mt-2 text-3xl font-semibold">全部商品</h1>
        </div>
        <form className="flex h-11 w-full max-w-md overflow-hidden rounded border border-line bg-white">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="搜索衣服、外套、卫衣"
            className="min-w-0 flex-1 px-4 outline-none"
          />
          <button className="flex w-12 items-center justify-center text-muted">
            <Search size={18} />
          </button>
        </form>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        <Link
          href="/products"
          className={`shrink-0 rounded border px-4 py-2 text-sm ${!params.category ? "border-brand bg-brand text-white" : "border-line bg-white"}`}
        >
          全部
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className={`shrink-0 rounded border px-4 py-2 text-sm ${params.category === category.slug ? "border-brand bg-brand text-white" : "border-line bg-white"}`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title="没有找到商品" text="换个分类或关键词再试试。" />
      )}
    </main>
  );
}
