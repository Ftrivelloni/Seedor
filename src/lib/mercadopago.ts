import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.warn(
    '⚠️  MP_ACCESS_TOKEN no está configurado. Las funciones de Mercado Pago no van a funcionar.'
  );
}

/**
 * Singleton MercadoPago client configured with the server-side Access Token.
 */
export const mpClient = new MercadoPagoConfig({
  accessToken: accessToken || 'MISSING_TOKEN',
});

/**
 * Pre-configured API instances for Mercado Pago resources.
 */
export const mpPreApprovalPlan = new PreApprovalPlan(mpClient);
export const mpPreApproval = new PreApproval(mpClient);
