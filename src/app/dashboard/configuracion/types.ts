import type { UserRole, SubscriptionStatus } from '@prisma/client';

export interface SerializedUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  locale: string;
  dateFormat: string;
  darkMode: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  dailySummary: boolean;
}

export interface SerializedTenantConfig {
  id: string;
  name: string;
  legalName: string | null;
  cuit: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  subscriptionStatus: SubscriptionStatus;
  planInterval: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SerializedModuleSetting {
  module: string;
  enabled: boolean;
  isOptional: boolean; // Calculado en el servidor
}
