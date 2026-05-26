import type { PilotDayTheme } from '@/core/models/PilotDayPlan';
import type { PilotStatus } from '@/core/models/PilotGameState';
import type { GameChipTone } from '@/ui/components/GameChip';

export const PILOT_DAY_THEME_LABELS: Record<PilotDayTheme, string> = {
  learning: 'Öğrenme',
  complaint: 'Şikayet',
  resource: 'Kaynak',
  social_pressure: 'Sosyal Baskı',
  opportunity: 'Fırsat',
  butterfly_effect: 'Kelebek Etkisi',
  final_report: 'Final Raporu',
};

export const PILOT_STATUS_CHIP_LABELS: Record<PilotStatus, string> = {
  not_started: 'Başlamadı',
  active: 'Aktif Pilot',
  completed: 'Pilot Tamamlandı',
};

export function pilotStatusChipTone(status: PilotStatus): GameChipTone {
  switch (status) {
    case 'not_started':
      return 'neutral';
    case 'active':
      return 'success';
    case 'completed':
      return 'purple';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
