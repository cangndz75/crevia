import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import type { GameState } from '@/core/models/GameState';
import type {
  OperationDomainSignal,
  OperationSignalsState,
} from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import { buildHubSocialPulseModel } from '@/features/social/utils/socialHubModel';

import type { CenterActiveTarget, CenterActiveTargetDomain } from './centerActiveTargetPresentation';
import type { CenterAdvisorSuggestion } from './centerAdvisorPresentation';
import type { CenterCitySummary } from './centerCitySummaryPresentation';
import type { CenterDailyReward } from './centerDailyRewardPresentation';
import type { CenterHeaderSummary } from './centerHeaderPresentation';
import type { CenterOperationDomain } from './centerOperationFocusPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';

export const CENTER_OPERATION_SIGNALS_MAX = 3;
export const CENTER_OPERATION_SIGNALS_PREFERRED = 2;

export type CenterOperationSignalSeverity = 'low' | 'medium' | 'high' | 'urgent';

export type CenterOperationSignalTone =
  | 'success'
  | 'stable'
  | 'warning'
  | 'urgent'
  | 'neutral';

export type CenterOperationSignalPriority = 'low' | 'normal' | 'high' | 'urgent';

export type CenterOperationSignalType =
  | 'rising_demand'
  | 'risk'
  | 'opportunity'
  | 'resource_pressure'
  | 'social_reaction'
  | 'tomorrow_risk'
  | 'maintenance_warning'
  | 'team_warning'
  | 'calm';

export type CenterOperationSignalActionKey =
  | 'view_signal'
  | 'view_operations'
  | 'view_map'
  | 'view_report'
  | 'none';

export type CenterOperationSignalItem = {
  id: string;
  title: string;
  description: string;
  domain: CenterOperationDomain;
  signalType: CenterOperationSignalType;
  severity: CenterOperationSignalSeverity;
  tone: CenterOperationSignalTone;
  priority: CenterOperationSignalPriority;
  iconKey: string;
  sourceLabel: string;
  sourceIds: string[];
  helperText?: string;
  route?: string;
  actionKey?: CenterOperationSignalActionKey;
  isLinkedToActiveTarget?: boolean;
  motionHint?: {
    attentionLevel: 'none' | 'soft' | 'medium';
    shouldHighlight: boolean;
  };
};

export type CenterOperationSignalsCtaActionKey =
  | 'view_all_signals'
  | 'view_operations'
  | 'none';

export type CenterOperationSignalsCta = {
  label: string;
  route?: string;
  actionKey: CenterOperationSignalsCtaActionKey;
  enabled: boolean;
};

export type CenterOperationSignalsDisplayMode =
  | 'compact'
  | 'list'
  | 'empty'
  | 'locked';

export type CenterOperationSignalsMotionHint = {
  revealLevel: 'none' | 'soft';
  shouldUseStagger: boolean;
};

export type CenterOperationSignals = {
  visibility: CenterHomeVisibilityState;
  title: string;
  subtitle?: string;
  signals: CenterOperationSignalItem[];
  displayMode: CenterOperationSignalsDisplayMode;
  summaryLine?: string;
  cta?: CenterOperationSignalsCta;
  motionHint?: CenterOperationSignalsMotionHint;
  accessibilityLabel: string;
  /** Geriye dönük section empty metni */
  emptyLabel: string | null;
  showViewAll: boolean;
};

export type BuildCenterOperationSignalsInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  advisorSuggestion?: CenterAdvisorSuggestion | null;
  citySummary?: CenterCitySummary | null;
  dailyReward?: CenterDailyReward | null;
  headerSummary?: CenterHeaderSummary | null;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubImpactExplanationLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  operationFocusTitles?: string[];
  cardVisibility?: HubCardVisibilityModel;
};

const FOCUS_DOMAIN_TITLES = [
  'Ulaşım',
  'Çevre',
  'Enerji',
  'Sosyal Nabız',
  'Lojistik',
  'Bakım',
  'Genel Durum',
];

