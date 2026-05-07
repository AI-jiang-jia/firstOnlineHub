import Link from "next/link";
import { signIn } from "@/lib/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container-shell flex min-h-[calc(100vh-64px)] items-center justify-center py-10">
      <form action={signIn} className="w-full max-w-md rounded bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold">登录账号</h1>
        <p className="mt-2 text-sm text-muted">登录后可以加入购物车、下单和查看订单。</p>
        {params.message ? (
          <p className="mt-4 rounded bg-orange-50 px-4 py-3 text-sm text-brand">{params.message}</p>
        ) : null}
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium">邮箱</span>
          <input name="email" type="email" required className="h-11 w-full rounded border border-line px-3 outline-brand" />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">密码</span>
          <input name="password" type="password" required className="h-11 w-full rounded border border-line px-3 outline-brand" />
        </label>
        <button className="mt-6 h-11 w-full rounded bg-brand font-medium text-white">登录</button>
        <p className="mt-5 text-center text-sm text-muted">
          没有账号？<Link href="/auth/register" className="text-brand">去注册</Link>
        </p>
      </form>
    </main>
  );
}
