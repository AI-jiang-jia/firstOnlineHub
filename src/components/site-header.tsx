import Link from "next/link";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-brand text-lg font-bold text-white">
            AI
          </span>
          <span>织选 AI 商城</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/products" className="hover:text-ink">全部商品</Link>
        </nav>
      </div>
    </header>
  );
}
