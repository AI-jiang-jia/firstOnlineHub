import { BrainCircuit, WandSparkles, Workflow } from "lucide-react";

const products = [
  { name: "AI 写作会员", icon: WandSparkles },
  { name: "AI 绘图订阅", icon: BrainCircuit },
  { name: "效率工具套餐", icon: Workflow }
];

export function DevelopmentProducts() {
  return (
    <section className="container-shell py-12">
      <div className="mb-5">
        <p className="text-sm font-medium text-brand">即将上线</p>
        <h2 className="mt-2 text-2xl font-semibold">更多商品正在开发中</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => {
          const Icon = product.icon;
          return (
            <article key={product.name} className="rounded border border-dashed border-line bg-white p-5 text-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-100">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 font-medium text-ink">{product.name}</h3>
              <p className="mt-2 text-sm leading-6">商品配置、库存和自动发卡能力预留中。</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
