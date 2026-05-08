import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { AiProduct } from "@/lib/types";

export function GeminiProductCard({ product }: { product: AiProduct }) {
  const productHref = `/products/${product.slug}`;

  return (
    <article className="group rounded bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={productHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded bg-zinc-50">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            className="object-contain p-10 transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 420px"
          />
        </div>
      </Link>
      <div className="pt-4">
        <p className="flex items-center gap-2 text-sm text-brand">
          <Sparkles size={16} />
          AI 会员服务
        </p>
        <Link href={productHref} className="mt-2 block font-medium hover:text-brand">
          {product.name}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <span className="text-2xl font-semibold text-brand">¥{product.price.toFixed(2)}</span>
          <Link
            href={productHref}
            className="inline-flex h-10 items-center gap-2 rounded bg-brand px-4 text-sm font-medium text-white"
          >
            立即购买 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-3 text-sm text-muted">
          库存 {product.availableCount} / 已售 {product.soldCount}
        </div>
      </div>
    </article>
  );
}
