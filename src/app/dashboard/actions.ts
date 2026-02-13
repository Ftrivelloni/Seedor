'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';

const ALLOWED_TEMPLATES = new Set([
  'balanced',
  'panel-left',
  'panel-right',
  'sidebar-left',
  'sidebar-right',
]);

export async function updateDashboardPreferenceAction(formData: FormData) {
  const session = await requireAuthSession();

  const templateKey = String(formData.get('templateKey') || 'balanced');
  const widgetsRaw = String(formData.get('widgetsJson') || '[]');

  let widgets: string[];
  try {
    widgets = JSON.parse(widgetsRaw);
    if (!Array.isArray(widgets)) widgets = [];
  } catch {
    widgets = [];
  }

  await prisma.dashboardPreference.upsert({
    where: {
      tenantId_userId: {
        tenantId: session.tenantId,
        userId: session.userId,
      },
    },
    create: {
      tenantId: session.tenantId,
      userId: session.userId,
      templateKey: ALLOWED_TEMPLATES.has(templateKey) ? templateKey : 'balanced',
      widgetsJson: JSON.stringify(widgets),
    },
    update: {
      templateKey: ALLOWED_TEMPLATES.has(templateKey) ? templateKey : 'balanced',
      widgetsJson: JSON.stringify(widgets),
    },
  });

  revalidatePath('/dashboard');
}

/**
 * Lightweight action to persist just the widget order (used on drag-end).
 */
export async function updateWidgetOrderAction(formData: FormData) {
  const session = await requireAuthSession();

  const widgetsRaw = String(formData.get('widgetsJson') || '[]');

  let widgets: string[];
  try {
    widgets = JSON.parse(widgetsRaw);
    if (!Array.isArray(widgets)) widgets = [];
  } catch {
    widgets = [];
  }

  await prisma.dashboardPreference.upsert({
    where: {
      tenantId_userId: {
        tenantId: session.tenantId,
        userId: session.userId,
      },
    },
    create: {
      tenantId: session.tenantId,
      userId: session.userId,
      templateKey: 'balanced',
      widgetsJson: JSON.stringify(widgets),
    },
    update: {
      widgetsJson: JSON.stringify(widgets),
    },
  });

  revalidatePath('/dashboard');
}
