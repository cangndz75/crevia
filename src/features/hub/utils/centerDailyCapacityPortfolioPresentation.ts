import {
  buildDailyCapacityPortfolio,
  buildDailyCapacityPortfolioSummaryCard,
  buildOperationPortfolioCardModels,
  type DailyCapacityPortfolioInput,
  type OperationPortfolioCardModel,
} from '@/core/dailyCapacityPortfolio';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';

import type { CenterOperationFocus } from './centerOperationFocusPresentation';
import type { CenterOperationSignals } from './centerOperationSignalsPresentation';
import type { ResourcePressureDifferentiationResult } from '@/core/resourcePressureDifferentiation';

export const CENTER_PORTFOLIO_SURFACE_MAX_ITEMS = 3;

export type CenterPortfolioTone = 'neutral' | 'positive' | 'warning' | 'locked';

export type CenterPortfolioSurfaceModel = {
  id: string;
  isVisible: boolean;
  title: string;
  summaryLine: string;
  capacityLabel: string;
  primaryTradeoffLine?: string;
  items: CenterPortfolioItemModel[];
  eceLine?: string;
  ctaLabel?: string;
  ctaRoute?: string;
  tone: CenterPortfolioTone;
  accessibilityLabel: string;
};

export type CenterPortfolioItemModel = {
  id: string;
  title: string;
  badgeLabel: string;
  statusLabel: string;
  decisionLine: string;
  deferRiskLine?: string;
  selectBenefitLine?: string;
  mapLine?: string;
  tone: CenterPortfolioTone;
  isActionable: boolean;
  ctaRoute?: string;
  accessibilityLabel: string;
};

export type BuildCenterPortfolioSurfaceInput = {
  gameState: GameState;
  day: number;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  operationFocus?: CenterOperationFocus | null;
  operationSignalsSection?: CenterOperationSignals | null;
  recommendedPlanBody?: string | null;
  resourcePressureDifferentiation?: ResourcePressureDifferentiationResult | null;
};

const TEXT_LIMITS = {
  title: 42,
  summary: 78,
  decision: 92,
  accessibility: 160,
} as const;

const SAFE_CTA_ROUTES = ['/events', '/risks'] as const;

