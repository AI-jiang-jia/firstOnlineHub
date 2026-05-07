import Link from "next/link";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

const statusText: Record<string, string> = {
  pending_payment: "待支付",
  paid_mock: "已模拟支付",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消"
};

export default async function OrdersPage() {
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

  const orderClient = createSupabaseAdminClient() ?? supabase!;
  const { data } = await orderClient
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <main className="container-shell py-10">
      <h1 className="text-3xl font-semibold">我的订单</h1>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="font-medium">订单 {order.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm text-muted">{new Date(order.created_at).toLocaleString("zh-CN")}</p>
              </div>
              <span className="h-fit rounded bg-orange-50 px-3 py-1 text-sm text-brand">{statusText[order.status]}</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product_snapshot.name} x {item.quantity}</span>
                  <span>¥{Number(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right font-semibold text-brand">¥{Number(order.total_amount).toFixed(2)}</div>
          </article>
        ))}
        {!orders.length ? <div className="rounded bg-white p-8 text-center text-muted">暂无订单</div> : null}
      </div>
    </main>
  );
}
