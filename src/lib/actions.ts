"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth";
import { saveRegistrationForm } from "@/lib/postgres";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
