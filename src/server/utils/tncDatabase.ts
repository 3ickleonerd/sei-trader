import { db } from '../../../db.ts';

export interface TncAcceptanceRecord {
  id?: number;
  telegram_id?: number;
  telegram_username?: string;
  tnc_version: string;
  tnc_hash: string;
  accepted_at?: string;
  method: string;
  ip_address?: string;
  device?: string;
  slug?: string;
  created_at?: string;
}

export function insertTncAcceptance(record: TncAcceptanceRecord): void {
  const stmt = db.prepare(`
    INSERT INTO tnc_acceptance_history (
      telegram_id, telegram_username, tnc_version, tnc_hash, 
      accepted_at, method, ip_address, device, slug
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run([
    record.telegram_id || null,
    record.telegram_username || null,
    record.tnc_version,
    record.tnc_hash,
    record.accepted_at || new Date().toISOString(),
    record.method,
    record.ip_address || null,
    record.device || null,
    record.slug || null
  ]);
}

export function getTncAcceptanceByTelegramId(telegramId: number): TncAcceptanceRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM tnc_acceptance_history 
    WHERE telegram_id = ? 
    ORDER BY accepted_at DESC
  `);
  
  return stmt.all([telegramId]) as TncAcceptanceRecord[];
}

export function getTncAcceptanceBySlug(slug: string): TncAcceptanceRecord | null {
  const stmt = db.prepare(`
    SELECT * FROM tnc_acceptance_history 
    WHERE slug = ? 
    ORDER BY accepted_at DESC 
    LIMIT 1
  `);
  
  return stmt.get([slug]) as TncAcceptanceRecord | null;
}

export function hasAcceptedLatestTnc(telegramId: number, currentVersion: string): boolean {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM tnc_acceptance_history 
    WHERE telegram_id = ? AND tnc_version = ?
  `);
  
  const result = stmt.get([telegramId, currentVersion]) as { count: number };
  return result.count > 0;
}
