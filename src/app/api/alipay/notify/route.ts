import { NextResponse } from "next/server";
import {
  amountMatches,
  getAlipayAppId,
  type AlipayNotifyPayload,
  verifyAlipayNotify
} from "@/lib/alipay";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_TRADE_STATUSES = new Set(["TRADE_SUCCESS", "TRADE_FINISHED"]);

function alipayResponse(body: "success" | "failure") {
  return new NextResponse(body, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

function toPayload(formData: FormData): AlipayNotifyPayload {
  const payload: AlipayNotifyPayload = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      payload[key] = value;
    }
  });
  return payload;
}

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return alipayResponse("failure");
  }

  const payload = toPayload(await request.formData());

  if (!verifyAlipayNotify(payload)) {
    return alipayResponse("failure");
  }

  if (payload.app_id !== getAlipayAppId()) {
    return alipayResponse("failure");
  }

  const orderNo = payload.out_trade_no?.trim().toUpperCase();
  const tradeStatus = payload.trade_status;
  const totalAmount = payload.total_amount;

  if (!orderNo || !tradeStatus || !totalAmount) {
    return alipayResponse("failure");
  }

  const { data: order, error: orderError } = await admin
    .from("payment_orders")
    .select("order_no, amount, status")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (orderError || !order) {
    return alipayResponse("failure");
  }

  if (!amountMatches(Number(order.amount), totalAmount)) {
    return alipayResponse("failure");
  }

  if (!PAID_TRADE_STATUSES.has(tradeStatus)) {
    await admin
      .from("payment_orders")
      .update({ alipay_notify_payload: payload })
      .eq("order_no", orderNo);
    return alipayResponse("success");
  }

  if (order.status === "pending" || order.status === "paid") {
    const { error: updateError } = await admin
      .from("payment_orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        alipay_trade_no: payload.trade_no ?? null,
        alipay_notify_payload: payload
      })
      .eq("order_no", orderNo)
      .in("status", ["pending", "paid"]);

    if (updateError) {
      return alipayResponse("failure");
    }
  } else {
    await admin
      .from("payment_orders")
      .update({ alipay_notify_payload: payload })
      .eq("order_no", orderNo);
  }

  return alipayResponse("success");
}