type SafePortfolioRoute = (typeof SAFE_CTA_ROUTES)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function clampLine(value: string | undefined, max: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function normalizeLine(value: string | undefined | null): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = normalizeLine(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function makeGenericSignal(
  id: string,
  title: string,
  summary: string,
  score = 55,
): { id: string; title: string; summary: string; score: number; sourceIds: string[] } {
  return {
    id,
    title,
    summary,
    score,
    sourceIds: [id],
  };
}

function buildSocialPulseSignal(socialPulseState?: SocialPulseState | null) {
  if (!socialPulseState) return undefined;
  const raw = socialPulseState as unknown;
  if (!isRecord(raw)) return undefined;

  const score =
    typeof raw.cityMoodScore === 'number'
      ? raw.cityMoodScore
      : typeof raw.score === 'number'
        ? raw.score
        : 56;
  const title = asString(raw.title) ?? 'Sosyal nabız';
  const summary =
    asString(raw.summary) ??
    asString(raw.lastSignalLine) ??
    'Şehir tepkisi izleniyor.';

  return makeGenericSignal('hub_social_pulse', title, summary, score);
}

function buildDailyCapacityPortfolioInput(
  input: BuildCenterPortfolioSurfaceInput,
): DailyCapacityPortfolioInput {
  const rawState = input.gameState as unknown as Record<string, unknown>;
  const pilot = isRecord(rawState.pilot) ? rawState.pilot : undefined;
  const events = asArray(rawState.events);
  const activeEvents = events.filter((event) => {
    if (!isRecord(event)) return true;
    const status = asString(event.status);
    return status !== 'resolved' && status !== 'completed' && status !== 'expired';
  });

  return {
    day: input.day,
    activeEvents,
    postPilotState: pilot?.postPilotOperation,
    operationSignals: input.operationSignals ?? undefined,
    tomorrowRiskSignals: input.hubTomorrowRisk ?? undefined,
    vehicleMaintenanceSignals: input.hubVehicleMaintenanceLine
      ? makeGenericSignal(
          'hub_vehicle_maintenance',
          'Bakım uyarısı',
          input.hubVehicleMaintenanceLine,
          62,
        )
      : undefined,
    teamSpecializationSignals: input.hubTeamSpecializationLine
      ? makeGenericSignal('hub_team_specialization', 'Ekip odağı', input.hubTeamSpecializationLine, 54)
      : undefined,
    socialPulseSignals: buildSocialPulseSignal(input.socialPulseState),
  };
}

function avoidExactDuplicateTitle(title: string, avoidTitles: string[], fallback: string): string {
  const normalized = normalizeLine(title);
  if (!avoidTitles.some((line) => normalizeLine(line) === normalized)) return title;
  return fallback;
}

function lineDuplicates(line: string | undefined, avoidLines: string[]): boolean {
  const normalized = normalizeLine(line);
  return Boolean(normalized) && avoidLines.some((avoid) => normalizeLine(avoid) === normalized);
}

function routeForCard(card: OperationPortfolioCardModel): SafePortfolioRoute | undefined {
  if (!card.isActionable) return undefined;
  if (card.mapLine || card.badgeLabel === 'Harita') return '/risks';
  return '/events';
}

function routeIsSafe(route: string | undefined): route is SafePortfolioRoute {
  return SAFE_CTA_ROUTES.includes(route as SafePortfolioRoute);
}

function buildSummaryLine(input: {
  day: number;
  selectedCount: number;
  operationSlotLimit: number;
  visibleSignalCount: number;
  deferredCount: number;
  watchCount: number;
}): string {
  if (input.day <= 1) return 'Bugün ilk operasyonu takip et.';
  if (input.day < 8) {
    if (input.visibleSignalCount >= 2) {
      return `Bugünkü odak: ${input.selectedCount || 1} aktif operasyon · ${input.watchCount || 1} izlenen sinyal`;
    }
    return 'Bugünkü odak sakin; bir operasyonu netleştir.';
  }
  if (input.deferredCount > 0) {
    return `${input.selectedCount || input.operationSlotLimit} aktif odak · ${input.deferredCount} erteleme riski`;
  }
  return `Bugün ${input.operationSlotLimit} kapasite · ${input.visibleSignalCount} sinyal`;
}

function surfaceTone(cards: OperationPortfolioCardModel[]): CenterPortfolioTone {
  if (cards.some((card) => card.tone === 'warning')) return 'warning';
  if (cards.some((card) => card.tone === 'positive')) return 'positive';
  if (cards.every((card) => card.tone === 'locked')) return 'locked';
  return 'neutral';
}

function buildAvoidContext(input: BuildCenterPortfolioSurfaceInput): {
  titles: string[];
  lines: string[];
} {
  const focusItems = input.operationFocus?.items ?? [];
  const signals = input.operationSignalsSection?.signals ?? [];
  return {
    titles: uniqueStrings([
      input.operationFocus?.title,
      ...focusItems.map((item) => item.title),
      input.operationSignalsSection?.title,
      ...signals.map((signal) => signal.title),
    ]),
    lines: uniqueStrings([
      input.recommendedPlanBody,
      input.operationFocus?.helperText,
      input.operationSignalsSection?.summaryLine,
      ...focusItems.flatMap((item) => [item.title, item.subtitle]),
      ...signals.flatMap((signal) => [signal.title, signal.description, signal.helperText]),
    ]),
  };
}

function buildItem(
  card: OperationPortfolioCardModel,
  index: number,
  avoidContext: { titles: string[]; lines: string[] },
): CenterPortfolioItemModel {
  const fallbackTitle = index === 0 ? 'Günlük seçim' : `${card.badgeLabel} odağı`;
  const title = clampLine(
    avoidExactDuplicateTitle(card.title, avoidContext.titles, fallbackTitle),
    TEXT_LIMITS.title,
  ) ?? fallbackTitle;
  const route = routeForCard(card);
  const safeRoute = routeIsSafe(route) ? route : undefined;
  const fallbackDecision =
    card.statusLabel === 'İzlemede' || card.statusLabel === 'Izlemede'
      ? 'Bu sinyal bugün izlemeye bırakılabilir.'
      : 'Bu seçim bugünkü kapasiteyi etkiliyor.';
  const decisionLine = clampLine(
    lineDuplicates(card.decisionLine, avoidContext.lines) || lineDuplicates(fallbackDecision, avoidContext.lines)
      ? `${fallbackDecision} ${index + 1}. odak.`
      : card.decisionLine,
    TEXT_LIMITS.decision,
  ) ?? fallbackDecision;
  const deferRiskLine =
    normalizeLine(card.deferRiskLine) === normalizeLine(decisionLine) ||
    lineDuplicates(card.deferRiskLine, avoidContext.lines)
      ? undefined
      : clampLine(card.deferRiskLine, TEXT_LIMITS.decision);
  const selectBenefitLine =
    normalizeLine(card.selectBenefitLine) === normalizeLine(decisionLine) ||
    lineDuplicates(card.selectBenefitLine, avoidContext.lines)
      ? undefined
      : clampLine(card.selectBenefitLine, TEXT_LIMITS.decision);
  const mapLine =
    normalizeLine(card.mapLine) === normalizeLine(decisionLine) ||
    lineDuplicates(card.mapLine, avoidContext.lines)
      ? undefined
      : clampLine(card.mapLine, TEXT_LIMITS.decision);

  return {
    id: card.id,
    title,
    badgeLabel: clampLine(card.badgeLabel, 18) ?? 'Sinyal',
    statusLabel: clampLine(card.statusLabel, 22) ?? 'Durum',
    decisionLine,
    deferRiskLine,
    selectBenefitLine,
    mapLine,
    tone: card.tone,
    isActionable: Boolean(card.isActionable && safeRoute),
    ctaRoute: safeRoute,
    accessibilityLabel:
      clampLine(`${title}. ${card.statusLabel}. ${decisionLine}.`, TEXT_LIMITS.accessibility) ??
      title,
  };
}

export function buildCenterPortfolioSurface(
  input: BuildCenterPortfolioSurfaceInput,
): CenterPortfolioSurfaceModel {
  const portfolioInput = buildDailyCapacityPortfolioInput(input);
  const result = buildDailyCapacityPortfolio(portfolioInput);
  const summary = buildDailyCapacityPortfolioSummaryCard(result);
  const cardLimit = input.day <= 1 ? 1 : CENTER_PORTFOLIO_SURFACE_MAX_ITEMS;
  const visibleCards = buildOperationPortfolioCardModels(result, {
    resourcePressureDifferentiation: input.resourcePressureDifferentiation,
  }).slice(0, cardLimit);
  const visibleSignalCount = result.items.filter((item) => item.visibilityLevel !== 'hidden').length;
  const selectedCount = result.selectedItems.filter((item) => item.visibilityLevel !== 'hidden').length;
  const deferredCount = result.deferredItems.filter((item) => item.visibilityLevel !== 'hidden').length;
  const watchCount = result.watchOnlyItems.filter((item) => item.visibilityLevel !== 'hidden').length;

  const isVisible =
    input.day <= 1
      ? false
      : input.day < 8
        ? visibleCards.length >= 2
        : visibleCards.length > 0;

  const avoidContext = buildAvoidContext(input);
  const items: CenterPortfolioItemModel[] = [];
  if (isVisible) {
    for (const [index, card] of visibleCards.entries()) {
      const item = buildItem(card, index, avoidContext);
      items.push(item);
      avoidContext.titles.push(item.title);
      avoidContext.lines.push(item.decisionLine);
      if (item.deferRiskLine) avoidContext.lines.push(item.deferRiskLine);
      if (item.selectBenefitLine) avoidContext.lines.push(item.selectBenefitLine);
      if (item.mapLine) avoidContext.lines.push(item.mapLine);
    }
  }
  const actionable = items.find((item) => item.isActionable && item.ctaRoute);
  const eceLine =
    isVisible && result.ecePortfolioLine && !lineDuplicates(result.ecePortfolioLine, avoidContext.lines)
      ? clampLine(result.ecePortfolioLine, TEXT_LIMITS.summary)
      : undefined;

  const title = input.day < 8 ? 'Bugünkü odak' : 'Kapasite seçimi';
  const summaryLine = buildSummaryLine({
    day: input.day,
    selectedCount,
    operationSlotLimit: result.summary.operationSlotLimit,
    visibleSignalCount,
    deferredCount,
    watchCount,
  });

  return {
    id: `center_portfolio_surface_day_${input.day}`,
    isVisible,
    title,
    summaryLine: clampLine(summaryLine, TEXT_LIMITS.summary) ?? summary.summaryLine,
    capacityLabel:
      input.day >= 8
        ? `${result.summary.operationSlotLimit} kapasite · ${visibleSignalCount} sinyal`
        : summary.capacityLabel,
    primaryTradeoffLine: clampLine(result.primaryTradeoffLine, TEXT_LIMITS.summary),
    items,
    eceLine,
    ctaLabel: actionable ? (actionable.ctaRoute === '/risks' ? 'Haritada Gör' : 'Operasyonları Aç') : undefined,
    ctaRoute: actionable?.ctaRoute,
    tone: surfaceTone(visibleCards),
    accessibilityLabel:
      clampLine(`${title}. ${summaryLine}. ${summary.capacityLabel}.`, TEXT_LIMITS.accessibility) ??
      title,
  };
}

export function centerPortfolioSurfaceCoreFieldsValid(surface: CenterPortfolioSurfaceModel): boolean {
  if (!surface.id || !surface.title || !surface.summaryLine || !surface.capacityLabel) return false;
  if (!surface.accessibilityLabel.trim()) return false;
  return surface.items.every(
    (item) =>
      Boolean(item.id) &&
      Boolean(item.title) &&
      Boolean(item.badgeLabel) &&
      Boolean(item.statusLabel) &&
      Boolean(item.decisionLine) &&
      Boolean(item.accessibilityLabel),
  );
}

export function centerPortfolioSurfaceMaxItems(surface: CenterPortfolioSurfaceModel, day: number): boolean {
  const max = day <= 1 ? 1 : CENTER_PORTFOLIO_SURFACE_MAX_ITEMS;
  return surface.items.length <= max;
}

export function centerPortfolioSurfaceDay1LowNoise(surface: CenterPortfolioSurfaceModel): boolean {
  return !surface.isVisible || surface.items.length <= 1;
}

export function centerPortfolioSurfaceDay8Visible(surface: CenterPortfolioSurfaceModel): boolean {
  return surface.isVisible && surface.items.length > 0 && surface.summaryLine.trim().length > 0;
}

export function centerPortfolioSurfaceCtaRouteSafe(surface: CenterPortfolioSurfaceModel): boolean {
  const surfaceRouteSafe = !surface.ctaRoute || routeIsSafe(surface.ctaRoute);
  const itemRoutesSafe = surface.items.every(
    (item) => (!item.isActionable && !item.ctaRoute) || routeIsSafe(item.ctaRoute),
  );
  return surfaceRouteSafe && itemRoutesSafe;
}

export function centerPortfolioSurfaceEceLineMaxOne(surface: CenterPortfolioSurfaceModel): boolean {
  const count = [surface.eceLine, ...surface.items.map((item) => undefined)].filter(Boolean).length;
  return count <= 1;
}

export function centerPortfolioSurfaceNoDuplicateExactLines(surface: CenterPortfolioSurfaceModel): boolean {
  const lines = [
    surface.title,
    surface.summaryLine,
    surface.primaryTradeoffLine,
    surface.eceLine,
    ...surface.items.flatMap((item) => [
      item.title,
      item.decisionLine,
      item.deferRiskLine,
      item.selectBenefitLine,
      item.mapLine,
    ]),
  ]
    .map(normalizeLine)
    .filter(Boolean);
  return new Set(lines).size === lines.length;
}

export function centerPortfolioSurfaceNoTechnicalEnums(surface: CenterPortfolioSurfaceModel): boolean {
  const text = [
    surface.title,
    surface.summaryLine,
    surface.capacityLabel,
    surface.primaryTradeoffLine,
    surface.eceLine,
    ...surface.items.flatMap((item) => [
      item.title,
      item.badgeLabel,
      item.statusLabel,
      item.decisionLine,
      item.deferRiskLine,
      item.selectBenefitLine,
      item.mapLine,
    ]),
  ].join(' ');
  return !/(operation_slots|post_pilot|daily_capacity|watch_only|resource_pressure|route_pressure|sourceIds)/i.test(
    text,
  );
}

export function centerPortfolioSurfaceNoDuplicateWithFocusSignals(
  surface: CenterPortfolioSurfaceModel,
  focus?: CenterOperationFocus | null,
  signals?: CenterOperationSignals | null,
): boolean {
  const avoidTitles = new Set(
    [
      focus?.title,
      ...(focus?.items.map((item) => item.title) ?? []),
      signals?.title,
      ...(signals?.signals.map((signal) => signal.title) ?? []),
    ]
      .map(normalizeLine)
      .filter(Boolean),
  );
  return surface.items.every((item) => !avoidTitles.has(normalizeLine(item.title)));
}

export function centerPortfolioSurfaceSmallScreenGuardsSource(source: string): boolean {
  return (
    source.includes('minWidth: 0') &&
    source.includes('flexShrink') &&
    source.includes('numberOfLines') &&
    source.includes('ellipsizeMode')
  );
}
