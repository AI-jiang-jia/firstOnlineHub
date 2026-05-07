import { updateOrderStatus } from "@/lib/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Order } from "@/lib/types";

const options = ["pending_payment", "paid_mock", "shipped", "completed", "cancelled"];

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await requireAdmin();

  const admin = createSupabaseAdminClient();
  const { data } = admin
    ? await admin.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })
    : { data: [] };
  const orders = (data ?? []) as Order[];

  return (
    <section className="rounded bg-white p-4">
      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded border border-line p-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h2 className="font-medium">订单 {order.id.slice(0, 8)}</h2>
                <p className="mt-1 text-sm text-muted">{order.recipient_name} / {order.phone} / {order.address}</p>
                <p className="mt-2 font-semibold text-brand">¥{Number(order.total_amount).toFixed(2)}</p>
              </div>
              <form action={updateOrderStatus} className="flex h-10 gap-2">
                <input type="hidden" name="id" value={order.id} />
                <select name="status" defaultValue={order.status} className="rounded border border-line px-3">
                  {options.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button className="rounded bg-ink px-4 text-sm text-white">更新</button>
              </form>
            </div>
          </article>
        ))}
        {!orders.length ? <div className="py-12 text-center text-muted">暂无订单，配置 Supabase 后会显示真实订单。</div> : null}
      </div>
    </section>
  );
}
