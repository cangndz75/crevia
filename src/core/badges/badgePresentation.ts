import { BADGE_BY_ID } from './badgeConstants';
import type {
  BadgeCategory,
  BadgeEvaluationResult,
  BadgeEvaluationSnapshot,
  BadgeId,
  BadgeProgressUpdate,
  BadgeRarity,
  BadgeState,
} from './badgeTypes';

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  operations: 'Operasyon',
  publicTrust: 'Halk Güveni',
  resources: 'Kaynaklar',
  personnel: 'Personel',
  crisis: 'Kriz',
  authority: 'Yetki',
  consistency: 'İstikrar',
  pilot: 'Pilot',
};

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Standart',
  uncommon: 'Nadir',
  rare: 'Seçkin',
  epic: 'Üst Düzey',
};

const REPORT_RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Yaygın',
  uncommon: 'Seçkin',
  rare: 'Nadir',
  epic: 'Destansı',
};

export type ReportBadgeSummaryModel = {
  visible: boolean;
  mode: 'earned' | 'progress';
  title: string;
  primaryBadge?: {
    title: string;
    description: string;
    rarityLabel: string;
    categoryLabel: string;
  };
  extraEarnedCount: number;
  progressLines: string[];
};

export function buildBadgeTitle(badgeId: BadgeId | string): string {
  if (badgeId in BADGE_BY_ID) {
    return BADGE_BY_ID[badgeId as BadgeId].title;
  }
  return 'Bilinmeyen Rozet';
}

export function buildBadgeDescription(badgeId: BadgeId | string): string {
  if (badgeId in BADGE_BY_ID) {
    return BADGE_BY_ID[badgeId as BadgeId].description;
  }
  return 'Rozet kaydı bulunamadı.';
}

export function buildBadgeRarityLabel(rarity: BadgeRarity): string {
  return RARITY_LABELS[rarity] ?? 'Standart';
}

export function buildBadgeCategoryLabel(category: BadgeCategory): string {
  return CATEGORY_LABELS[category] ?? 'Operasyon';
}

export function buildBadgeEarnedLines(badgeIds: BadgeId[]): string[] {
  return badgeIds.map(
    (badgeId) => `Yeni rozet kazanıldı: ${buildBadgeTitle(badgeId)}`,
  );
}

export function buildBadgeProgressLines(
  updates: BadgeProgressUpdate[],
  badgeState: BadgeState,
): string[] {
  const lines: string[] = [];

  for (const update of updates) {
    if (badgeState.earnedBadgeIds.includes(update.badgeId)) {
      continue;
    }
    if (update.completed) {
      continue;
    }
    if (update.current <= 0) {
      continue;
    }
    lines.push(
      `Rozet ilerlemesi: ${buildBadgeTitle(update.badgeId)} ${update.current}/${update.target}`,
    );
  }

  return lines.slice(0, 2);
}

export function buildBadgeEvaluationSnapshot(
  result: BadgeEvaluationResult,
  badgeState?: BadgeState,
): BadgeEvaluationSnapshot {
  const earnedLines = buildBadgeEarnedLines(result.earnedBadgeIds);
  const progressLines =
    badgeState != null
      ? buildBadgeProgressLines(result.progressUpdates, badgeState)
      : [];

  return {
    earnedBadgeIds: result.earnedBadgeIds,
    earnedLines,
    progressLines,
  };
}

export function buildBadgeSummaryLines(
  snapshot: BadgeEvaluationSnapshot,
  badgeState?: BadgeState,
  options?: { compact?: boolean },
): string[] {
  const lines: string[] = [];

  if (snapshot.earnedLines.length > 0) {
    lines.push(...snapshot.earnedLines.slice(0, options?.compact ? 1 : 2));
  }

  if (snapshot.progressLines.length > 0) {
    if (lines.length === 0) {
      lines.push('Rozet ilerlemesi güncellendi.');
    }
    lines.push(...snapshot.progressLines.slice(0, options?.compact ? 1 : 2));
  }

  if (lines.length === 0 && badgeState) {
    const inProgress = Object.values(badgeState.badgeProgress).find(
      (progress) => progress.current > 0 && !progress.completed,
    );
    if (inProgress) {
      lines.push('Rozet ilerlemesi güncellendi.');
      if (inProgress.badgeId === 'crisis_cooler') {
        lines.push('Kriz Soğutucu için uygun koşullar izleniyor.');
      }
    }
  }

  return lines.slice(0, options?.compact ? 2 : 3);
}

