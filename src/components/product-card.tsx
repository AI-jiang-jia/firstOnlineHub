import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded bg-zinc-100">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className="pt-4">
        <p className="text-sm text-muted">{product.categories?.name ?? "精选服饰"}</p>
        <h3 className="mt-1 line-clamp-1 font-medium">{product.name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-brand">¥{product.price}</span>
          {product.original_price ? (
            <span className="text-sm text-muted line-through">¥{product.original_price}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
