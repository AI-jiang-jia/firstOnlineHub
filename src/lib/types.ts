export type UserRole = "customer" | "admin";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  image_url: string;
  is_active: boolean;
  created_at: string;
  categories?: Category | null;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  products: Product | null;
};

export type OrderStatus =
  | "pending_payment"
  | "paid_mock"
  | "shipped"
  | "completed"
  | "cancelled";

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  recipient_name: string;
  phone: string;
  address: string;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
  product_snapshot: {
    name: string;
    image_url: string;
  };
};
