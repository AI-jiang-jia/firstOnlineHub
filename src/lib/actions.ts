"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth";
import { amountMatches, createAlipayPrecreateOrder, queryAlipayOrder } from "@/lib/alipay";
import { AI_PRODUCTS_BASE } from "@/lib/data";
import { saveRegistrationForm } from "@/lib/postgres";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export type ClaimGeminiCardState = {
  status: "idle" | "success" | "sold_out" | "error";
  code?: string;
  message?: string;
};

export type PaymentPanelState = {
  status: "idle" | "order_created" | "success" | "not_paid" | "sold_out" | "error";
  orderNo?: string;
  qrCodeDataUrl?: string;
  code?: string;
  message?: string;
};

export type PaymentOrderStatusState = {
  status: "pending" | "paid" | "fulfilled" | "cancelled" | "not_found" | "error";
  message?: string;
};

function createOrderNo() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  return `ZX${date}${randomBytes(4).toString("hex").toUpperCase()}`;
}

function findAiProduct(slug: string) {
  return AI_PRODUCTS_BASE.find((product) => product.slug === slug);
}

const PAID_ALIPAY_TRADE_STATUSES = new Set(["TRADE_SUCCESS", "TRADE_FINISHED"]);

async function syncPaidStatusFromAlipay(orderNo: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { status: "error" as const, message: "请先配置 SUPABASE_SERVICE_ROLE_KEY。" };
  }

  const { data: order, error } = await admin
    .from("payment_orders")
    .select("order_no, amount, status")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (error) {
    return { status: "error" as const, message: error.message };
  }

  if (!order) {
    return { status: "not_found" as const, message: "没有找到该订单。" };
  }

  if (order.status !== "pending") {
    return { status: order.status as PaymentOrderStatusState["status"] };
  }

  try {
    const alipayOrder = await queryAlipayOrder(orderNo);
    if (alipayOrder.code !== "10000") {
      return { status: "pending" as const, message: "等待支付宝支付确认。" };
    }

    if (
      PAID_ALIPAY_TRADE_STATUSES.has(alipayOrder.tradeStatus) &&
      amountMatches(Number(order.amount), alipayOrder.totalAmount)
    ) {
      const { error: updateError } = await admin
        .from("payment_orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          alipay_trade_no: alipayOrder.tradeNo,
          alipay_notify_payload: {
            source: "alipay.trade.query",
            trade_status: alipayOrder.tradeStatus,
            total_amount: alipayOrder.totalAmount,
            out_trade_no: alipayOrder.outTradeNo,
            trade_no: alipayOrder.tradeNo
          }
        })
        .eq("order_no", orderNo)
        .eq("status", "pending");

      if (updateError) {
        return { status: "error" as const, message: updateError.message };
      }

      return { status: "paid" as const };
    }

    return { status: "pending" as const, message: "等待支付宝支付确认。" };
  } catch {
    return { status: "pending" as const, message: "等待支付宝支付确认。" };
  }
}

export async function createPaymentOrder(
  _previousState: PaymentPanelState,
  formData: FormData
): Promise<PaymentPanelState> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { status: "error", message: "请先配置 SUPABASE_SERVICE_ROLE_KEY。" };
  }

  const productSlug = formString(formData, "productSlug");
  const product = findAiProduct(productSlug);
  if (!product) {
    return { status: "error", message: "商品不存在。" };
  }

  const orderNo = createOrderNo();
  const { error } = await admin.from("payment_orders").insert({
    order_no: orderNo,
    product_slug: product.slug,
    product_name: product.name,
    amount: product.price,
    status: "pending"
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  try {
    const alipayOrder = await createAlipayPrecreateOrder({
      orderNo,
      amount: Number(product.price),
      subject: product.name
    });

    const { error: updateError } = await admin
      .from("payment_orders")
      .update({
        alipay_trade_no: alipayOrder.alipayTradeNo,
        alipay_qr_code: alipayOrder.qrCode
      })
      .eq("order_no", orderNo);

    if (updateError) {
      return { status: "error", orderNo, message: updateError.message };
    }

    return {
      status: "order_created",
      orderNo,
      qrCodeDataUrl: alipayOrder.qrCodeDataUrl,
      message: "订单已生成。请使用支付宝扫码付款，支付成功后系统会自动确认。"
    };
  } catch (alipayError) {
    await admin.from("payment_orders").update({ status: "cancelled" }).eq("order_no", orderNo);

    return {
      status: "error",
      orderNo,
      message: alipayError instanceof Error ? alipayError.message : "支付宝预下单失败。"
    };
  }
}

export async function checkPaymentOrderStatus(orderNo: string): Promise<PaymentOrderStatusState> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { status: "error", message: "请先配置 SUPABASE_SERVICE_ROLE_KEY。" };
  }

  const normalizedOrderNo = orderNo.trim().toUpperCase();
  if (!normalizedOrderNo) {
    return { status: "error", message: "请输入订单号。" };
  }

  const { data, error } = await admin
    .from("payment_orders")
    .select("status")
    .eq("order_no", normalizedOrderNo)
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!data) {
    return { status: "not_found", message: "没有找到该订单。" };
  }

  if (data.status === "paid") {
    return { status: "paid", message: "支付宝已确认收款，可以领取卡密。" };
  }

  if (data.status === "fulfilled") {
    return { status: "fulfilled", message: "该订单已发卡，可再次核验查看卡密。" };
  }

  if (data.status === "cancelled") {
    return { status: "cancelled", message: "该订单已取消，请重新生成付款订单。" };
  }

  const syncedStatus = await syncPaidStatusFromAlipay(normalizedOrderNo);
  if (syncedStatus.status === "paid") {
    return { status: "paid", message: "支付宝已确认收款，可以领取卡密。" };
  }

  if (syncedStatus.status === "error") {
    return { status: "error", message: syncedStatus.message };
  }

  return { status: "pending", message: syncedStatus.message || "等待支付宝支付确认。" };
}