const ALLOWED_DISPLAY_MODES: CenterOperationSignalsDisplayMode[] = [
  'compact',
  'list',
  'empty',
  'locked',
];

const ALLOWED_SIGNAL_TYPES: CenterOperationSignalType[] = [
  'rising_demand',
  'risk',
  'opportunity',
  'resource_pressure',
  'social_reaction',
  'tomorrow_risk',
  'maintenance_warning',
  'team_warning',
  'calm',
];

type DraftSignal = {
  id: string;
  title: string;
  description: string;
  domain: CenterOperationDomain;
  signalType: CenterOperationSignalType;
  severity: CenterOperationSignalSeverity;
  tone: CenterOperationSignalTone;
  priority: CenterOperationSignalPriority;
  iconKey: string;
  sourceLabel: string;
  sourceIds: string[];
  helperText?: string;
  route?: string;
  actionKey?: CenterOperationSignalActionKey;
  isLinkedToActiveTarget?: boolean;
  sortScore: number;
};

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function resolveDomainFromSignal(domain: OperationDomainSignal['domain']): CenterOperationDomain {
  switch (domain) {
    case 'vehicles':
      return 'transport';
    case 'containers':
      return 'environment';
    case 'personnel':
      return 'energy';
    case 'districts':
      return 'logistics';
    default:
      return 'general';
  }
}

function statusToSeverity(status: OperationDomainSignal['status']): CenterOperationSignalSeverity {
  switch (status) {
    case 'critical':
      return 'urgent';
    case 'strained':
      return 'high';
    case 'watch':
      return 'medium';
    default:
      return 'low';
  }
}

function statusToPriority(status: OperationDomainSignal['status']): CenterOperationSignalPriority {
  switch (status) {
    case 'critical':
      return 'urgent';
    case 'strained':
      return 'high';
    case 'watch':
      return 'normal';
    default:
      return 'low';
  }
}

function statusToTone(status: OperationDomainSignal['status']): CenterOperationSignalTone {
  switch (status) {
    case 'critical':
      return 'urgent';
    case 'strained':
      return 'warning';
    case 'watch':
      return 'stable';
    default:
      return 'neutral';
  }
}

function domainSignalTitle(
  domain: CenterOperationDomain,
  status: OperationDomainSignal['status'],
): string {
  if (domain === 'transport') {
    return status === 'critical' ? 'Rota baskısı kritik' : 'Rota baskısı artıyor';
  }
  if (domain === 'environment') {
    return status === 'critical' ? 'Toplama baskısı kritik' : 'Toplama baskısı artıyor';
  }
  if (domain === 'energy') {
    return 'Kaynak baskısı oluşuyor';
  }
  if (domain === 'logistics') {
    return 'Mahalle talebi artıyor';
  }
  if (domain === 'social') {
    return 'Sosyal tepki hassas';
  }
  if (domain === 'maintenance') {
    return 'Bakım riski oluşuyor';
  }
  return status === 'critical' ? 'Operasyon dengesi zayıflıyor' : 'Operasyon baskısı izleniyor';
}

function domainSignalDescription(domain: CenterOperationDomain): string {
  switch (domain) {
    case 'transport':
      return 'Ulaşım alanında yoğunluk izleniyor.';
    case 'environment':
      return 'Çevre toplama düzeninde baskı var.';
    case 'energy':
      return 'Kaynak akışında denge izleniyor.';
    case 'logistics':
      return 'Mahalle hizmet talebi yükseliyor.';
    case 'social':
      return 'Vatandaş memnuniyeti karar etkisine duyarlı.';
    case 'maintenance':
      return 'Araç yorgunluğu rota performansını etkileyebilir.';
    default:
      return 'Genel operasyon dengesi takip ediliyor.';
  }
}

