import { GeminiProductCard } from "@/components/gemini-product-card";
import { getAiProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getAiProducts();

  return (
    <main>
      <section className="container-shell py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-brand">AI 商品</p>
          <h1 className="mt-2 text-3xl font-semibold">全部商品</h1>
          <p className="mt-2 text-sm text-muted">当前售卖 AI 会员自助发卡商品。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <GeminiProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
