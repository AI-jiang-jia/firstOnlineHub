import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Truck, Shield, RotateCcw } from "lucide-react";
import { getCategories, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const featured = products[0];

  return (
    <main>
      <section className="bg-white">
        <div className="container-shell grid min-h-[520px] items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-brand">2026 春夏衣橱焕新</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
              织选商城
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-muted">
              用简洁、清爽的购物体验售卖衣服，支持账号、购物车、订单、模拟支付和后台管理。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center gap-2 rounded bg-brand px-6 text-sm font-medium text-white"
              >
                立即选购 <ArrowRight size={17} />
              </Link>
              <Link
                href="/admin/products"
                className="inline-flex h-11 items-center rounded border border-line px-6 text-sm font-medium"
              >
                商家后台
              </Link>
            </div>
          </div>
          {featured ? (
            <Link href={`/products/${featured.slug}`} className="group relative block aspect-[16/11] overflow-hidden rounded bg-zinc-100">
              <Image
                src={featured.image_url}
                alt={featured.name}
                fill
                priority
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <p className="text-sm opacity-80">主推单品</p>
                <h2 className="mt-1 text-2xl font-semibold">{featured.name}</h2>
                <p className="mt-2">¥{featured.price}</p>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="container-shell py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded bg-white p-5">
            <Truck className="text-brand" />
            <div><h3 className="font-medium">满额包邮</h3><p className="text-sm text-muted">订单流程可扩展真实物流</p></div>
          </div>
          <div className="flex items-center gap-4 rounded bg-white p-5">
            <Shield className="text-brand" />
            <div><h3 className="font-medium">账号保护</h3><p className="text-sm text-muted">基于 Supabase Auth</p></div>
          </div>
          <div className="flex items-center gap-4 rounded bg-white p-5">
            <RotateCcw className="text-brand" />
            <div><h3 className="font-medium">后台运营</h3><p className="text-sm text-muted">商品、库存、订单统一管理</p></div>
          </div>
        </div>
      </section>

      <section className="container-shell pb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">热门分类</h2>
            <p className="mt-1 text-sm text-muted">用清晰分类提升服饰浏览效率</p>
          </div>
          <Link href="/products" className="text-sm text-brand">全部商品</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="rounded bg-white p-6 transition hover:-translate-y-1 hover:shadow-soft"
            >
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm text-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">新品上架</h2>
          <Link href="/products" className="text-sm text-brand">查看更多</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
