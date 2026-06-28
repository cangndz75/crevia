import type { DailyCapacityPortfolioResult } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { ResourcePressureDifferentiationResult } from '@/core/resourcePressureDifferentiation';

import type { OperationPortfolioOutcomePreviewPresentation } from './operationPortfolioTypes';

const PREVIEW_CHIP_MAX = 3;

function clampLine(value: string, max = 72): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function deriveTonePreview(input: {
  day: number;
  deferredCount: number;
  riskyCount: number;
  resourceHigh: boolean;
}): string {
  if (input.day <= 1) return 'İlk operasyon güveni şekillendirir.';
  if (input.deferredCount > 0 && input.riskyCount > 0) {
    return 'Yarına risk kalabilir; kaynak korunurken müdahale yavaşlayabilir.';
  }
  if (input.deferredCount > 0) return 'Yarına risk kaldı; öncelik doğru seçilmezse baskı büyür.';
  if (input.resourceHigh) return 'Kaynak korunurken bazı müdahaleler yavaşlayabilir.';
  if (input.riskyCount === 0) return 'Dengeli portföy gün sonunu sakin kapatabilir.';
  return 'Bugünkü sıra yarının şehir tonunu belirler.';
}

export function buildOperationPortfolioOutcomePreview(input: {
  day: number;
  portfolio: DailyCapacityPortfolioResult;
  resourcePressure?: ResourcePressureDifferentiationResult | null;
  playerStyleLabel?: string | null;
}): OperationPortfolioOutcomePreviewPresentation {
  if (input.day <= 1) {
    return {
      visible: false,
      tonePreview: '',
      chips: [],
      balanceRatio: 0.5,
      balanceLeftLabel: 'Güven',
      balanceRightLabel: 'Kaynak',
    };
  }

  const visibleItems = input.portfolio.items.filter((item) => item.visibilityLevel !== 'hidden');
  const deferredCount = input.portfolio.deferredItems.length;
  const riskyCount = visibleItems.filter((item) => item.pressureLevel === 'high').length;
  const resourceHigh =
    input.resourcePressure?.primaryProfile?.intensity === 'high' ||
    (input.resourcePressure?.profiles.some((profile) => profile.intensity === 'high') ?? false) ||
    visibleItems.some((item) => item.deferRisk === 'resource_cost_may_rise');

  const chips = [];
  const trustRisk = visibleItems.some(
    (item) => item.deferRisk === 'trust_may_drop' || item.kind === 'district_pressure',
  );
  chips.push({
    id: 'preview_trust',
    label: trustRisk ? 'Güven baskısı' : 'Güven dengeli',
    tone: trustRisk ? ('warning' as const) : ('teal' as const),
  });

  chips.push({
    id: 'preview_resource',
    label: resourceHigh ? 'Kaynak baskısı' : 'Kaynak kontrollü',
    tone: resourceHigh ? ('amber' as const) : ('sage' as const),
  });

  const maintenanceRisk = visibleItems.some(
    (item) => item.kind === 'maintenance_warning' || item.deferRisk === 'route_may_strain',
  );
  chips.push({
    id: 'preview_readiness',
    label: maintenanceRisk ? 'Bakım riski' : 'Hazırlık iyi',
    tone: maintenanceRisk ? ('warning' as const) : ('teal' as const),
  });

  const socialRisk = visibleItems.some((item) => item.deferRisk === 'social_reaction_may_grow');
  const tomorrowRisk = deferredCount > 0 || riskyCount >= 2;
  const balanceRatio = tomorrowRisk ? 0.62 : resourceHigh ? 0.48 : 0.38;

  const extraChips = [];
  if (input.day >= 8 && socialRisk) {
    extraChips.push({
      id: 'preview_patience',
      label: 'Mahalle sabrı',
      tone: 'amber' as const,
    });
  }
  if (input.day >= 8 && tomorrowRisk) {
    extraChips.push({
      id: 'preview_tomorrow',
      label: 'Yarın riski',
      tone: 'warning' as const,
    });
  }

  const merged = [...chips, ...extraChips].slice(0, PREVIEW_CHIP_MAX);

  return {
    visible: input.day >= 8,
    tonePreview: clampLine(
      deriveTonePreview({ day: input.day, deferredCount, riskyCount, resourceHigh }),
    ),
    chips: merged,
    balanceRatio,
    balanceLeftLabel: 'Güven',
    balanceRightLabel: tomorrowRisk ? 'Yarın riski' : 'Kaynak baskısı',
  };
}