function domainIcon(domain: CenterOperationDomain): string {
  switch (domain) {
    case 'transport':
      return 'bus-outline';
    case 'environment':
      return 'leaf-outline';
    case 'energy':
      return 'flash-outline';
    case 'social':
      return 'people-outline';
    case 'logistics':
      return 'cube-outline';
    case 'maintenance':
      return 'construct-outline';
    default:
      return 'pulse-outline';
  }
}

function signalTypeForDomain(
  domain: CenterOperationDomain,
  status: OperationDomainSignal['status'],
): CenterOperationSignalType {
  if (status === 'critical' || status === 'strained') {
    return domain === 'transport' ? 'rising_demand' : 'risk';
  }
  if (status === 'watch') {
    return 'resource_pressure';
  }
  return 'calm';
}

function collectDedupeLines(input: BuildCenterOperationSignalsInput): string[] {
  const lines: string[] = [];
  const target = input.activeTarget;
  if (target.title) lines.push(target.title);
  if (target.description) lines.push(target.description);
  if (target.helperText) lines.push(target.helperText);
  if (input.advisorSuggestion?.recommendation) {
    lines.push(input.advisorSuggestion.recommendation);
  }
  if (input.advisorSuggestion?.contextLine) {
    lines.push(input.advisorSuggestion.contextLine);
  }
  if (input.citySummary?.primaryInsight?.text) {
    lines.push(input.citySummary.primaryInsight.text);
  }
  if (input.dailyReward?.helperText) {
    lines.push(input.dailyReward.helperText);
  }
  const notification = input.headerSummary?.notification;
  if (notification?.label) lines.push(notification.label);
  lines.push(...FOCUS_DOMAIN_TITLES);
  lines.push(...(input.operationFocusTitles ?? []));
  return lines;
}

function textIsSafe(text: string, avoid: string[]): boolean {
  return !avoid.some((line) => linesAreDuplicate(text, line));
}

function dedupeText(text: string, avoid: string[], fallback: string): string {
  const trimmed = text.trim();
  if (!trimmed || !textIsSafe(trimmed, avoid)) return fallback;
  return trimmed;
}

function shorten(text: string, max = 72): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function isTitleFocusDomain(title: string): boolean {
  return FOCUS_DOMAIN_TITLES.some((domainTitle) => linesAreDuplicate(title, domainTitle));
}

function finalizeTitle(title: string, domain: CenterOperationDomain, status?: OperationDomainSignal['status']): string {
  if (!isTitleFocusDomain(title)) return title;
  return domainSignalTitle(domain, status ?? 'watch');
}

function mergeDrafts(drafts: DraftSignal[], incoming: DraftSignal): void {
  const sameId = drafts.findIndex((d) => d.sourceIds.some((id) => incoming.sourceIds.includes(id)));
  if (sameId >= 0) {
    const existing = drafts[sameId]!;
    if (incoming.sortScore > existing.sortScore) {
      drafts[sameId] = incoming;
    }
    return;
  }

  const sameDomain = drafts.findIndex(
    (d) => d.domain === incoming.domain && d.signalType !== 'calm',
  );
  if (sameDomain >= 0) {
    const existing = drafts[sameDomain]!;
    if (incoming.sortScore > existing.sortScore) {
      drafts[sameDomain] = incoming;
    }
    return;
  }

  drafts.push(incoming);
}

