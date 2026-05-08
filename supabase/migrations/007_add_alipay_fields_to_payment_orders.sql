alter table public.payment_orders
  add column if not exists alipay_trade_no text,
  add column if not exists alipay_qr_code text,
  add column if not exists alipay_notify_payload jsonb;

create index if not exists payment_orders_alipay_trade_no_idx
  on public.payment_orders (alipay_trade_no);
