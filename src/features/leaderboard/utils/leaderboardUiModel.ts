import type { LeaderboardCategory, LeaderboardScoreBreakdown } from '@/core/leaderboard/leaderboardTypes';

export const LEADERBOARD_CATEGORY_OPTIONS: ReadonlyArray<{
  id: LeaderboardCategory;
  label: string;
}> = [
  { id: 'overall', label: 'Genel' },
  { id: 'efficient_municipality', label: 'Verimli Belediye' },
  { id: 'citizen_favorite', label: 'Halkın Favorisi' },
  { id: 'crisis_master', label: 'Kriz Ustası' },
  { id: 'personnel_friendly', label: 'Personel Dostu' },
];

export const LEADERBOARD_PERIOD_OPTIONS: ReadonlyArray<{
  id: 'pilot' | 'weekly' | 'season';
  label: string;
}> = [
  { id: 'pilot', label: 'Pilot' },
  { id: 'weekly', label: 'Haftalık' },
  { id: 'season', label: 'Sezon' },
];

export const BREAKDOWN_LABELS: Record<keyof LeaderboardScoreBreakdown, string> = {
  citizenSatisfaction: 'Halk Memnuniyeti',
  riskControl: 'Risk Kontrolü',
  budgetEfficiency: 'Bütçe Verimliliği',
  personnelSustainability: 'Personel Sürdürülebilirliği',
  complaintResolution: 'Şikayet Çözümü',
  butterflyControl: 'Kelebek Etkisi',
  neighborhoodFit: 'Mahalle Uyumu',
};

export function formatLeaderboardScore(score: number): string {
  return Math.round(score).toLocaleString('tr-TR');
}

/** Pilot final rapor ekranı — birinci tekil yorum metinleri. */
export function getPilotFinalPerformanceComment(score: number): string {
  if (score >= 9000) {
    return 'Stratejik kararların pilot bölgeyi üst seviyeye taşıdı.';
  }
  if (score >= 8000) {
    return 'Dengeli ve güçlü bir pilot yönetimi sergiledin.';
  }
  if (score >= 7000) {
    return 'Operasyon genel olarak güvenli ilerledi.';
  }
  if (score >= 6000) {
    return 'Potansiyel var; bazı riskleri daha erken yönetmelisin.';
  }
  return 'Pilot süreçte kritik yönetim açıkları oluştu.';
}

export function getPerformanceComment(score: number): string {
  if (score >= 9000) {
    return 'Stratejik kararların bölgeyi yukarı taşıdı.';
  }
  if (score >= 8000) {
    return 'Dengeli ve güçlü bir yönetim performansı.';
  }
  if (score >= 7000) {
    return 'Operasyon genel olarak güvenli ilerledi.';
  }
  if (score >= 6000) {
    return 'Potansiyel var, riskleri daha iyi yönetmelisin.';
  }
  return 'Pilot süreçte kritik yönetim açıkları oluştu.';
}

export function getBreakdownHighlights(breakdown: LeaderboardScoreBreakdown): {
  strongest: { key: keyof LeaderboardScoreBreakdown; label: string; value: number };
  weakest: { key: keyof LeaderboardScoreBreakdown; label: string; value: number };
} {
  const entries = Object.entries(breakdown) as Array<
    [keyof LeaderboardScoreBreakdown, number]
  >;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [strongKey, strongValue] = sorted[0] ?? ['riskControl', 0];
  const [weakKey, weakValue] = sorted[sorted.length - 1] ?? ['personnelSustainability', 0];

  return {
    strongest: {
      key: strongKey,
      label: BREAKDOWN_LABELS[strongKey],
      value: strongValue,
    },
    weakest: {
      key: weakKey,
      label: BREAKDOWN_LABELS[weakKey],
      value: weakValue,
    },
  };
}

export const PODIUM_RANK_STYLES = {
  1: { label: '1', accent: '#D4A017', bg: '#FFF6E0' },
  2: { label: '2', accent: '#8E99A8', bg: '#F2F4F7' },
  3: { label: '3', accent: '#B07A52', bg: '#FBF0E8' },
} as const;