function buildFromRuntimeSignal(
  signal: OperationDomainSignal,
  activeDomain: CenterActiveTargetDomain,
  dedupeLines: string[],
): DraftSignal | null {
  if (signal.status === 'stable') return null;

  const domain = resolveDomainFromSignal(signal.domain);
  const linked = domain === activeDomain && activeDomain !== 'general';
  const title = finalizeTitle(
    dedupeText(signal.title, dedupeLines, domainSignalTitle(domain, signal.status)),
    domain,
    signal.status,
  );
  const description = dedupeText(
    signal.summary,
    dedupeLines,
    domainSignalDescription(domain),
  );

  const priority = statusToPriority(signal.status);
  const sortScore =
    (priority === 'urgent' ? 1000 : priority === 'high' ? 700 : 300) +
    signal.score +
    (linked ? 500 : 0);

  return {
    id: `signal-runtime-${signal.domain}`,
    title,
    description: shorten(description),
    domain,
    signalType: signalTypeForDomain(domain, signal.status),
    severity: statusToSeverity(signal.status),
    tone: statusToTone(signal.status),
    priority,
    iconKey: domainIcon(domain),
    sourceLabel: 'Operasyon sinyali',
    sourceIds: [`runtime.${signal.domain}`],
    helperText: linked ? 'Aktif hedefle bağlantılı.' : 'Hızlı müdahale faydalı olabilir.',
    route: '/events',
    actionKey: 'view_operations',
    isLinkedToActiveTarget: linked,
    sortScore,
  };
}

function buildDay1Signals(): CenterOperationSignals {
  const signal: CenterOperationSignalItem = {
    id: 'signal-day1-ready',
    title: 'İlk sinyal hazır',
    description: 'İlk olayı inceledikçe risk ve fırsat kartları açılır.',
    domain: 'general',
    signalType: 'calm',
    severity: 'low',
    tone: 'stable',
    priority: 'low',
    iconKey: 'flag-outline',
    sourceLabel: 'Giriş',
    sourceIds: ['day1.intro'],
    helperText: 'Önce ilk olayı incele.',
    actionKey: 'view_operations',
    route: '/events',
    motionHint: { attentionLevel: 'none', shouldHighlight: false },
  };

  return {
    visibility: 'visible',
    title: 'Operasyon Sinyalleri',
    subtitle: 'İlk olayla açılır',
    signals: [signal],
    displayMode: 'compact',
    summaryLine: 'Sinyaller ilk operasyonla netleşir.',
    accessibilityLabel: 'Operasyon sinyalleri. İlk sinyal hazır.',
    emptyLabel: null,
    showViewAll: false,
    motionHint: { revealLevel: 'none', shouldUseStagger: false },
  };
}

function buildEmptySignals(hasActiveTarget: boolean): CenterOperationSignals {
  const signal: CenterOperationSignalItem = {
    id: 'signal-empty-calm',
    title: 'Bugün kritik sinyal yok',
    description: 'Operasyon alanları dengede görünüyor.',
    domain: 'general',
    signalType: 'calm',
    severity: 'low',
    tone: 'neutral',
    priority: 'low',
    iconKey: 'checkmark-circle-outline',
    sourceLabel: 'Genel',
    sourceIds: ['empty.calm'],
    helperText: hasActiveTarget ? 'Aktif hedefe odaklan.' : undefined,
    actionKey: 'none',
    motionHint: { attentionLevel: 'none', shouldHighlight: false },
  };

  return {
    visibility: 'empty',
    title: 'Operasyon Sinyalleri',
    subtitle: 'Sakin gün',
    signals: [signal],
    displayMode: 'empty',
    summaryLine: 'Yeni sinyal bekleniyor.',
    accessibilityLabel: 'Operasyon sinyalleri. Bugün kritik sinyal yok.',
    emptyLabel: 'Bugün kritik sinyal yok',
    showViewAll: false,
    motionHint: { revealLevel: 'soft', shouldUseStagger: false },
  };
}

function draftToItem(draft: DraftSignal): CenterOperationSignalItem {
  const shouldHighlight =
    draft.isLinkedToActiveTarget ||
    draft.priority === 'urgent' ||
    draft.priority === 'high';

  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    domain: draft.domain,
    signalType: draft.signalType,
    severity: draft.severity,
    tone: draft.tone,
    priority: draft.priority,
    iconKey: draft.iconKey,
    sourceLabel: draft.sourceLabel,
    sourceIds: draft.sourceIds,
    helperText: draft.helperText,
    route: draft.route,
    actionKey: draft.actionKey,
    isLinkedToActiveTarget: draft.isLinkedToActiveTarget,
    motionHint: {
      shouldHighlight,
      attentionLevel:
        draft.priority === 'urgent'
          ? 'medium'
          : shouldHighlight
            ? 'soft'
            : 'none',
    },
  };
}

