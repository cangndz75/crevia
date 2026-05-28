import {
  HUB_QUICK_ACTION_DEFINITIONS,
  HUB_QUICK_ACTION_IDS,
  HUB_QUICK_ACTION_STATUS_LABELS,
  assertNever,
} from './hubQuickActionConstants';
import type {
  HubQuickActionCardModel,
  HubQuickActionResult,
  HubQuickActionState,
  HubQuickActionStatus,
  HubQuickActionTone,
} from './hubQuickActionTypes';

export function getHubQuickActionStatusLabel(status: HubQuickActionStatus): string {
  return HUB_QUICK_ACTION_STATUS_LABELS[status];
}

export function resolveHubQuickActionStatus(
  actionId: import('./hubQuickActionTypes').HubQuickActionId,
  state: HubQuickActionState,
  options?: { day1Disabled?: boolean },
): HubQuickActionStatus {
  if (options?.day1Disabled) {
    return 'disabled';
  }
  if (state.usedActionIds.includes(actionId)) {
    return 'used';
  }
  return 'available';
}

function resolveRoutePreparationCardHelper(
  state: HubQuickActionState,
  used: boolean,
): { helperLine?: string; resultPreview?: string } {
  if (!used) {
    return {
      helperLine: 'Riskli rota için uygun aracı öne alır.',
      resultPreview: undefined,
    };
  }
  if (state.routePreparation && state.routePreparation.day === state.day) {
    const neighborhood = state.routePreparation.targetNeighborhoodLabel;
    const last = state.records
      .filter((r) => r.actionId === 'route_preparation' && r.day === state.day)
      .at(-1);
    return {
      helperLine: `${neighborhood} rotası hazır.`,
      resultPreview: last?.resultLine,
    };
  }
  const last = state.records
    .filter((r) => r.actionId === 'route_preparation' && r.day === state.day)
    .at(-1);
  if (last?.resultLine.includes('Uygun araç bulunamadı')) {
    return { helperLine: 'Uygun araç yok.', resultPreview: last.resultLine };
  }
  return {
    helperLine: last?.resultLine,
    resultPreview: last?.resultLine,
  };
}

function resolveNeighborhoodPatrolCardHelper(
  state: HubQuickActionState,
  used: boolean,
): { helperLine?: string; resultPreview?: string } {
  if (!used) {
    return {
      helperLine: 'Riskli mahallede kısa saha kontrolü başlatır.',
      resultPreview: undefined,
    };
  }
  if (state.neighborhoodPatrol && state.neighborhoodPatrol.day === state.day) {
    const neighborhood = state.neighborhoodPatrol.targetNeighborhoodLabel;
    const last = state.records
      .filter((r) => r.actionId === 'neighborhood_patrol' && r.day === state.day)
      .at(-1);
    return {
      helperLine: `${neighborhood} turu tamamlandı.`,
      resultPreview: last?.resultLine,
    };
  }
  const last = state.records
    .filter((r) => r.actionId === 'neighborhood_patrol' && r.day === state.day)
    .at(-1);
  if (last?.resultLine.includes('Uygun mahalle bulunamadı')) {
    return { helperLine: 'Uygun mahalle yok.', resultPreview: last.resultLine };
  }
  return {
    helperLine: last?.resultLine,
    resultPreview: last?.resultLine,
  };
}

function resolveSocialResponseCardHelper(
  state: HubQuickActionState,
  used: boolean,
): { helperLine?: string; resultPreview?: string } {
  if (!used) {
    return {
      helperLine: 'Aktif gündem için kısa açıklama hazırlar.',
      resultPreview: undefined,
    };
  }
  if (state.socialResponse && state.socialResponse.day === state.day) {
    const label =
      state.socialResponse.targetNeighborhoodLabel ??
      state.socialResponse.targetTopicTitle ??
      'Gündem';
    const last = state.records
      .filter((r) => r.actionId === 'social_response' && r.day === state.day)
      .at(-1);
    return {
      helperLine: `${label} yanıtı hazır.`,
      resultPreview: last?.resultLine,
    };
  }
  const last = state.records
    .filter((r) => r.actionId === 'social_response' && r.day === state.day)
    .at(-1);
  if (last?.resultLine.includes('uygun gündem bulunamadı')) {
    return { helperLine: 'Uygun gündem yok.', resultPreview: last.resultLine };
  }
  if (last?.resultLine.includes('zaten yanıt verildi')) {
    return { helperLine: 'Gündem yanıtlandı.', resultPreview: last.resultLine };
  }
  return {
    helperLine: last?.resultLine,
    resultPreview: last?.resultLine,
  };
}

