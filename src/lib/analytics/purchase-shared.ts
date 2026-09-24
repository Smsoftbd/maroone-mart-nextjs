/**
 * Gateways that redirect off-site for payment. Their Purchase is deferred
 * until the gateway confirms payment, so unpaid orders never count.
 */
export const ONLINE_PAYMENT_GATEWAYS = ["sslcommerz", "bkash"];

export const isOnlinePaymentGateway = (code: string | null | undefined) =>
  !!code && ONLINE_PAYMENT_GATEWAYS.includes(code);