export function buildCenterOperationSignals(
  input: BuildCenterOperationSignalsInput,
): CenterOperationSignals {
  const day = input.day > 0 ? input.day : 1;

  if (input.cardVisibility?.showOperationSignals === 'hidden') {
    return {
      visibility: 'hidden',
      title: 'Operasyon Sinyalleri',
      signals: [],
      displayMode: 'compact',
      accessibilityLabel: 'Operasyon sinyalleri gizli.',
      emptyLabel: null,
      showViewAll: false,
    };
  }

  if (day <= 1) {
    return buildDay1Signals();
  }

  const dedupeLines = collectDedupeLines(input);
  const drafts: DraftSignal[] = [];
  const activeDomain = input.activeTarget.domain;
  const runtime = input.operationSignals;

  if (runtime) {
    for (const signal of [
      runtime.vehicles,
      runtime.containers,
      runtime.personnel,
      runtime.districts,
      runtime.overall,
    ]) {
      const draft = buildFromRuntimeSignal(signal, activeDomain, dedupeLines);
      if (draft) mergeDrafts(drafts, draft);
    }
  }

  const tomorrow = input.hubTomorrowRisk;
  if (tomorrow?.mainLine?.trim() && tomorrow.shouldShowInHub !== false) {
    const priority: CenterOperationSignalPriority =
      tomorrow.priority === 'high'
        ? 'urgent'
        : tomorrow.priority === 'low'
          ? 'normal'
          : 'high';
    const title = dedupeText(
      tomorrow.title?.trim() || 'Yarın riski yükselebilir',
      dedupeLines,
      'Yarın riski yükselebilir',
    );
    const description = dedupeText(
      tomorrow.mainLine,
      dedupeLines,
      'Bugünkü karar yarınki kaynak baskısını etkileyebilir.',
    );
    mergeDrafts(drafts, {
      id: 'signal-tomorrow-risk',
      title: finalizeTitle(title, 'general'),
      description: shorten(description),
      domain: 'general',
      signalType: 'tomorrow_risk',
      severity: priority === 'urgent' ? 'urgent' : 'high',
      tone: priority === 'urgent' ? 'urgent' : 'warning',
      priority,
      iconKey: 'trending-up-outline',
      sourceLabel: 'Yarın riski',
      sourceIds: [`tomorrow.${tomorrow.id ?? 'risk'}`],
      helperText: 'Sonuç ekranında takip et.',
      route: '/reports',
      actionKey: 'view_report',
      sortScore: priority === 'urgent' ? 900 : 650,
    });
  }

  const social = buildHubSocialPulseModel(input.socialPulseState, day);
  if (social.statusTone === 'caution' || social.statusTone === 'crisis') {
    const priority: CenterOperationSignalPriority =
      social.statusTone === 'crisis' ? 'urgent' : 'high';
    mergeDrafts(drafts, {
      id: 'signal-social-reaction',
      title: 'Sosyal tepki hassas',
      description: dedupeText(
        social.signalLine,
        dedupeLines,
        'Vatandaş memnuniyeti karar etkisine duyarlı.',
      ),
      domain: 'social',
      signalType: 'social_reaction',
      severity: priority === 'urgent' ? 'urgent' : 'high',
      tone: priority === 'urgent' ? 'urgent' : 'warning',
      priority,
      iconKey: 'people-outline',
      sourceLabel: 'Sosyal nabız',
      sourceIds: ['social.pulse'],
      helperText: 'Dengeli plan önerilir.',
      route: '/events',
      actionKey: 'view_operations',
      isLinkedToActiveTarget: activeDomain === 'social',
      sortScore: priority === 'urgent' ? 850 : 600,
    });
  }

  if (input.hubVehicleMaintenanceLine?.trim()) {
    const description = dedupeText(
      input.hubVehicleMaintenanceLine,
      dedupeLines,
      'Araç yorgunluğu rota performansını etkileyebilir.',
    );
    mergeDrafts(drafts, {
      id: 'signal-maintenance',
      title: 'Bakım riski oluşuyor',
      description: shorten(description),
      domain: 'maintenance',
      signalType: 'maintenance_warning',
      severity: 'medium',
      tone: 'warning',
      priority: 'normal',
      iconKey: 'construct-outline',
      sourceLabel: 'Bakım',
      sourceIds: ['maintenance.line'],
      helperText: 'Yönlendirmeden önce kontrol et.',
      route: '/events',
      actionKey: 'view_operations',
      isLinkedToActiveTarget: activeDomain === 'transport',
      sortScore: 520,
    });
  }

  if (input.hubTeamSpecializationLine?.trim()) {
    const description = dedupeText(
      input.hubTeamSpecializationLine,
      dedupeLines,
      'Ekip yorgunluğu operasyon temposunu etkileyebilir.',
    );
    mergeDrafts(drafts, {
      id: 'signal-team-warning',
      title: 'Ekip yorgunluğu izleniyor',
      description: shorten(description),
      domain: 'energy',
      signalType: 'team_warning',
      severity: 'medium',
      tone: 'warning',
      priority: 'normal',
      iconKey: 'people-circle-outline',
      sourceLabel: 'Ekip',
      sourceIds: ['team.line'],
      helperText: 'Ekip dağılımını gözden geçir.',
      route: '/events',
      actionKey: 'view_operations',
      sortScore: 480,
    });
  }

  const impact = input.hubImpactExplanationLine?.trim();
  if (impact && textIsSafe(impact, dedupeLines)) {
    mergeDrafts(drafts, {
      id: 'signal-city-echo',
      title: 'Şehir yankısı oluşuyor',
      description: shorten(impact),
      domain: 'general',
      signalType: 'resource_pressure',
      severity: 'medium',
      tone: 'warning',
      priority: 'normal',
      iconKey: 'flash-outline',
      sourceLabel: 'Şehir yankısı',
      sourceIds: ['city.echo'],
      helperText: 'Karar etkisini takip et.',
      route: '/events',
      actionKey: 'view_signal',
      sortScore: 420,
    });
  }

  const riskMetric = input.citySummary?.metrics.find((m) => m.id === 'risk');
  if (riskMetric && (riskMetric.tone === 'warning' || riskMetric.tone === 'urgent')) {
    const priority: CenterOperationSignalPriority =
      riskMetric.tone === 'urgent' ? 'high' : 'normal';
    mergeDrafts(drafts, {
      id: 'signal-city-risk',
      title: 'Kaynak baskısı izleniyor',
      description: dedupeText(
        riskMetric.helperText ?? riskMetric.valueText,
        dedupeLines,
        'Merkez özeti risk metriği yükseldi.',
      ),
      domain: 'logistics',
      signalType: 'resource_pressure',
      severity: riskMetric.tone === 'urgent' ? 'high' : 'medium',
      tone: riskMetric.tone === 'urgent' ? 'warning' : 'stable',
      priority,
      iconKey: 'alert-circle-outline',
      sourceLabel: 'Merkez özeti',
      sourceIds: ['city.risk'],
      helperText: 'Planı buna göre ayarla.',
      route: '/events',
      actionKey: 'view_operations',
      sortScore: 380,
    });
  }

  if (drafts.length === 0) {
    return buildEmptySignals(input.activeTarget.visibility === 'visible');
  }

  const maxSignals =
    input.cardVisibility?.showOperationSignals === 'compact'
      ? CENTER_OPERATION_SIGNALS_PREFERRED
      : CENTER_OPERATION_SIGNALS_MAX;

  const sorted = [...drafts].sort((a, b) => b.sortScore - a.sortScore);
  const trimmed = sorted.slice(0, maxSignals).map(draftToItem);

  return {
    visibility: 'visible',
    title: 'Operasyon Sinyalleri',
    subtitle: 'Bugünkü saha sinyalleri',
    signals: trimmed,
    displayMode: trimmed.length <= 2 ? 'compact' : 'list',
    summaryLine:
      trimmed.length === 1
        ? '1 aktif sinyal izleniyor.'
        : `${trimmed.length} aktif sinyal izleniyor.`,
    cta: {
      label: 'Tümünü Gör',
      route: '/events',
      actionKey: 'view_all_signals',
      enabled: sorted.length > maxSignals,
    },
    motionHint: {
      revealLevel: 'soft',
      shouldUseStagger: trimmed.length >= 2,
    },
    accessibilityLabel: `Operasyon sinyalleri. ${trimmed.length} sinyal.`,
    emptyLabel: null,
    showViewAll: sorted.length > maxSignals,
  };
}

