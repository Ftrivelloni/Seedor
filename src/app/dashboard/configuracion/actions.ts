'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuthSession, requireRole } from '@/lib/auth/auth';

/**
 * Actualiza la información personal del usuario
 */
export async function updateUserProfileAction(formData: FormData) {
  const session = await requireAuthSession();

  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const phone = String(formData.get('phone') || '').trim();

  // Validaciones
  if (!firstName || !lastName) {
    throw new Error('El nombre y apellido son obligatorios.');
  }
  if (firstName.length > 100 || lastName.length > 100) {
    throw new Error('El nombre y apellido no pueden superar los 100 caracteres.');
  }
  if (phone && phone.length > 50) {
    throw new Error('El teléfono no puede superar los 50 caracteres.');
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      firstName,
      lastName,
      phone: phone || '',
    },
  });

  revalidatePath('/dashboard/configuracion');
}

/**
 * Actualiza las preferencias generales del usuario
 */
export async function updateUserPreferencesAction(formData: FormData) {
  const session = await requireAuthSession();

  const locale = String(formData.get('locale') || 'es-AR');
  const dateFormat = String(formData.get('dateFormat') || 'DD/MM/YYYY');
  const darkMode = formData.get('darkMode') === 'true';
  const emailNotifications = formData.get('emailNotifications') === 'true';
  const whatsappNotifications = formData.get('whatsappNotifications') === 'true';
  const dailySummary = formData.get('dailySummary') === 'true';

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      locale,
      dateFormat,
      darkMode,
      emailNotifications,
      whatsappNotifications,
      dailySummary,
    },
  });

  revalidatePath('/dashboard/configuracion');
}

/**
 * Actualiza los datos de la empresa (tenant)
 */
export async function updateCompanyDataAction(formData: FormData) {
  const session = await requireRole(['ADMIN']);

  const legalName = String(formData.get('legalName') || '').trim();
  const cuit = String(formData.get('cuit') || '').trim();
  const companyPhone = String(formData.get('companyPhone') || '').trim();
  const companyAddress = String(formData.get('companyAddress') || '').trim();

  // Validaciones
  if (legalName && legalName.length > 200) {
    throw new Error('El nombre legal no puede superar los 200 caracteres.');
  }
  if (cuit && cuit.length > 20) {
    throw new Error('El CUIT no puede superar los 20 caracteres.');
  }
  if (companyPhone && companyPhone.length > 50) {
    throw new Error('El teléfono no puede superar los 50 caracteres.');
  }
  if (companyAddress && companyAddress.length > 500) {
    throw new Error('La dirección no puede superar los 500 caracteres.');
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      legalName: legalName || null,
      cuit: cuit || null,
      companyPhone: companyPhone || null,
      companyAddress: companyAddress || null,
    },
  });

  revalidatePath('/dashboard/configuracion');
}
