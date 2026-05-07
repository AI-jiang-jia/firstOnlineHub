import Link from "next/link";
import { ShoppingBag, UserRound, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-brand text-lg font-bold text-white">
            Z
          </span>
          <span>织选商城</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/products" className="hover:text-ink">全部商品</Link>
          <Link href="/products?category=women" className="hover:text-ink">女士精选</Link>
          <Link href="/products?category=men" className="hover:text-ink">男士日常</Link>
          <Link href="/products?category=sport" className="hover:text-ink">运动休闲</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="hidden h-9 items-center gap-2 rounded border border-line px-3 text-sm text-muted hover:border-brand hover:text-brand sm:flex"
            title="后台"
          >
            <ShieldCheck size={17} />
            后台
          </Link>
          <Link
            href="/cart"
            className="flex h-9 w-9 items-center justify-center rounded border border-line hover:border-brand hover:text-brand"
            title="购物车"
          >
            <ShoppingBag size={18} />
          </Link>
          {data.user ? (
            <form action={signOut}>
              <button className="h-9 rounded bg-ink px-4 text-sm text-white">退出</button>
            </form>
          ) : (
            <Link
              href="/auth/login"
              className="flex h-9 items-center gap-2 rounded bg-ink px-4 text-sm text-white"
            >
              <UserRound size={17} />
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