export function centerOperationSignalsDedupeText(section: CenterOperationSignals): string {
  return section.signals
    .map((s) => [s.title, s.description, s.helperText].filter(Boolean).join(' '))
    .join(' ');
}

export function centerOperationSignalsCoreFieldsValid(
  section: CenterOperationSignals,
): boolean {
  if (!section.title.trim()) return false;
  if (!section.accessibilityLabel.trim()) return false;
  if (!ALLOWED_DISPLAY_MODES.includes(section.displayMode)) return false;
  return section.signals.every(
    (signal) =>
      signal.title.trim().length > 0 &&
      signal.description.trim().length > 0 &&
      ALLOWED_SIGNAL_TYPES.includes(signal.signalType),
  );
}

export function centerOperationSignalsMaxItems(section: CenterOperationSignals): boolean {
  return section.signals.length <= CENTER_OPERATION_SIGNALS_MAX;
}

export function centerOperationSignalsUniqueSourceIds(
  section: CenterOperationSignals,
): boolean {
  const ids = section.signals.flatMap((s) => s.sourceIds);
  return new Set(ids).size === ids.length;
}

export function centerOperationSignalsDay1Safe(
  section: CenterOperationSignals,
): boolean {
  return (
    section.displayMode === 'compact' ||
    section.displayMode === 'locked' ||
    section.signals.length <= 2
  ) && !section.signals.some((s) => s.tone === 'urgent' || s.severity === 'urgent');
}

