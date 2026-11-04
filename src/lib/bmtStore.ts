export function withBase(p: string): string {
  if (!p || p.startsWith('http') || p.startsWith('data:')) return p;
  const rawBase = import.meta.env.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  const clean = p.startsWith('/') ? p : '/' + p;
  if (base && clean.startsWith(base + '/')) return clean;
  return base + clean;
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_BMT_DATA,
  type BmtStoreData,
  type ActivityItem,
  type RegistrationItem,
  type MaterialItem,
  type WikilocRouteItem,
  type ClubSettings
} from '../data/bmtDefaultData';

const STORAGE_KEY = 'bmt_cms_store_v1';
const SUPA_CFG_KEY = 'bmt_supabase_cfg_v1';
const CHANNEL_NAME = 'bmt_live_sync';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseRuntimeConfig | null {
  const envUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
  const envKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
  if (envUrl.startsWith('http') && envKey.length > 20) {
    return { url: envUrl, anonKey: envKey };
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(SUPA_CFG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SupabaseRuntimeConfig;
        if (parsed.url?.startsWith('http') && parsed.anonKey?.length > 20) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  if (!url.trim() || !anonKey.trim()) {
    localStorage.removeItem(SUPA_CFG_KEY);
  } else {
    localStorage.setItem(SUPA_CFG_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  }
  notifySubscribers();
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  try {
    return createClient(cfg.url, cfg.anonKey);
  } catch {
    return null;
  }
}

export function loadStore(): BmtStoreData {
  if (typeof window === 'undefined') {
    return structuredClone(DEFAULT_BMT_DATA);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_BMT_DATA);
    }
    const parsed = JSON.parse(raw) as Partial<BmtStoreData>;
    return {
      version: 1,
      activities: Array.isArray(parsed.activities) ? parsed.activities : structuredClone(DEFAULT_BMT_DATA.activities),
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : structuredClone(DEFAULT_BMT_DATA.registrations),
      materials: Array.isArray(parsed.materials) ? parsed.materials : structuredClone(DEFAULT_BMT_DATA.materials),
      wikiloc: Array.isArray(parsed.wikiloc) ? parsed.wikiloc : structuredClone(DEFAULT_BMT_DATA.wikiloc),
      settings: parsed.settings ? { ...DEFAULT_BMT_DATA.settings, ...parsed.settings } : structuredClone(DEFAULT_BMT_DATA.settings)
    };
  } catch {
    return structuredClone(DEFAULT_BMT_DATA);
  }
}

let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

function notifySubscribers(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('bmt:store-updated'));
  try {
    getChannel()?.postMessage({ type: 'STORE_UPDATED', ts: Date.now() });
  } catch {
    // ignore
  }
}

export function saveStore(data: BmtStoreData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifySubscribers();
}

export function resetStoreToDefaults(): BmtStoreData {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    notifySubscribers();
  }
  return structuredClone(DEFAULT_BMT_DATA);
}

export function subscribeStore(callback: (data: BmtStoreData) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(loadStore());
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) handler();
  };
  const bc = getChannel();
  const bcHandler = () => handler();

  window.addEventListener('bmt:store-updated', handler);
  window.addEventListener('storage', storageHandler);
  bc?.addEventListener('message', bcHandler);

  return () => {
    window.removeEventListener('bmt:store-updated', handler);
    window.removeEventListener('storage', storageHandler);
    bc?.removeEventListener('message', bcHandler);
  };
}

export async function addRegistration(
  reg: Omit<RegistrationItem, 'id' | 'created_at'>
): Promise<{ ok: boolean; mode: 'supabase' | 'local'; error?: string }> {
  const store = loadStore();
  const newReg: RegistrationItem = {
    ...reg,
    id: 'reg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    created_at: new Date().toISOString()
  };

  store.registrations.unshift(newReg);

  // Also increment occupied count on the matching activity
  const act = store.activities.find((a) => a.id === reg.activity_key);
  if (act) {
    act.occupied = Math.min(act.capacity || 999, (act.occupied || 0) + 1);
    if (act.capacity > 0 && act.occupied >= act.capacity) {
      act.status = 'full';
    }
  }
  saveStore(store);

  const supa = getSupabaseClient();
  if (supa) {
    const { error } = await supa.from('izena_emateak').insert({
      activity_key: reg.activity_key,
      activity_title: reg.activity_title,
      izena: reg.izena,
      abizenak: reg.abizenak,
      nan: reg.nan,
      jaiotza: reg.jaiotza || null,
      telefonoa: reg.telefonoa,
      eposta: reg.eposta,
      bazkidea: reg.bazkidea,
      bazkide_zenbakia: reg.bazkide_zenbakia,
      oharrak: reg.oharrak
    });
    if (error) {
      return { ok: false, mode: 'supabase', error: error.message };
    }
    return { ok: true, mode: 'supabase' };
  }

  return { ok: true, mode: 'local' };
}

export type {
  BmtStoreData,
  ActivityItem,
  RegistrationItem,
  MaterialItem,
  WikilocRouteItem,
  ClubSettings
};
