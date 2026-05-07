import type { Category, Product } from "@/lib/types";

export const demoCategories: Category[] = [
  { id: "cat-1", name: "女士精选", slug: "women", description: "通勤、针织与轻外套" },
  { id: "cat-2", name: "男士日常", slug: "men", description: "衬衫、夹克与基础款" },
  { id: "cat-3", name: "运动休闲", slug: "sport", description: "卫衣、运动裤和舒适套装" },
  { id: "cat-4", name: "鞋包配饰", slug: "accessories", description: "鞋履、包袋与搭配单品" }
];

export const demoProducts: Product[] = [
  {
    id: "p-1",
    category_id: "cat-3",
    name: "亮黄色连帽运动套装",
    slug: "cloud-wool-cardigan",
    description: "高饱和亮黄色卫衣与束脚裤套装，适合运动休闲和街头穿搭。",
    price: 399,
    original_price: 499,
    stock: 36,
    sizes: ["S", "M", "L"],
    colors: ["亮黄色", "奶油白", "黑色"],
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
    categories: demoCategories[2]
  },
  {
    id: "p-2",
    category_id: "cat-1",
    name: "法式碎花度假连衣裙",
    slug: "light-utility-jacket",
    description: "轻盈飘逸的碎花连衣裙，适合旅行、海边和春夏约会场景。",
    price: 459,
    original_price: 599,
    stock: 28,
    sizes: ["S", "M", "L", "XL"],
    colors: ["米白碎花", "浅蓝碎花"],
    image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
    categories: demoCategories[0]
  },
  {
    id: "p-3",
    category_id: "cat-2",
    name: "纯棉印花短袖T恤",
    slug: "air-hoodie",
    description: "柔软亲肤纯棉面料，宽松版型，日常内搭或单穿都清爽。",
    price: 269,
    original_price: 329,
    stock: 52,
    sizes: ["S", "M", "L", "XL"],
    colors: ["白色", "灰色", "黑色"],
    image_url: "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
    categories: demoCategories[1]
  },
  {
    id: "p-4",
    category_id: "cat-4",
    name: "轻量透气跑步鞋",
    slug: "daily-tote",
    description: "织物鞋面轻盈透气，缓震鞋底适合日常慢跑和通勤步行。",
    price: 199,
    original_price: 259,
    stock: 44,
    sizes: ["39", "40", "41", "42", "43"],
    colors: ["红色", "黑色"],
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
    categories: demoCategories[3]
  }
];
