import type { PilotFinalResultStatus } from '@/core/models/PilotGameState';
import type { GameChipTone } from '@/ui/components/GameChip';

export const PILOT_STATUS_LABELS: Record<PilotFinalResultStatus, string> = {
  successful: 'Başarılı Pilot',
  controlled: 'Kontrollü Pilot',
  risky: 'Riskli Pilot',
  failed: 'Zayıf Pilot',
};

export function pilotStatusChipTone(
  status: PilotFinalResultStatus,
): GameChipTone {
  switch (status) {
    case 'successful':
      return 'success';
    case 'controlled':
      return 'info';
    case 'risky':
      return 'warning';
    case 'failed':
      return 'danger';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function pilotScoreAccentColor(status: PilotFinalResultStatus): string {
  switch (status) {
    case 'successful':
      return '#3BAF7A';
    case 'controlled':
      return '#5B8FD4';
    case 'risky':
      return '#E89B2E';
    case 'failed':
      return '#E05A52';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
