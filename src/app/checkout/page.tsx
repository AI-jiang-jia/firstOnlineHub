import Link from "next/link";
import { createOrder, mockPayOrder } from "@/lib/actions";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!auth.user) {
    return (
      <main className="container-shell py-10">
        <div className="rounded bg-white p-8">
          <h1 className="text-2xl font-semibold">请先登录</h1>
          <Link href="/auth/login" className="mt-4 inline-flex h-10 items-center rounded bg-brand px-5 text-white">去登录</Link>
        </div>
      </main>
    );
  }

  if (params.order) {
    const orderClient = createSupabaseAdminClient() ?? supabase!;
    const { data: order } = await orderClient
      .from("orders")
      .select("*")
      .eq("id", params.order)
      .eq("user_id", auth.user.id)
      .single();

    return (
      <main className="container-shell py-10">
        <section className="mx-auto max-w-xl rounded bg-white p-8 text-center shadow-soft">
          <p className="text-sm font-medium text-brand">模拟支付</p>
          <h1 className="mt-3 text-3xl font-semibold">订单已创建</h1>
          <p className="mt-3 text-muted">本项目不接入真实支付，点击确认即可模拟支付成功。</p>
          <div className="mt-6 rounded bg-zinc-50 p-5 text-left">
            <div className="flex justify-between"><span>订单号</span><span>{params.order.slice(0, 8)}</span></div>
            <div className="mt-3 flex justify-between"><span>金额</span><span className="font-semibold text-brand">¥{Number(order?.total_amount ?? 0).toFixed(2)}</span></div>
          </div>
          <form action={mockPayOrder} className="mt-6">
            <input type="hidden" name="orderId" value={params.order} />
            <button className="h-11 w-full rounded bg-brand font-medium text-white">确认模拟支付</button>
          </form>
        </section>
      </main>
    );
  }

  const { data: items } = await supabase!
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", auth.user.id);
  const total = (items ?? []).reduce((sum, item) => sum + Number(item.products.price) * Number(item.quantity), 0);

  return (
    <main className="container-shell py-10">
      <h1 className="text-3xl font-semibold">确认订单</h1>
      {params.message ? <p className="mt-4 rounded bg-orange-50 px-4 py-3 text-sm text-brand">{params.message}</p> : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form action={createOrder} className="rounded bg-white p-6">
          <h2 className="text-lg font-semibold">收货信息</h2>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium">收件人</span>
            <input name="recipientName" required className="h-11 w-full rounded border border-line px-3" />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">手机号</span>
            <input name="phone" required className="h-11 w-full rounded border border-line px-3" />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium">地址</span>
            <textarea name="address" required rows={4} className="w-full rounded border border-line px-3 py-2" />
          </label>
          <button className="mt-6 h-11 w-full rounded bg-brand font-medium text-white">提交订单</button>
        </form>
        <aside className="h-fit rounded bg-white p-6">
          <h2 className="text-lg font-semibold">订单摘要</h2>
          <div className="mt-4 space-y-3 text-sm">
            {(items ?? []).map((item) => (
              <div key={item.id} className="flex justify-between gap-4">
                <span className="text-muted">{item.products.name} x {item.quantity}</span>
                <span>¥{Number(item.products.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-line pt-4 font-semibold">
            <span>合计</span><span className="text-brand">¥{total.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
