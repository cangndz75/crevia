import type { GameChipTone } from '@/ui/components/GameChip';

import type {
  PilotCompletionGrade,
  PilotManagementStyle,
} from './pilotCompletionTypes';

export const PILOT_COMPLETION_GRADE_LABELS: Record<PilotCompletionGrade, string> = {
  excellent: 'Mükemmel',
  strong: 'Güçlü',
  steady: 'Dengeli',
  fragile: 'Kırılgan',
};

export const PILOT_COMPLETION_GRADE_SUBTITLES: Record<PilotCompletionGrade, string> = {
  excellent: 'Pilot bölgeyi güçlü bir dengeyle tamamladın.',
  strong: 'Pilot süreç başarılı ilerledi, birkaç takip riski kaldı.',
  steady:
    'Pilot görev tamamlandı; bazı kararlar ana operasyonda dikkat isteyecek.',
  fragile:
    'Pilot tamamlandı ama ana operasyon öncesi dengeleri güçlendirmek gerekiyor.',
};

export const PILOT_MANAGEMENT_STYLE_LABELS: Record<PilotManagementStyle, string> = {
  public_first: 'Halk Öncelikli Koordinatör',
  operator: 'Saha Operasyoncusu',
  resource_guardian: 'Kaynak Koruyucu',
  balanced_coordinator: 'Dengeli Koordinatör',
  crisis_responder: 'Kriz Müdahale Uzmanı',
};

export const PILOT_MANAGEMENT_STYLE_TEXT: Record<PilotManagementStyle, string> = {
  public_first:
    'Önceliklerinde halk rahatlatma ve iletişim kararları öne çıktı.',
  operator:
    'Saha operasyonu, rota ve altyapı kararlarıyla günleri yönettin.',
  resource_guardian:
    'Kaynak koruma ve düşük maliyetli müdahalelerle dengeyi korudun.',
  balanced_coordinator:
    'Öncelik ve karar tonlarında dengeli bir koordinasyon izledin.',
  crisis_responder:
    'Hızlı müdahale ve yüksek riskli kararlarla baskıyı kırdın.',
};

export function gradeFromScore(score: number): PilotCompletionGrade {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'steady';
  return 'fragile';
}

export function pilotCompletionGradeChipTone(
  grade: PilotCompletionGrade,
): GameChipTone {
  switch (grade) {
    case 'excellent':
      return 'success';
    case 'strong':
      return 'info';
    case 'steady':
      return 'neutral';
    case 'fragile':
      return 'warning';
    default: {
      const _exhaustive: never = grade;
      return _exhaustive;
    }
  }
}

export function containsPaymentBannedCopy(text: string): boolean {
  const haystack = text.toLowerCase();
  return (
    haystack.includes('satın al') ||
    haystack.includes('premium') ||
    haystack.includes('abone ol') ||
    haystack.includes('paket') ||
    haystack.includes('teklif') ||
    haystack.includes('₺') ||
    haystack.includes('paywall') ||
    haystack.includes('iap')
  );
}
