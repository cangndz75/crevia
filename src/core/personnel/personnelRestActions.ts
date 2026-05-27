import type { EconomyState } from '@/core/economy/types';

import { REST_ACTION_COSTS } from './personnelConstants';
import { applyRestAction } from './personnelEngine';
import type { PersonnelState, RestActionType } from './personnelTypes';

export type RestPersonnelActionResult = {
  success: boolean;
  message: string;
  personnelState: PersonnelState;
};

export function canUseRestAction(
  state: PersonnelState,
  teamId: string,
  restType: RestActionType,
  day: number,
): { allowed: boolean; message: string } {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) {
    return { allowed: false, message: 'Ekip bulunamadı.' };
  }

  if (restType === 'light_duty' || restType === 'full_rest') {
    if (team.restMode === restType && team.lastRestDay === day) {
      return { allowed: false, message: 'Bu ekip için dinlenme planı zaten aktif.' };
    }
  }

  if (restType === 'motivation') {
    const lastUsed = state.motivationUsedByTeamId[teamId];
    if (lastUsed === day) {
      return {
        allowed: false,
        message: 'Bu ekibe bugün zaten motivasyon desteği verildi.',
      };
    }
  }

  if (restType === 'equipment_support') {
    if (state.equipmentSupportUsedDay === day) {
      return {
        allowed: false,
        message: 'Ekipman desteği bugün zaten kullanıldı.',
      };
    }
  }

  return { allowed: true, message: '' };
}

export function applyPersonnelRestAction(
  state: PersonnelState,
  teamId: string,
  restType: RestActionType,
  day: number,
): RestPersonnelActionResult {
  const gate = canUseRestAction(state, teamId, restType, day);
  if (!gate.allowed) {
    return { success: false, message: gate.message, personnelState: state };
  }

  let nextState = applyRestAction(state, teamId, restType, day);

  if (restType === 'motivation') {
    nextState = {
      ...nextState,
      motivationUsedByTeamId: {
        ...nextState.motivationUsedByTeamId,
        [teamId]: day,
      },
    };
  }

  if (restType === 'equipment_support') {
    nextState = {
      ...nextState,
      equipmentSupportUsedDay: day,
    };
  }

  const team = nextState.teams.find((t) => t.id === teamId);
  const teamName = team?.name ?? 'Ekip';

  const messages: Record<RestActionType, string> = {
    light_duty: `${teamName} bugün hafif görevde — zor görevlerde risk artar.`,
    full_rest: `${teamName} bugün tam dinlenmede — saha görevi alamaz.`,
    motivation: `${teamName} için motivasyon desteği uygulandı.`,
    equipment_support: 'Ekipman desteği aktif — sonraki görevlerde yorgunluk azalır.',
  };

  return {
    success: true,
    message: messages[restType],
    personnelState: nextState,
  };
}

export function getRestActionCost(restType: RestActionType): number {
  if (restType === 'motivation') return REST_ACTION_COSTS.motivation;
  if (restType === 'equipment_support') return REST_ACTION_COSTS.equipment_support;
  return 0;
}

export function canAffordRestAction(
  economyState: EconomyState,
  restType: RestActionType,
): boolean {
  const cost = getRestActionCost(restType);
  if (cost <= 0) return true;
  return economyState.currentSource >= cost;
}
