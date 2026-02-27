import type { ModuleKey, SubscriptionStatus, PlanInterval, UserRole } from '@prisma/client';

// ── User data for "Mi Cuenta" ──
export interface SerializedUser {
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

// ── Tenant data for "Empresa" y "Suscripción" ──
export interface SerializedTenant {
  id: string;
  name: string;
  slug: string;
  cuit: string | null;
  legalName: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  subscriptionStatus: SubscriptionStatus;
  planInterval: PlanInterval;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  // Stripe subscription info (legacy)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// ── Module setting for "Módulos" ──
export interface SerializedModuleSetting {
  id: string;
  module: ModuleKey;
  enabled: boolean;
}

// ── Subscription pricing breakdown ──
export interface SubscriptionPricingInfo {
  basePriceUsd: number;
  modulePriceUsd: number;
  enabledModuleCount: number;
  enabledModules: ModuleKey[];
  modulesTotalUsd: number;
  totalUsd: number;
}

// ── Props passed from server page to client ──
export interface ConfiguracionPageProps {
  user: SerializedUser;
  tenant: SerializedTenant;
  moduleSettings: SerializedModuleSetting[];
  pricing: SubscriptionPricingInfo;
  isAdmin: boolean;
}

// ── Tab keys ──
export type ConfigTab = 'mi-cuenta' | 'empresa' | 'suscripcion';
