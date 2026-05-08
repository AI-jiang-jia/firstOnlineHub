import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { GeminiProductCard } from "@/components/gemini-product-card";
import { getAiProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getAiProducts();
  const product = products[0];

  return (
    <main>
      <section className="bg-white">
        <div className="container-shell grid min-h-[520px] items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-medium text-brand">AI 会员自助发卡</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
              GeminiPro 12个月会员
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-muted">
              购买后领取授权卡密，按照教程进入会员开通处理中心完成充值。当前商品支持自助领取，库存实时同步 Supabase 卡密表。
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded bg-zinc-50 px-4 py-2">库存 {product.availableCount}</span>
              <span className="rounded bg-zinc-50 px-4 py-2">已售 {product.soldCount}</span>
              <span className="rounded bg-zinc-50 px-4 py-2">价格 ¥{product.price.toFixed(2)}</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex h-11 items-center gap-2 rounded bg-brand px-6 text-sm font-medium text-white"
              >
                立即购买 <ArrowRight size={17} />
              </Link>
              <Link
                href="/products"
                className="inline-flex h-11 items-center rounded border border-line px-6 text-sm font-medium"
              >
                全部商品
              </Link>
            </div>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="group relative block aspect-[16/11] overflow-hidden rounded bg-zinc-50"
          >
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              className="object-contain p-16 transition duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent p-6">
              <p className="text-sm text-muted">当前主推商品</p>
              <h2 className="mt-1 text-2xl font-semibold">{product.name}</h2>
              <p className="mt-2 font-semibold text-brand">¥{product.price.toFixed(2)}</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="container-shell py-10">
        <div className="rounded bg-sky-100/90 p-6 shadow-soft ring-1 ring-sky-200">
          <div className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
            <Megaphone size={18} />
            公告
          </div>
          <div className="space-y-3 text-base leading-8 text-slate-800">
            <p>本站商品为虚拟会员充值卡密，下单前请确认自己能按教程完成操作。</p>
            <p>请使用支付宝付款并正确填写订单号，订单未确认支付成功前不会发放卡密。</p>
            <p>卡密一经核验发放即视为发货完成，不支持退款、退换或额外售后服务，请谨慎购买。</p>
            <p>
              售后/批发 QQ：3273203513，推荐收藏本站：
              <Link href="https://ai-jiang.netlify.app" className="font-medium text-brand">
                小蒋AI：https://ai-jiang.netlify.app
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="container-shell pb-4">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">在售商品</h2>
            <p className="mt-1 text-sm text-muted">当前在售 AI 会员商品</p>
          </div>
          <Link href="/products" className="text-sm text-brand">
            查看全部
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((item) => (
            <GeminiProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
