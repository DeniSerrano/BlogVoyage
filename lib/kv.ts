import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
  }
  return client;
}

export interface Tienda {
  store_id: string;
  access_token: string;
  blog_id?: string | null;
  store_name?: string;
  store_url?: string;
  store_email?: string;
  wp_url?: string;
  autosync_enabled?: boolean;
  autosync_publish?: boolean;
  autosync_last_synced_at?: string | null;
}

export interface HistoryEntry {
  id: string;
  store_id: string;
  source_url: string;
  total_posts: number;
  successful: number;
  failed: number;
  created_at: string;
  details: unknown[];
}

export async function getTienda(storeId: string): Promise<Tienda | null> {
  const redis = await getClient();
  const raw = await redis.get(`tienda:${storeId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function setTienda(tienda: Tienda): Promise<void> {
  const redis = await getClient();
  await redis.set(`tienda:${tienda.store_id}`, JSON.stringify(tienda));
}

export async function updateTienda(storeId: string, fields: Partial<Tienda>): Promise<void> {
  const existing = await getTienda(storeId);
  if (!existing) throw new Error('Tienda no encontrada');
  await setTienda({ ...existing, ...fields });
}

export async function getLastStoreId(): Promise<string | null> {
  const redis = await getClient();
  return redis.get('last_store');
}

export async function setLastStoreId(storeId: string): Promise<void> {
  const redis = await getClient();
  await redis.set('last_store', storeId);
}

export async function getHistory(storeId: string): Promise<HistoryEntry[]> {
  const redis = await getClient();
  const raw = await redis.get(`history:${storeId}`);
  return raw ? JSON.parse(raw) : [];
}

export async function appendHistory(storeId: string, entry: Omit<HistoryEntry, 'id' | 'created_at'>): Promise<void> {
  const existing = await getHistory(storeId);
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const updated = [newEntry, ...existing].slice(0, 20);
  const redis = await getClient();
  await redis.set(`history:${storeId}`, JSON.stringify(updated));
}

export async function getTiendasConAutosync(): Promise<Tienda[]> {
  const redis = await getClient();
  const keys = await redis.keys('tienda:*');
  if (keys.length === 0) return [];

  const values = await Promise.all(keys.map((k) => redis.get(k)));
  return values
    .filter((v): v is string => !!v)
    .map((v) => JSON.parse(v) as Tienda)
    .filter((t) => t.autosync_enabled === true);
}