export function buildDay1BadgeSummaryLines(): string[] {
  return ['Rozet sistemi aktif.'];
}

function isKnownBadgeId(badgeId: string): badgeId is BadgeId {
  return badgeId in BADGE_BY_ID;
}

function uniqueKnownEarnedIds(badgeIds: BadgeId[]): BadgeId[] {
  const seen = new Set<BadgeId>();
  const result: BadgeId[] = [];
  for (const badgeId of badgeIds) {
    if (!isKnownBadgeId(badgeId) || seen.has(badgeId)) continue;
    seen.add(badgeId);
    result.push(badgeId);
  }
  return result;
}

export function buildReportBadgeRarityLabel(rarity: BadgeRarity): string {
  return REPORT_RARITY_LABELS[rarity] ?? 'Yaygın';
}

export function buildReportBadgeEarnedDescription(badgeId: BadgeId | string): string {
  if (!isKnownBadgeId(badgeId)) {
    return 'Operasyon başarıyla tamamlandı.';
  }
  const raw = BADGE_BY_ID[badgeId].description;
  return raw
    .replace(/ tamamla\.$/, ' tamamladın.')
    .replace(/ kapat\.$/, ' kapattın.')
    .replace(/ üret\.$/, ' ürettin.')
    .replace(/ yönet\.$/, ' yönettin.')
    .replace(/ oluştur\.$/, ' oluşturdun.')
    .replace(/ aç\.$/, ' açtın.');
}

function formatReportProgressLine(line: string): string {
  const trimmed = line.trim();
  const prefixed = trimmed.match(/^Rozet ilerlemesi:\s*(.+)$/i);
  if (prefixed?.[1]) {
    return prefixed[1].trim();
  }
  return trimmed;
}

function formatReportProgressLines(lines: string[]): string[] {
  const formatted: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const next = formatReportProgressLine(line);
    if (!next || seen.has(next)) continue;
    seen.add(next);
    formatted.push(next);
  }
  return formatted.slice(0, 2);
}

export function buildReportBadgeSummaryModel(
  evaluation?: BadgeEvaluationSnapshot | null,
): ReportBadgeSummaryModel {
  const empty: ReportBadgeSummaryModel = {
    visible: false,
    mode: 'progress',
    title: '',
    extraEarnedCount: 0,
    progressLines: [],
  };

  if (!evaluation) {
    return empty;
  }

  const earnedIds = uniqueKnownEarnedIds(evaluation.earnedBadgeIds ?? []);
  const progressLines = formatReportProgressLines(evaluation.progressLines ?? []);

  if (earnedIds.length === 0 && progressLines.length === 0) {
    return empty;
  }

  if (earnedIds.length > 0) {
    const primaryId = earnedIds[0]!;
    const definition = BADGE_BY_ID[primaryId];
    return {
      visible: true,
      mode: 'earned',
      title: 'Rozet Kazanımı',
      primaryBadge: {
        title: definition.title,
        description: buildReportBadgeEarnedDescription(primaryId),
        rarityLabel: buildReportBadgeRarityLabel(definition.rarity),
        categoryLabel: buildBadgeCategoryLabel(definition.category),
      },
      extraEarnedCount: Math.max(0, earnedIds.length - 1),
      progressLines: [],
    };
  }

  return {
    visible: true,
    mode: 'progress',
    title: 'Rozet İlerlemesi',
    extraEarnedCount: 0,
    progressLines,
  };
}
