import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container-shell py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-brand">商家后台</p>
          <h1 className="mt-2 text-3xl font-semibold">运营管理</h1>
        </div>
        <nav className="flex gap-3 overflow-x-auto">
          <Link href="/admin/products" className="rounded border border-line bg-white px-4 py-2 text-sm">商品管理</Link>
          <Link href="/admin/orders" className="rounded border border-line bg-white px-4 py-2 text-sm">订单管理</Link>
          <Link href="/admin/categories" className="rounded border border-line bg-white px-4 py-2 text-sm">分类说明</Link>
        </nav>
      </div>
      {children}
    </main>
  );
}