export function centerOperationSignalsEmptySafe(
  section: CenterOperationSignals,
): boolean {
  if (section.displayMode !== 'empty') return true;
  return (
    section.signals.length <= 1 &&
    !section.signals.some((s) => s.tone === 'urgent' || s.severity === 'urgent')
  );
}

export function centerOperationSignalsNotDuplicateTitle(
  section: CenterOperationSignals,
  activeTargetTitle: string,
): boolean {
  return !section.signals.some((s) => linesAreDuplicate(s.title, activeTargetTitle));
}

export function centerOperationSignalsNotDuplicateFocus(
  section: CenterOperationSignals,
): boolean {
  return !section.signals.some((s) => isTitleFocusDomain(s.title));
}

export function centerOperationSignalsNotDuplicateAdvisor(
  section: CenterOperationSignals,
  advisorText: string,
): boolean {
  return !section.signals.some(
    (s) =>
      linesAreDuplicate(s.description, advisorText) ||
      linesAreDuplicate(s.title, advisorText),
  );
}

export function centerOperationSignalsLinkedTarget(
  section: CenterOperationSignals,
  activeDomain: CenterActiveTargetDomain,
): boolean {
  if (activeDomain === 'general') return true;
  const linked = section.signals.some((s) => s.isLinkedToActiveTarget);
  const domainSignal = section.signals.some((s) => s.domain === activeDomain);
  return linked || domainSignal || section.displayMode === 'empty' || section.displayMode === 'compact';
}
