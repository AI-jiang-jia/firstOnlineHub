import Link from "next/link";
import { signUp } from "@/lib/actions";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container-shell flex min-h-[calc(100vh-64px)] items-center justify-center py-10">
      <form action={signUp} className="w-full max-w-md rounded bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-semibold">注册账号</h1>
        <p className="mt-2 text-sm text-muted">创建你的织选商城账号。</p>
        {params.message ? (
          <p className="mt-4 rounded bg-orange-50 px-4 py-3 text-sm text-brand">{params.message}</p>
        ) : null}
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium">姓名</span>
          <input name="fullName" required className="h-11 w-full rounded border border-line px-3 outline-brand" />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">邮箱</span>
          <input name="email" type="email" required className="h-11 w-full rounded border border-line px-3 outline-brand" />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">密码</span>
          <input name="password" type="password" minLength={6} required className="h-11 w-full rounded border border-line px-3 outline-brand" />
        </label>
        <button className="mt-6 h-11 w-full rounded bg-brand font-medium text-white">注册</button>
        <p className="mt-5 text-center text-sm text-muted">
          已有账号？<Link href="/auth/login" className="text-brand">去登录</Link>
        </p>
      </form>
    </main>
  );
}