export async function claimPaidOrderCard(
  _previousState: PaymentPanelState,
  formData: FormData
): Promise<PaymentPanelState> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { status: "error", message: "请先配置 SUPABASE_SERVICE_ROLE_KEY。" };
  }

  const orderNo = formString(formData, "orderNo").toUpperCase();
  if (!orderNo) {
    return { status: "not_paid", message: "请先购买并完成支付后再领取卡密。" };
  }

  await syncPaidStatusFromAlipay(orderNo);

  const { data, error } = await admin.rpc("fulfill_paid_membership_order", {
    p_order_no: orderNo
  });

  if (error) {
    return { status: "error", orderNo, message: error.message };
  }

  const result = Array.isArray(data) ? data[0] : null;
  if (result?.result === "success" || result?.result === "already_fulfilled") {
    revalidatePath("/");
    revalidatePath("/products");
    return {
      status: "success",
      orderNo,
      code: result.code,
      message: result.result === "already_fulfilled" ? "该订单已发卡，卡密如下。" : "支付已确认，卡密领取成功。"
    };
  }

  if (result?.result === "not_paid") {
    return {
      status: "not_paid",
      orderNo,
      message: "订单暂未确认支付成功，不能领取卡密。请完成支付宝付款后稍候再试。"
    };
  }

  if (result?.result === "sold_out") {
    return { status: "sold_out", orderNo, message: "卡密暂时售罄，请联系商家处理。" };
  }

  return { status: "error", orderNo, message: "没有找到该订单，请检查订单号。" };
}

