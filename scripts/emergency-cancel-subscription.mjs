#!/usr/bin/env node
/**
 * Script de emergencia para cancelar una suscripción huérfana en Mercado Pago
 * 
 * Uso:
 *   node scripts/emergency-cancel-subscription.mjs PREAPPROVAL_ID
 * 
 * Ejemplo:
 *   node scripts/emergency-cancel-subscription.mjs 2c938084906e1a5f01907e8e8e3f00a8
 */

import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ ERROR: MP_ACCESS_TOKEN no está configurado en el .env');
  process.exit(1);
}

const preapprovalId = process.argv[2];

if (!preapprovalId) {
  console.error('❌ ERROR: Falta el ID del preapproval');
  console.log('\nUso: node scripts/emergency-cancel-subscription.mjs PREAPPROVAL_ID');
  process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken });
const mpPreApproval = new PreApproval(client);

console.log(`🔍 Verificando suscripción ${preapprovalId}...`);

try {
  // 1. Verificar estado actual
  const preapproval = await mpPreApproval.get({ id: preapprovalId });
  
  console.log(`\n📊 Estado actual:`);
  console.log(`   ID: ${preapproval.id}`);
  console.log(`   Status: ${preapproval.status}`);
  console.log(`   Reason: ${preapproval.reason}`);
  console.log(`   Payer email: ${preapproval.payer_email}`);

  if (preapproval.status === 'cancelled') {
    console.log('\n✅ La suscripción ya está cancelada. No se requiere acción.');
    process.exit(0);
  }

  // 2. Cancelar
  console.log(`\n⚠️  Cancelando suscripción activa...`);
  
  await mpPreApproval.update({
    id: preapprovalId,
    body: { status: 'cancelled' },
  });

  console.log('✅ Suscripción cancelada exitosamente en Mercado Pago.');
  console.log('\n💡 Verificá en el panel de MP que el estado cambió a "Cancelada".');
  
} catch (error) {
  console.error('\n❌ ERROR al cancelar la suscripción:', error.message);
  if (error.cause) {
    console.error('Detalles:', JSON.stringify(error.cause, null, 2));
  }
  process.exit(1);
}
