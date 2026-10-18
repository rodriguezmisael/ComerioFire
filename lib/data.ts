import { env } from 'cloudflare:workers';
export function database() { if (!env.DB) throw new Error('Base de datos no disponible'); return env.DB; }
export async function all<T>(sql: string, ...values: unknown[]): Promise<T[]> { const r = await database().prepare(sql).bind(...values).all<T>(); return r.results ?? []; }
export async function run(sql: string, ...values: unknown[]) { return database().prepare(sql).bind(...values).run(); }
export const id = () => crypto.randomUUID();
export const code = (prefix: string) => `${prefix}-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
