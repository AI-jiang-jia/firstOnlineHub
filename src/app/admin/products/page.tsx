import Image from "next/image";
import { getCategories, getProducts } from "@/lib/data";
import { upsertProduct } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (supabase) await requireAdmin();

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ includeInactive: true })
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <form action={upsertProduct} className="h-fit rounded bg-white p-6">
        <h2 className="text-lg font-semibold">新增商品</h2>
        {params.message ? <p className="mt-3 rounded bg-orange-50 px-3 py-2 text-sm text-brand">{params.message}</p> : null}
        <label className="mt-4 block"><span className="mb-2 block text-sm">名称</span><input name="name" required className="h-10 w-full rounded border border-line px-3" /></label>
        <label className="mt-3 block"><span className="mb-2 block text-sm">Slug</span><input name="slug" required placeholder="linen-shirt" className="h-10 w-full rounded border border-line px-3" /></label>
        <label className="mt-3 block"><span className="mb-2 block text-sm">分类</span><select name="categoryId" className="h-10 w-full rounded border border-line px-3">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="mt-3 block"><span className="mb-2 block text-sm">描述</span><textarea name="description" rows={3} className="w-full rounded border border-line px-3 py-2" /></label>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <label><span className="mb-2 block text-sm">价格</span><input name="price" type="number" required className="h-10 w-full rounded border border-line px-3" /></label>
          <label><span className="mb-2 block text-sm">原价</span><input name="originalPrice" type="number" className="h-10 w-full rounded border border-line px-3" /></label>
          <label><span className="mb-2 block text-sm">库存</span><input name="stock" type="number" required className="h-10 w-full rounded border border-line px-3" /></label>
        </div>
        <label className="mt-3 block"><span className="mb-2 block text-sm">尺码，逗号分隔</span><input name="sizes" defaultValue="S,M,L,XL" className="h-10 w-full rounded border border-line px-3" /></label>
        <label className="mt-3 block"><span className="mb-2 block text-sm">颜色，逗号分隔</span><input name="colors" defaultValue="黑色,白色" className="h-10 w-full rounded border border-line px-3" /></label>
        <label className="mt-3 block"><span className="mb-2 block text-sm">图片 URL</span><input name="imageUrl" required className="h-10 w-full rounded border border-line px-3" /></label>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> 上架</label>
        <button className="mt-5 h-10 w-full rounded bg-brand font-medium text-white">保存商品</button>
      </form>

      <section className="rounded bg-white p-4">
        <div className="grid gap-3">
          {products.map((product) => (
            <div key={product.id} className="grid gap-4 rounded border border-line p-3 sm:grid-cols-[72px_1fr_auto]">
              <div className="relative aspect-square overflow-hidden rounded bg-zinc-100">
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="mt-1 text-sm text-muted">{product.categories?.name} / 库存 {product.stock}</p>
                <p className="mt-2 text-sm text-muted line-clamp-1">{product.description}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand">¥{product.price}</p>
                <p className="mt-1 text-sm text-muted">{product.is_active ? "已上架" : "已下架"}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