export async function claimGeminiCard(
  _previousState: ClaimGeminiCardState,
  formData: FormData
): Promise<ClaimGeminiCardState> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      status: "error",
      message: "请先配置 SUPABASE_SERVICE_ROLE_KEY 后再领取卡密。"
    };
  }

  const productSlug = formString(formData, "productSlug") || "gemini-pro-12-months";
  const { data, error } = await admin.rpc("claim_membership_card", {
    p_product_slug: productSlug
  });
  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  const claimed = Array.isArray(data) ? data[0] : null;
  if (!claimed?.code) {
    return {
      status: "sold_out",
      message: "卡密暂时售罄，请联系商家补货。"
    };
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${productSlug}`);

  return {
    status: "success",
    code: claimed.code,
    message: "领取成功，请妥善保存卡密。"
  };
}

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/register?message=请先配置 Supabase 环境变量");

  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const fullName = formString(formData, "fullName");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) redirect(`/auth/register?message=${encodeURIComponent(error.message)}`);
  if (!data.user?.id) redirect("/auth/register?message=注册成功但没有返回用户ID");

  try {
    await saveRegistrationForm({
      authUserId: data.user.id,
      email,
      fullName,
      source: "web_register_form"
    });
  } catch (registrationError) {
    const message =
      registrationError instanceof Error ? registrationError.message : "注册表写入失败";
    redirect(`/auth/register?message=${encodeURIComponent(message)}`);
  }

  redirect("/auth/login?message=注册成功，请登录");
}

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login?message=请先配置 Supabase 环境变量");

  const email = formString(formData, "email");
  const password = formString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth/login?message=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function addToCart(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login?message=请配置 Supabase 后使用购物车");

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login?message=请先登录");

  const productId = formString(formData, "productId");
  const size = formString(formData, "size");
  const color = formString(formData, "color");
  const quantity = Number(formData.get("quantity") ?? 1);
  const redirectTo = formString(formData, "redirectTo") || "/cart";

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", data.user.id)
    .eq("product_id", productId)
    .eq("size", size)
    .eq("color", color)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({
      user_id: data.user.id,
      product_id: productId,
      quantity,
      size,
      color
    });
  }

  revalidatePath("/cart");
  redirect(redirectTo);
}

export async function updateCartItem(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const id = formString(formData, "id");
  const quantity = Number(formData.get("quantity") ?? 1);

  if (quantity <= 0) {
    await supabase?.from("cart_items").delete().eq("id", id);
  } else {
    await supabase?.from("cart_items").update({ quantity }).eq("id", id);
  }

  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  await supabase?.from("cart_items").delete().eq("id", formString(formData, "id"));
  revalidatePath("/cart");
}

export async function createOrder(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/checkout?message=请先配置 Supabase");
  const admin = createSupabaseAdminClient();
  const writeClient = admin ?? supabase;

  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login?message=请先登录");

  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", data.user.id);

  if (error || !cartItems?.length) redirect("/cart?message=购物车为空");

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.products.price) * Number(item.quantity),
    0
  );

  const { data: order, error: orderError } = await writeClient
    .from("orders")
    .insert({
      user_id: data.user.id,
      status: "pending_payment",
      total_amount: total,
      recipient_name: formString(formData, "recipientName"),
      phone: formString(formData, "phone"),
      address: formString(formData, "address")
    })
    .select()
    .single();

  if (orderError || !order) redirect(`/checkout?message=${encodeURIComponent(orderError?.message ?? "创建订单失败")}`);

  await writeClient.from("order_items").insert(
    cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.products.price,
      size: item.size,
      color: item.color,
      product_snapshot: {
        name: item.products.name,
        image_url: item.products.image_url
      }
    }))
  );

  await writeClient.from("cart_items").delete().eq("user_id", data.user.id);
  revalidatePath("/orders");
  redirect(`/checkout?order=${order.id}`);
}

export async function mockPayOrder(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const client = admin ?? supabase;
  if (!client) redirect("/orders");

  const orderId = formString(formData, "orderId");
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!auth.user) redirect("/auth/login?message=请先登录");

  const { data: ownedOrder } = await client
    .from("orders")
    .select("id, user_id")
    .eq("id", orderId)
    .single();

  if (!ownedOrder || ownedOrder.user_id !== auth.user.id) {
    redirect("/orders");
  }

  const { data: items } = await client
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    if (item.product_id) {
      const { data: product } = await client
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();
      await client
        .from("products")
        .update({ stock: Math.max(0, Number(product?.stock ?? 0) - Number(item.quantity)) })
        .eq("id", item.product_id);
    }
  }

  await client.from("orders").update({ status: "paid_mock" }).eq("id", orderId);
  revalidatePath("/orders");
  redirect("/orders");
}

export async function upsertProduct(formData: FormData) {
  const role = await getCurrentUserRole();
  if (role !== "admin") redirect("/auth/login?message=需要管理员账号");

  const admin = createSupabaseAdminClient();
  if (!admin) redirect("/admin/products?message=请配置 SUPABASE_SERVICE_ROLE_KEY");

  const id = formString(formData, "id");
  const payload = {
    category_id: formString(formData, "categoryId") || null,
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    description: formString(formData, "description"),
    price: Number(formData.get("price") ?? 0),
    original_price: Number(formData.get("originalPrice") || 0) || null,
    stock: Number(formData.get("stock") ?? 0),
    sizes: formString(formData, "sizes").split(",").map((item) => item.trim()).filter(Boolean),
    colors: formString(formData, "colors").split(",").map((item) => item.trim()).filter(Boolean),
    image_url: formString(formData, "imageUrl"),
    is_active: formData.get("isActive") === "on"
  };

  if (id) {
    await admin.from("products").update(payload).eq("id", id);
  } else {
    await admin.from("products").insert(payload);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateOrderStatus(formData: FormData) {
  const role = await getCurrentUserRole();
  if (role !== "admin") redirect("/auth/login?message=需要管理员账号");

  const admin = createSupabaseAdminClient();
  if (!admin) redirect("/admin/orders?message=请配置 SUPABASE_SERVICE_ROLE_KEY");

  await admin
    .from("orders")
    .update({ status: formString(formData, "status") })
    .eq("id", formString(formData, "id"));

  revalidatePath("/admin/orders");
}
