import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { getProduct } from "@/lib/data";
import { addToCart } from "@/lib/actions";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <main className="container-shell py-10">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded bg-white">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <section className="rounded bg-white p-6 md:p-8">
          <p className="text-sm text-brand">{product.categories?.name ?? "精选服饰"}</p>
          <h1 className="mt-3 text-3xl font-semibold">{product.name}</h1>
          <p className="mt-4 leading-8 text-muted">{product.description}</p>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-brand">¥{product.price}</span>
            {product.original_price ? (
              <span className="text-muted line-through">¥{product.original_price}</span>
            ) : null}
          </div>

          <form action={addToCart} className="mt-8 space-y-5">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="redirectTo" value={`/products/${product.slug}`} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium">尺码</span>
              <select name="size" className="h-11 w-full rounded border border-line bg-white px-3">
                {product.sizes.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">颜色</span>
              <select name="color" className="h-11 w-full rounded border border-line bg-white px-3">
                {product.colors.map((color) => (
                  <option key={color}>{color}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">数量</span>
              <input
                name="quantity"
                type="number"
                min="1"
                max={product.stock}
                defaultValue="1"
                className="h-11 w-28 rounded border border-line px-3"
              />
            </label>
            <button
              disabled={product.stock <= 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded bg-brand font-medium text-white disabled:bg-zinc-300"
            >
              <ShoppingBag size={19} />
              加入购物车
            </button>
          </form>

          <div className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-3">
            <div className="rounded bg-zinc-50 p-3">库存 {product.stock} 件</div>
            <div className="rounded bg-zinc-50 p-3">模拟支付</div>
            <div className="rounded bg-zinc-50 p-3">支持后台管理</div>
          </div>
          <Link href="/products" className="mt-6 inline-block text-sm text-brand">返回商品列表</Link>
        </section>
      </div>
    </main>
  );
}
