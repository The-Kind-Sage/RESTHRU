"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Generic platform-settings key/value helpers (PlatformSetting table). Used
// to persist superadmin-panel toggles that previously lived only in client
// state and reset on reload (Health alert channels, Settings security/API
// config) — see TASKS.md Part C1/C2.

async function requireAdmin() {
  const session = await getSession();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return null;
  }
  return session;
}

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

async function setSetting(key: string, value: unknown) {
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value: value as any },
    update: { value: value as any },
  });
}

// === Health — alert channels ===

export type AlertChannels = { email: boolean; sms: boolean; slack: boolean };
const ALERT_CHANNELS_KEY = "health_alert_channels";
const DEFAULT_ALERT_CHANNELS: AlertChannels = { email: true, sms: true, slack: false };

export async function getHealthAlertChannels(): Promise<{ data?: AlertChannels; error?: string }> {
  try {
    const data = await getSetting<AlertChannels>(ALERT_CHANNELS_KEY, DEFAULT_ALERT_CHANNELS);
    return { data };
  } catch (err: any) {
    return { error: err?.message || "Failed to load alert channels" };
  }
}

export async function updateHealthAlertChannel(channel: keyof AlertChannels, enabled: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized" };

  try {
    const current = await getSetting<AlertChannels>(ALERT_CHANNELS_KEY, DEFAULT_ALERT_CHANNELS);
    const next = { ...current, [channel]: enabled };
    await setSetting(ALERT_CHANNELS_KEY, next);
    return { data: next };
  } catch (err: any) {
    return { error: err?.message || "Failed to save alert channel" };
  }
}

// === Settings — security / API config ===

export type AdminSecuritySettings = {
  ipWhitelist: string;
  sessionTimeout: string;
  apiKey: string;
  rateLimit: string;
};
const SECURITY_KEY = "admin_security";

function generateApiKey() {
  const raw = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `sk_resthru_${raw}`;
}

const DEFAULT_SECURITY: AdminSecuritySettings = {
  ipWhitelist: "103.1.85.0/24",
  sessionTimeout: "1h",
  apiKey: "",
  rateLimit: "100",
};

export async function getAdminSecuritySettings(): Promise<{ data?: AdminSecuritySettings; error?: string }> {
  try {
    let data = await getSetting<AdminSecuritySettings>(SECURITY_KEY, DEFAULT_SECURITY);
    if (!data.apiKey) {
      data = { ...data, apiKey: generateApiKey() };
      await setSetting(SECURITY_KEY, data);
    }
    return { data };
  } catch (err: any) {
    return { error: err?.message || "Failed to load security settings" };
  }
}

export async function updateAdminSecuritySettings(patch: Partial<AdminSecuritySettings>) {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized" };

  try {
    const current = await getSetting<AdminSecuritySettings>(SECURITY_KEY, DEFAULT_SECURITY);
    const next = { ...current, ...patch };
    await setSetting(SECURITY_KEY, next);
    return { data: next };
  } catch (err: any) {
    return { error: err?.message || "Failed to save settings" };
  }
}

export async function regenerateAdminApiKey() {
  const session = await requireAdmin();
  if (!session) return { error: "Not authorized" };

  try {
    const current = await getSetting<AdminSecuritySettings>(SECURITY_KEY, DEFAULT_SECURITY);
    const next = { ...current, apiKey: generateApiKey() };
    await setSetting(SECURITY_KEY, next);
    return { data: next };
  } catch (err: any) {
    return { error: err?.message || "Failed to regenerate API key" };
  }
}
