import { AUTHORITY_UNLOCKS_BY_LEVEL } from '@/core/xp/constants';

/** Belirtilen seviyeye kadar (dahil) açılmış tüm yetki id'lerini döndürür. */
export function getUnlockedAuthoritiesForLevel(level: number): string[] {
  const safeLevel = Math.max(1, Math.floor(level));
  const unlocked = new Set<string>();

  for (let current = 1; current <= safeLevel; current += 1) {
    const batch = AUTHORITY_UNLOCKS_BY_LEVEL[current];
    if (batch) {
      for (const authorityId of batch) {
        unlocked.add(authorityId);
      }
    }
  }

  return [...unlocked];
}