function resolveFieldDutyCardHelper(
  state: HubQuickActionState,
  used: boolean,
): { helperLine?: string; resultPreview?: string } {
  if (!used) {
    return {
      helperLine: 'Uygun ekibi günün riskine göre hazırlar.',
      resultPreview: undefined,
    };
  }
  if (state.fieldDuty && state.fieldDuty.day === state.day) {
    const teamName = state.fieldDuty.label.split(' — ')[0] ?? state.fieldDuty.label;
    const last = state.records
      .filter((r) => r.actionId === 'field_duty' && r.day === state.day)
      .at(-1);
    return {
      helperLine: `${teamName} hazır bekliyor.`,
      resultPreview: last?.resultLine,
    };
  }
  const last = state.records
    .filter((r) => r.actionId === 'field_duty' && r.day === state.day)
    .at(-1);
  if (last?.resultLine.includes('uygun ekip bulunamadı')) {
    return { helperLine: 'Uygun ekip yok.', resultPreview: last.resultLine };
  }
  return {
    helperLine: last?.resultLine,
    resultPreview: last?.resultLine,
  };
}

export function buildHubQuickActionCards(
  state: HubQuickActionState,
  options?: { day1Disabled?: boolean },
): HubQuickActionCardModel[] {
  return HUB_QUICK_ACTION_IDS.map((id) => {
    const def = HUB_QUICK_ACTION_DEFINITIONS[id];
    const status = resolveHubQuickActionStatus(id, state, options);
    const used = status === 'used';
    const day1Disabled = options?.day1Disabled === true;

    let statusLabel = getHubQuickActionStatusLabel(status);
    let disabledReason: string | undefined;
    let helperLine: string | undefined;
    let resultPreview: string | undefined;

    if (day1Disabled) {
      statusLabel = 'Yakında';
      disabledReason = 'Öğretici günde hızlı hamleler henüz açılmadı.';
      helperLine = disabledReason;
    } else if (id === 'field_duty') {
      const fieldDutyCard = resolveFieldDutyCardHelper(state, used);
      helperLine = fieldDutyCard.helperLine;
      resultPreview = fieldDutyCard.resultPreview;
    } else if (id === 'route_preparation') {
      const routeCard = resolveRoutePreparationCardHelper(state, used);
      helperLine = routeCard.helperLine;
      resultPreview = routeCard.resultPreview;
    } else if (id === 'neighborhood_patrol') {
      const patrolCard = resolveNeighborhoodPatrolCardHelper(state, used);
      helperLine = patrolCard.helperLine;
      resultPreview = patrolCard.resultPreview;
    } else if (id === 'social_response') {
      const socialCard = resolveSocialResponseCardHelper(state, used);
      helperLine = socialCard.helperLine;
      resultPreview = socialCard.resultPreview;
    } else if (used) {
      const last = state.records
        .filter((r) => r.actionId === id && r.day === state.day)
        .at(-1);
      helperLine = last?.resultLine;
      resultPreview = def.defaultResultLine;
    }

    return {
      id,
      title: def.title,
      subtitle: def.subtitle,
      iconName: def.iconName,
      status,
      statusLabel,
      helperLine,
      resultPreview,
      disabledReason,
      used,
    };
  });
}

export function getHubQuickActionResultToneStyle(tone: HubQuickActionTone): {
  bg: string;
  border: string;
  text: string;
} {
  switch (tone) {
    case 'positive':
      return {
        bg: '#E8F6F3',
        border: '#B8E4DC',
        text: '#1A6B5C',
      };
    case 'warning':
      return {
        bg: '#FFF4E5',
        border: '#F5D9A8',
        text: '#8A5A12',
      };
    case 'neutral':
      return {
        bg: '#F5F3EF',
        border: '#E5E1D8',
        text: '#4A4740',
      };
    default:
      return assertNever(tone);
  }
}

export function formatHubQuickActionBanner(result: HubQuickActionResult): string {
  return result.resultLine;
}

/** Gün sonu raporu — en fazla 2 kısa satır. */
export function buildHubQuickActionReportSummaryLines(
  state: HubQuickActionState | undefined,
  day: number,
): string[] {
  if (!state || state.day !== day) {
    return [];
  }

  const lines: string[] = [];

  if (state.fieldDuty?.day === day) {
    const teamName = state.fieldDuty.label.split(' — ')[0] ?? state.fieldDuty.label;
    lines.push(
      `Saha Nöbeti: ${teamName} ${state.fieldDuty.effectLabel} için hazırlandı.`,
    );
  }
  if (state.routePreparation?.day === day) {
    lines.push(
      `Rota Hazırlığı: ${state.routePreparation.targetNeighborhoodLabel} rotası öne alındı.`,
    );
  }
  if (state.neighborhoodPatrol?.day === day) {
    lines.push(
      `Mahalle Turu: ${state.neighborhoodPatrol.targetNeighborhoodLabel} için saha sinyali netleşti.`,
    );
  }
  if (state.socialResponse?.day === day) {
    const label =
      state.socialResponse.targetTopicTitle ??
      state.socialResponse.targetNeighborhoodLabel ??
      'Gündem';
    lines.push(`Sosyal Yanıt: ${label} için açıklama planlandı.`);
  }

  return lines.slice(0, 2);
}
