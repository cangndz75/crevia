import { buildDailyXpReport } from '@/core/xp/xpReport';
import type { XpTransaction } from '@/core/xp/types';

export function verifyDailyXpReportScenario(): { passed: boolean; message: string } {
  const history: XpTransaction[] = [
    {
      id: 'xp_1',
      day: 2,
      amount: 65,
      category: 'event',
      title: 'Kritik olay çözüldü',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'xp_2',
      day: 2,
      amount: 15,
      category: 'event',
      title: 'Kalite bonusu',
      createdAt: '2026-01-01T00:00:01.000Z',
    },
    {
      id: 'xp_3',
      day: 2,
      amount: 8,
      category: 'risk',
      title: 'Risk azaltıldı',
      createdAt: '2026-01-01T00:00:02.000Z',
    },
    {
      id: 'xp_4',
      day: 2,
      amount: 10,
      category: 'efficiency',
      title: 'Personel dengeli kullanıldı',
      createdAt: '2026-01-01T00:00:03.000Z',
    },
    {
      id: 'xp_5',
      day: 2,
      amount: 10,
      category: 'district',
      title: 'Yoğunluk kontrol edildi',
      createdAt: '2026-01-01T00:00:04.000Z',
    },
    {
      id: 'xp_6',
      day: 1,
      amount: 40,
      category: 'event',
      title: 'Eski gün',
      createdAt: '2025-12-31T00:00:00.000Z',
    },
  ];

  const report = buildDailyXpReport(history, 2);

  if (report.totalXp !== 108) {
    return {
      passed: false,
      message: `totalXp beklenen 108, alınan ${report.totalXp}`,
    };
  }

  const byCategory = Object.fromEntries(
    report.categories.map((g) => [g.category, g.total]),
  );

  const checks: [string, number, number][] = [
    ['event', 80, byCategory.event ?? 0],
    ['risk', 8, byCategory.risk ?? 0],
    ['efficiency', 10, byCategory.efficiency ?? 0],
    ['district', 10, byCategory.district ?? 0],
  ];

  for (const [name, expected, actual] of checks) {
    if (actual !== expected) {
      return {
        passed: false,
        message: `${name} toplamı beklenen ${expected}, alınan ${actual}`,
      };
    }
  }

  return { passed: true, message: 'Daily XP report senaryosu geçti' };
}

export function assertDailyXpReportScenario(): void {
  const result = verifyDailyXpReportScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
