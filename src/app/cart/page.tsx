import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeCartItem, updateCartItem } from "@/lib/actions";
import type { CartItem } from "@/lib/types";

export default async function CartPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!auth.user) {
    return (
      <main className="container-shell py-10">
        <EmptyState title="请先登录" text="登录后即可使用购物车。" />
      </main>
    );
  }

  const { data } = await supabase!
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", auth.user.id);

  const items = (data ?? []) as CartItem[];
  const total = items.reduce((sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity, 0);

  return (
    <main className="container-shell py-10">
      <h1 className="text-3xl font-semibold">购物车</h1>
      {!items.length ? (
        <div className="mt-6"><EmptyState title="购物车为空" text="去挑选几件喜欢的衣服吧。" /></div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 rounded bg-white p-4 sm:grid-cols-[96px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded bg-zinc-100">
                  {item.products ? <Image src={item.products.image_url} alt={item.products.name} fill className="object-cover" /> : null}
                </div>
                <div>
                  <h2 className="font-medium">{item.products?.name}</h2>
                  <p className="mt-1 text-sm text-muted">{item.size} / {item.color}</p>
                  <p className="mt-3 font-semibold text-brand">¥{item.products?.price}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <form action={updateCartItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="quantity" value={Math.max(0, item.quantity - 1)} />
                    <button className="flex h-9 w-9 items-center justify-center rounded border border-line"><Minus size={16} /></button>
                  </form>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <form action={updateCartItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="quantity" value={item.quantity + 1} />
                    <button className="flex h-9 w-9 items-center justify-center rounded border border-line"><Plus size={16} /></button>
                  </form>
                  <form action={removeCartItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="flex h-9 w-9 items-center justify-center rounded border border-line text-muted"><Trash2 size={16} /></button>
                  </form>
                </div>
              </div>
            ))}
          </section>
          <aside className="h-fit rounded bg-white p-5">
            <div className="flex justify-between text-sm text-muted"><span>商品金额</span><span>¥{total.toFixed(2)}</span></div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-semibold"><span>合计</span><span className="text-brand">¥{total.toFixed(2)}</span></div>
            <Link href="/checkout" className="mt-5 flex h-11 items-center justify-center rounded bg-brand font-medium text-white">去结算</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
