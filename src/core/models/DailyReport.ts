import type {
  AuthorityDailyGainSnapshot,
  AuthorityEvaluationSnapshot,
} from '@/core/authority/authorityTypes';
import type { BadgeEvaluationSnapshot } from '@/core/badges/badgeTypes';

export type DailyReportStat = {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

export type DailyReport = {
  day: number;
  title: string;
  stats: DailyReportStat[];
  rewardTitle: string;
  rewardDescription?: string;
  summaryLines?: string[];
  /** Günün odak mahallesi — kimlik tonu (snapshot). */
  neighborhoodIdentityLine?: string;
  /** Gün sonu günlük öncelik sonucu — snapshot. */
  dailyPriorityResult?: {
    key: string;
    title: string;
    status: 'fulfilled' | 'partial' | 'failed';
    text: string;
    carryOverText?: string;
    score: number;
  };
  warnings?: string[];
  highlights?: string[];
  /** Gün sonu personel bloğu — genel özetten ayrı tutulur. */
  personnelSummaryLines?: string[];
  /** Gün sonu atık/konteyner operasyon özeti (en fazla 3 satır). */
  containerSummaryLines?: string[];
  /** Gün sonu araç filosu özeti (en fazla 3 satır). */
  vehicleSummaryLines?: string[];
  /** Gün sonu sosyal nabız özeti (en fazla 2 satır). */
  socialSummaryLines?: string[];
  /** Gün sonu günlük hedef sonuçları — snapshot. */
  dailyGoalResults?: Array<{
    title: string;
    status: 'completed' | 'failed' | 'at_risk' | 'active';
    resultText: string;
  }>;
  /** Karar yankısı özeti — snapshot (en fazla 2 satır). */
  butterflySummaryLines?: string[];
  /** Dünden kalan sinyal özeti — snapshot (en fazla 2 satır). */
  carryOverSummaryLines?: string[];
  /** Hub hızlı aksiyon özeti — snapshot (en fazla 2 satır). */
  quickActionSummaryLines?: string[];
  /** Gün sonu yetki güveni snapshot'ı. */
  authorityDailyGain?: AuthorityDailyGainSnapshot;
  /** Gün sonu yetki özeti satırları. */
  authoritySummaryLines?: string[];
  /** Pilot final yetki değerlendirmesi — yalnızca dönem sonu. */
  authorityEvaluation?: AuthorityEvaluationSnapshot;
  /** Pilot final yetki değerlendirme satırları. */
  authorityEvaluationLines?: string[];
  /** Gün sonu rozet değerlendirmesi — snapshot. */
  badgeEvaluation?: BadgeEvaluationSnapshot;
  /** Gün sonu rozet özeti satırları. */
  badgeSummaryLines?: string[];
  createdAt?: string;
};
