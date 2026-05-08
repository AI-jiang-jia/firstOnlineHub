import Link from "next/link";

export function StoppedPage({ title }: { title: string }) {
  return (
    <main className="container-shell py-12">
      <section className="mx-auto max-w-xl rounded bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-medium text-brand">AI 商城已启用</p>
        <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted">当前站点已切换为免登录自助发卡模式，此功能暂不开放。</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded bg-brand px-6 text-sm font-medium text-white">
          返回首页
        </Link>
      </section>
    </main>
  );
}
