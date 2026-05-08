import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { PaymentPanel } from "@/components/payment-panel";
import { getAiProduct } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getAiProduct(slug);

  if (!product) notFound();

  return (
    <main className="container-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded bg-white">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            className="object-contain p-16"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </div>

        <section className="rounded bg-white p-6 md:p-8">
          <p className="text-sm text-brand">AI 会员服务</p>
          <h1 className="mt-3 text-3xl font-semibold">{product.name}</h1>
          <p className="mt-4 leading-8 text-muted">{product.description}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-brand">¥{product.price.toFixed(2)}</span>
            <span className="rounded bg-zinc-50 px-3 py-1 text-sm text-muted">库存 {product.availableCount}</span>
            <span className="rounded bg-zinc-50 px-3 py-1 text-sm text-muted">已售 {product.soldCount}</span>
          </div>
          <div className="mt-8 grid gap-4">
            <div className="flex flex-col justify-between rounded border border-line p-4">
              <div>
                <h2 className="font-semibold">充值入口</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  支付核验通过并领取卡密后，进入会员开通处理中心，按下方教程填写资料。
                </p>
              </div>
              <Link
                href={product.recharge_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded bg-ink px-5 text-sm font-medium text-white"
              >
                点我充值 <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-brand">充值教程</p>
          <h2 className="mt-2 text-2xl font-semibold">{product.tutorial_title}</h2>
          <div className="mt-6 grid gap-4">
            {product.tutorial_images.map((image, index) => (
              <figure key={image} className="overflow-hidden rounded border border-line bg-zinc-50">
                <Image
                  src={image}
                  alt={`${product.name}充值教程第 ${index + 1} 张`}
                  width={1400}
                  height={980}
                  className="h-auto w-full"
                />
              </figure>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <PaymentPanel productSlug={product.slug} price={product.price} />
          <div className="rounded bg-orange-50 p-5 text-sm leading-6 text-orange-900">
            安全规则：未确认支付成功的订单不能领取卡密；取消支付、支付失败或订单号不匹配都不会发卡。
          </div>
          <Link href="/products" className="inline-flex h-11 w-full items-center justify-center rounded border border-line bg-white text-sm font-medium">
            返回商品列表
          </Link>
        </div>
      </section>
    </main>
  );
}
