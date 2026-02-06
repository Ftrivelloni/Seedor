'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/auth/auth';

const ALLOWED_TEMPLATES = new Set(['balanced', 'operations', 'analytics']);

export async function updateDashboardPreferenceAction(formData: FormData) {
  const session = await requireAuthSession();

  const templateKey = String(formData.get('templateKey') || 'balanced');
  const widgets = formData
    .getAll('widgets')
    .map((entry) => String(entry))
    .filter(Boolean);

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
