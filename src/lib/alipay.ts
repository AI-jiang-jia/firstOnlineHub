import { AlipaySdk } from "alipay-sdk";
import QRCode from "qrcode";

type AlipayPrecreateResponse = {
  outTradeNo?: string;
  out_trade_no?: string;
  qrCode?: string;
  qr_code?: string;
  tradeNo?: string;
  trade_no?: string;
  code?: string;
  msg?: string;
  subCode?: string;
  sub_code?: string;
  subMsg?: string;
  sub_msg?: string;
};

export type AlipayNotifyPayload = Record<string, string>;

function envString(name: string) {
  return process.env[name]?.trim() ?? "";
}

function normalizePem(value: string) {
  return value.replace(/\\n/g, "\n");
}

function getSiteUrl() {
  const siteUrl = envString("NEXT_PUBLIC_SITE_URL");
  if (!siteUrl) {
    throw new Error("请配置 NEXT_PUBLIC_SITE_URL，用于支付宝异步通知地址。");
  }
  return siteUrl.replace(/\/+$/, "");
}

export function getAlipayNotifyUrl() {
  return `${getSiteUrl()}/api/alipay/notify`;
}

export function getAlipayClient() {
  const appId = envString("ALIPAY_APP_ID");
  const privateKey = envString("ALIPAY_PRIVATE_KEY");
  const alipayPublicKey = envString("ALIPAY_PUBLIC_KEY");

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error("请配置 ALIPAY_APP_ID、ALIPAY_PRIVATE_KEY 和 ALIPAY_PUBLIC_KEY。");
  }

  return new AlipaySdk({
    appId,
    privateKey: normalizePem(privateKey),
    alipayPublicKey: normalizePem(alipayPublicKey),
    gateway: envString("ALIPAY_GATEWAY_URL") || "https://openapi.alipay.com/gateway.do",
    signType: "RSA2",
    camelcase: true
  });
}

export function getAlipayAppId() {
  return envString("ALIPAY_APP_ID");
}

export function formatAlipayAmount(amount: number) {
  return amount.toFixed(2);
}

export function amountMatches(expectedAmount: number, actualAmount: string) {
  return Math.round(expectedAmount * 100) === Math.round(Number(actualAmount) * 100);
}

export async function createAlipayPrecreateOrder({
  orderNo,
  amount,
  subject
}: {
  orderNo: string;
  amount: number;
  subject: string;
}) {
  const alipay = getAlipayClient();
  const totalAmount = formatAlipayAmount(amount);

  const result = (await alipay.exec("alipay.trade.precreate", {
    notify_url: getAlipayNotifyUrl(),
    bizContent: {
      out_trade_no: orderNo,
      total_amount: totalAmount,
      subject,
      product_code: "FACE_TO_FACE_PAYMENT"
    }
  })) as AlipayPrecreateResponse;

  const qrCode = result.qrCode || result.qr_code;
  const alipayTradeNo = result.tradeNo || result.trade_no || null;

  if (result.code !== "10000" || !qrCode) {
    const message = result.subMsg || result.sub_msg || result.msg || "支付宝预下单失败。";
    throw new Error(message);
  }

  return {
    qrCode,
    qrCodeDataUrl: await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 260
    }),
    alipayTradeNo
  };
}

export function verifyAlipayNotify(payload: AlipayNotifyPayload) {
  return getAlipayClient().checkNotifySignV2(payload);
}
