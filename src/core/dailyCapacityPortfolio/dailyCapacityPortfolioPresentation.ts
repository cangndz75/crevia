import { buildEcePortfolioLine } from './dailyCapacityPortfolioModel';
import type {
  DailyCapacityPortfolioResult,
  DailyCapacityPortfolioSummaryCardModel,
  OperationPortfolioCardModel,
  OperationPortfolioItem,
} from './dailyCapacityPortfolioTypes';
import { PORTFOLIO_MAX_CARD_MODELS } from './dailyCapacityPortfolioConstants';

const TITLE_MAX = 44;
const SUMMARY_MAX = 90;
const DECISION_MAX = 96;
const ACCESSIBILITY_MAX = 160;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function statusLabel(status: OperationPortfolioItem['status']): string {
  switch (status) {
    case 'selected':
      return 'Secili';
    case 'available':
      return 'Secilebilir';
    case 'deferred':
      return 'Ertelendi';
    case 'watch_only':
      return 'Izlemede';
    case 'locked':
      return 'Kilitli';
    case 'resolved':
      return 'Cozuldu';
    case 'expired':
      return 'Suresi doldu';
    default:
      return 'Durum';
  }
}

function badgeLabel(item: OperationPortfolioItem): string {
  if (item.opportunityValue === 'high' || item.kind.includes('opportunity')) return 'Firsat';
  if (item.status === 'deferred') return 'Ertelenen';
  if (item.isMapRecommended) return 'Harita';
  if (item.pressureLevel === 'high') return 'Baski';
  return 'Sinyal';
}

function toneForItem(item: OperationPortfolioItem): OperationPortfolioCardModel['tone'] {
  if (item.status === 'locked') return 'locked';
  if (item.kind.includes('opportunity')) return 'positive';
  if (item.status === 'deferred' || item.pressureLevel === 'high') return 'warning';
  return 'neutral';
}

function capacityLine(item: OperationPortfolioItem): string {
  const cost = item.capacityCost;
  const parts: string[] = [];
  if (cost.operationSlots > 0) parts.push(`${cost.operationSlots} slot`);
  if (cost.team > 0) parts.push(`${cost.team} ekip`);
  if (cost.vehicle > 0) parts.push(`${cost.vehicle} arac`);
  if (cost.resource > 0) parts.push(`${cost.resource} kaynak`);
  if (cost.social > 0) parts.push(`${cost.social} sosyal`);
  if (parts.length === 0) return 'Dusuk kapasite maliyeti';
  return `Kapasite: ${parts.join(', ')}`;
}

function decisionLine(item: OperationPortfolioItem): string {
  if (item.status === 'selected') {
    return item.selectBenefitLine ?? 'Bu operasyon bugunun ana odağı.';
  }
  if (item.status === 'deferred') {
    return item.deferRiskLine ?? 'Slot dolu; yarin tekrar degerlendir.';
  }
  if (item.status === 'watch_only') {
    return item.deferRiskLine ?? 'Bugun izlenebilir.';
  }
  return item.recommendedReason;
}

function uniqueLines(lines: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    const normalized = line.trim().toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(line);
  }
  return result;
}

export function buildDailyCapacityPortfolioSummaryCard(
  result: DailyCapacityPortfolioResult,
): DailyCapacityPortfolioSummaryCardModel {
  const { summary } = result;
  const visibleCount = result.items.filter((item) => item.visibilityLevel !== 'hidden').length;
  const title = clampLine(summary.title, TITLE_MAX);
  const summaryLine = clampLine(summary.summaryLine, SUMMARY_MAX);
  const capacityLabel = `${summary.selectedItemCount}/${summary.operationSlotLimit} slot · ${visibleCount} sinyal`;
  const itemCountLabel = `${summary.availableItemCount} secilebilir · ${summary.deferredItemCount} ertelenen`;
  const accessibilityLabel = clampLine(
    `${title}. ${summaryLine} ${capacityLabel}. ${itemCountLabel}.`,
    ACCESSIBILITY_MAX,
  );

  return {
    id: `daily_capacity_summary_day_${summary.day}`,
    title,
    summaryLine,
    capacityLabel,
    primaryTradeoffLine: summary.primaryTradeoffLine
      ? clampLine(summary.primaryTradeoffLine, SUMMARY_MAX)
      : undefined,
    itemCountLabel,
    accessibilityLabel,
  };
}

export function buildOperationPortfolioCardModels(
  result: DailyCapacityPortfolioResult,
): OperationPortfolioCardModel[] {
  const eceLine = buildEcePortfolioLine(result);
  const visible = result.items
    .filter((item) => item.visibilityLevel !== 'hidden')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, PORTFOLIO_MAX_CARD_MODELS);

  const cards: OperationPortfolioCardModel[] = [];

  for (const [index, item] of visible.entries()) {
    const title = clampLine(item.title, TITLE_MAX);
    const subtitle = item.subtitle ? clampLine(item.subtitle, SUMMARY_MAX) : undefined;
    const decision = clampLine(decisionLine(item), DECISION_MAX);
    const deferRiskLine = item.deferRiskLine ? clampLine(item.deferRiskLine, DECISION_MAX) : undefined;
    const selectBenefitLine = item.selectBenefitLine
      ? clampLine(item.selectBenefitLine, DECISION_MAX)
      : undefined;
    const mapLine = item.mapLine ? clampLine(item.mapLine, DECISION_MAX) : undefined;
    const cardEceLine = index === 0 && eceLine ? clampLine(eceLine, SUMMARY_MAX) : undefined;

    const lines = uniqueLines([decision, deferRiskLine, selectBenefitLine, mapLine, cardEceLine]);

    cards.push({
      id: item.id,
      title,
      subtitle,
      badgeLabel: badgeLabel(item),
      statusLabel: statusLabel(item.status),
      capacityLine: clampLine(capacityLine(item), DECISION_MAX),
      decisionLine: lines[0] ?? decision,
      deferRiskLine: lines.includes(deferRiskLine ?? '') ? deferRiskLine : deferRiskLine,
      selectBenefitLine,
      mapLine,
      eceLine: cardEceLine,
      tone: toneForItem(item),
      isActionable: item.isActionable,
      priority: item.priority,
      accessibilityLabel: clampLine(
        `${title}. ${statusLabel(item.status)}. ${lines[0] ?? decision}. ${capacityLine(item)}.`,
        ACCESSIBILITY_MAX,
      ),
    });
  }

  return cards;
}

export { buildEcePortfolioLine };
