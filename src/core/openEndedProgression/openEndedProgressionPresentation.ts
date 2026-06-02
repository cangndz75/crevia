import {
  FORBIDDEN_PLAYER_FACING_SEASON_END_TERMS,
} from './openEndedProgressionConstants';
import type {
  OpenEndedProgressionCopyModel,
  OperationCareerPhase,
  OperationReviewKind,
  ProgressionUnlockAxis,
} from './openEndedProgressionTypes';

const PHASE_LABELS: Record<OperationCareerPhase, string> = {
  pilot_training: 'Pilot Eğitim',
  light_main_operation: 'Ana Operasyon Başlangıcı',
  district_responsibility: 'Bölge Sorumluluğu',
  crisis_recovery_management: 'Kriz ve Toparlanma Yönetimi',
  citywide_operations: 'Şehir Operasyonları',
  long_term_career: 'Uzun Vadeli Operasyon Kariyeri',
};

const LEGACY_LABEL_NORMALIZATION: Record<string, string> = {
  'sezon sonu': 'Dönemsel Operasyon Değerlendirmesi',
  'sezon finali': 'Operasyon Dönemi Özeti',
  'yeni sezona başla': 'Operasyona Devam Et',
  'final değerlendirme': 'Dönemsel Operasyon Değerlendirmesi',
};

export function buildOperationCareerPhaseLabel(
  phase: OperationCareerPhase,
): string {
  return PHASE_LABELS[phase] ?? 'Operasyon Kariyeri';
}

export function buildPeriodicReviewCopy(input?: {
  kind?: OperationReviewKind;
  phase?: OperationCareerPhase;
}): OpenEndedProgressionCopyModel {
  const phaseLabel = input?.phase
    ? buildOperationCareerPhaseLabel(input.phase)
    : 'Operasyon Kariyeri';
  const title =
    input?.kind === 'operation_era_review'
      ? 'Operasyon Dönemi Özeti'
      : 'Dönemsel Operasyon Değerlendirmesi';

  return {
    title,
    subtitle:
      'Bu değerlendirme operasyon kariyerini kapatmaz; son dönemdeki kararlarının şehir üzerindeki etkisini özetler.',
    continuationLine:
      'Ana operasyon devam ediyor. Yeni yetkiler XP, ünvan, authority ve kaynak istikrarıyla açılır.',
    ctaLabel: 'Operasyona Devam Et',
    helperText: `${phaseLabel} içinde performans, milestone hedefleri ve sonraki yetki açılımları izlenir.`,
  };
}

export function buildOpenEndedProgressionSummary(input?: {
  axes?: readonly ProgressionUnlockAxis[];
}): string {
  const axes = input?.axes?.length
    ? input.axes.join(', ')
    : 'XP, yetki, ünvan ve kaynak istikrarı';
  return `Pilot sonrası ana operasyon açık uçlu ilerler. ${axes} yeni sistemlerin açılmasını sağlar.`;
}

export function buildNextProgressionPreview(input?: {
  axes?: readonly ProgressionUnlockAxis[];
}): string {
  const axes: readonly ProgressionUnlockAxis[] = input?.axes?.length
    ? input.axes
    : ['authority', 'district_trust', 'resource_stability'];
  const labels: Record<ProgressionUnlockAxis, string> = {
    xp: 'XP',
    authority: 'authority ilerlemeni',
    rank: 'ünvan ilerlemeni',
    resource_stability: 'kaynak istikrarını',
    district_trust: 'mahalle güvenini',
    crisis_control: 'kriz kontrolünü',
    operation_era: 'operation era kapsamını',
  };
  return `Bir sonraki yetki için ${axes.map((axis) => labels[axis]).join(', ')} koru.`;
}

export function containsForbiddenSeasonEndCopy(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return FORBIDDEN_PLAYER_FACING_SEASON_END_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function normalizeLegacySeasonEndLabel(label: string): string {
  const key = label.trim().toLocaleLowerCase('tr-TR');
  return LEGACY_LABEL_NORMALIZATION[key] ?? label;
}
