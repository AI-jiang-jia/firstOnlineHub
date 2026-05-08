"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Copy, KeyRound, Loader2, QrCode } from "lucide-react";
import {
  claimPaidOrderCard,
  checkPaymentOrderStatus,
  createPaymentOrder,
  type PaymentOrderStatusState,
  type PaymentPanelState
} from "@/lib/actions";

const initialState: PaymentPanelState = { status: "idle" };
type PolledPaymentStatus = PaymentOrderStatusState & { orderNo: string };

export function PaymentPanel({ productSlug, price }: { productSlug: string; price: number }) {
  const [orderState, createOrderAction, isCreating] = useActionState(
    createPaymentOrder,
    initialState
  );
  const [claimState, claimAction, isClaiming] = useActionState(claimPaidOrderCard, initialState);
  const orderNo = claimState.orderNo || orderState.orderNo || "";
  const [paymentStatus, setPaymentStatus] = useState<PolledPaymentStatus | null>(null);

  useEffect(() => {
    if (orderState.status !== "order_created" || !orderState.orderNo) {
      return;
    }

    let stopped = false;

    async function pollOrderStatus() {
      const result = await checkPaymentOrderStatus(orderState.orderNo ?? "");
      if (!stopped) {
        setPaymentStatus({ ...result, orderNo: orderState.orderNo ?? "" });
      }
      return result.status;
    }

    pollOrderStatus();
    const timer = window.setInterval(async () => {
      const status = await pollOrderStatus();
      if (status === "paid" || status === "fulfilled" || status === "cancelled") {
        window.clearInterval(timer);
      }
    }, 4000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [orderState.orderNo, orderState.status]);

  return (
    <div className="rounded bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
          <QrCode size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">支付宝付款</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            先生成订单，再用支付宝扫码支付。支付成功后系统会自动确认，可点击领取卡密。
          </p>
        </div>
      </div>

      <form action={createOrderAction} className="mt-5">
        <input type="hidden" name="productSlug" value={productSlug} />
        <button
          disabled={isCreating}
          className="flex h-12 w-full items-center justify-center rounded bg-brand font-medium text-white disabled:bg-zinc-300"
        >
          {isCreating ? "正在生成订单..." : `生成 ¥${price.toFixed(2)} 付款订单`}
        </button>
      </form>

      {orderState.status === "order_created" && orderState.orderNo ? (
        <div className="mt-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p>{orderState.message}</p>
          {orderState.qrCodeDataUrl ? (
            <div className="mt-4 rounded border border-line bg-white p-3">
              <div className="relative mx-auto aspect-square max-w-[260px] overflow-hidden rounded bg-white">
                <Image
                  src={orderState.qrCodeDataUrl}
                  alt="支付宝付款二维码"
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="260px"
                />
              </div>
            </div>
          ) : null}
          <div className="mt-3 flex flex-col gap-3 rounded bg-white p-3 text-ink sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all text-base font-semibold">{orderState.orderNo}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(orderState.orderNo ?? "")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded border border-line px-3 text-sm"
            >
              <Copy size={16} />
              复制订单号
            </button>
          </div>
          {paymentStatus?.orderNo === orderState.orderNo ? (
            <div className="mt-3 flex items-center gap-2 rounded bg-white px-3 py-2 text-sm text-ink">
              {paymentStatus.status === "paid" || paymentStatus.status === "fulfilled" ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              )}
              <span>{paymentStatus.message}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {orderState.status === "error" ? (
        <div className="mt-4 rounded border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          {orderState.message}
        </div>
      ) : null}

      <form action={claimAction} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">订单号</span>
          <input
            key={orderNo}
            name="orderNo"
            defaultValue={orderNo}
            placeholder="请输入付款订单号"
            className="h-11 w-full rounded border border-line px-3 outline-none focus:border-brand"
          />
        </label>
        <button
          disabled={isClaiming}
          className="flex h-12 w-full items-center justify-center gap-2 rounded bg-ink font-medium text-white disabled:bg-zinc-300"
        >
          <KeyRound size={18} />
          {isClaiming ? "正在核验订单..." : "核验支付并领取卡密"}
        </button>
      </form>

      {claimState.status !== "idle" ? (
        <div
          className={`mt-4 rounded border px-4 py-3 text-sm ${
            claimState.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-orange-200 bg-orange-50 text-orange-800"
          }`}
        >
          <p>{claimState.message}</p>
          {claimState.code ? (
            <div className="mt-3 flex flex-col gap-3 rounded bg-white p-3 text-ink sm:flex-row sm:items-center sm:justify-between">
              <code className="break-all text-base font-semibold">{claimState.code}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(claimState.code ?? "")}
                className="inline-flex h-9 items-center justify-center gap-2 rounded border border-line px-3 text-sm"
              >
                <Copy size={16} />
                复制
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
