import type { MainOperationFeelHubPresentation } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { Day8OperationFeedBindingResult } from '@/core/day8OperationFeedBinding';
import { buildOperationFocusBindingSubtitle } from '@/core/day8OperationFeedBinding';
import type { GameState } from '@/core/models/GameState';
import type {
  OperationDomainSignal,
  OperationSignalsState,
} from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import { buildHubSocialPulseModel } from '@/features/social/utils/socialHubModel';

import type { CenterActiveTarget, CenterActiveTargetDomain } from './centerActiveTargetPresentation';
import type { CenterAdvisorSuggestion } from './centerAdvisorPresentation';
import type { CenterCitySummary } from './centerCitySummaryPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';

export const CENTER_OPERATION_FOCUS_MAX_ITEMS = 4;
export const CENTER_OPERATION_FOCUS_PREFERRED_ITEMS = 3;

export type CenterOperationDomain =
  | 'transport'
  | 'environment'
  | 'energy'
  | 'social'
  | 'logistics'
  | 'maintenance'
  | 'general';

export type CenterOperationFocusItemTone =
  | 'success'
  | 'stable'
  | 'warning'
  | 'urgent'
  | 'locked'
  | 'neutral';

export type CenterOperationFocusItemPriority = 'low' | 'normal' | 'high' | 'urgent';

export type CenterOperationFocusItem = {
  id: string;
  domain: CenterOperationDomain;
  title: string;
  subtitle?: string;
  statusLabel: string;
  tone: CenterOperationFocusItemTone;
  priority: CenterOperationFocusItemPriority;
  iconKey: string;
  sourceLabel: string;
  isActiveTargetDomain?: boolean;
  isLocked?: boolean;
  progressText?: string;
  route?: string;
  motionHint?: {
    shouldHighlight: boolean;
    attentionLevel: 'none' | 'soft' | 'medium';
  };
};

export type CenterOperationFocusCtaActionKey =
  | 'view_operations'
  | 'view_domain'
  | 'locked'
  | 'none';

export type CenterOperationFocusCta = {
  label: string;
  route?: string;
  actionKey: CenterOperationFocusCtaActionKey;
  enabled: boolean;
};

export type CenterOperationFocusDisplayMode =
  | 'compact'
  | 'carousel'
  | 'grid'
  | 'locked'
  | 'empty';

export type CenterOperationFocusMotionHint = {
  revealLevel: 'none' | 'soft';
  shouldUseStagger: boolean;
};

export type CenterOperationFocus = {
  visibility: CenterHomeVisibilityState;
  title: string;
  subtitle?: string;
  items: CenterOperationFocusItem[];
  selectedDomain?: CenterOperationDomain;
  helperText?: string;
  cta?: CenterOperationFocusCta;
  displayMode: CenterOperationFocusDisplayMode;
  motionHint?: CenterOperationFocusMotionHint;
  accessibilityLabel: string;
  /** Section header “Tümünü gör” aksiyonu */
  showViewAll: boolean;
};

export type BuildCenterOperationFocusInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  advisorSuggestion?: CenterAdvisorSuggestion | null;
  citySummary?: CenterCitySummary | null;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  mainOperationFeelPresentation?: MainOperationFeelHubPresentation | null;
  operationSignalLabels?: string[];
  hubVehicleMaintenanceLine?: string | null;
  day8OperationFeedBinding?: Day8OperationFeedBindingResult | null;
};

type DomainCatalogEntry = {
  title: string;
  iconKey: string;
  calmStatusLabel: string;
  calmSubtitle: string;
  signalKey?: OperationDomainSignal['domain'];
};

const DOMAIN_CATALOG: Record<CenterOperationDomain, DomainCatalogEntry> = {
  transport: {
    title: 'Ulaşım',
    iconKey: 'bus-outline',
    calmStatusLabel: 'Dengeli',
    calmSubtitle: 'Rota akışı izleniyor',
    signalKey: 'vehicles',
  },
  environment: {
    title: 'Çevre',
    iconKey: 'leaf-outline',
    calmStatusLabel: 'Dengeli',
    calmSubtitle: 'Toplama düzeni stabil',
    signalKey: 'containers',
  },
  energy: {
    title: 'Enerji',
    iconKey: 'flash-outline',
    calmStatusLabel: 'Stabil',
    calmSubtitle: 'Kaynak akışı uygun',
    signalKey: 'personnel',
  },
  social: {
    title: 'Sosyal Nabız',
    iconKey: 'people-outline',
    calmStatusLabel: 'Dengeli',
    calmSubtitle: 'Vatandaş tepkisi sakin',
  },
  logistics: {
    title: 'Lojistik',
    iconKey: 'cube-outline',
    calmStatusLabel: 'Hazır',
    calmSubtitle: 'Ekip ve araç dağılımı uygun',
    signalKey: 'districts',
  },
  maintenance: {
    title: 'Bakım',
    iconKey: 'construct-outline',
    calmStatusLabel: 'İzleniyor',
    calmSubtitle: 'Araç yorgunluğu takipte',
    signalKey: 'vehicles',
  },
  general: {
    title: 'Genel Durum',
    iconKey: 'grid-outline',
    calmStatusLabel: 'Sakin',
    calmSubtitle: 'Operasyon alanları dengede',
    signalKey: 'overall',
  },
};

const ALLOWED_DISPLAY_MODES: CenterOperationFocusDisplayMode[] = [
  'compact',
  'carousel',
  'grid',
  'locked',
  'empty',
];

const ALLOWED_TONES: CenterOperationFocusItemTone[] = [
  'success',
  'stable',
  'warning',
  'urgent',
  'locked',
  'neutral',
];

const ALLOWED_PRIORITIES: CenterOperationFocusItemPriority[] = [
  'low',
  'normal',
  'high',
  'urgent',
];

type DraftItem = {
  domain: CenterOperationDomain;
  priority: CenterOperationFocusItemPriority;
  tone: CenterOperationFocusItemTone;
  statusLabel: string;
  subtitle?: string;
  sourceLabel: string;
  isActiveTargetDomain?: boolean;
  isLocked?: boolean;
  sortScore: number;
  signalScore?: number;
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

function resolveDomainFromDailyFocus(
  focus: OperationSignalsState['dailyFocus'] | undefined,
): CenterOperationDomain | null {
  switch (focus) {
    case 'vehicles':
      return 'transport';
    case 'containers':
      return 'environment';
    case 'personnel':
      return 'energy';
    case 'districts':
      return 'logistics';
    default:
      return null;
  }
}

function signalStatusToTone(status: OperationDomainSignal['status']): CenterOperationFocusItemTone {
  switch (status) {
    case 'critical':
      return 'urgent';
    case 'strained':
      return 'warning';
    case 'watch':
      return 'stable';
    default:
      return 'success';
  }
}

function signalStatusToPriority(
  status: OperationDomainSignal['status'],
  score: number,
): CenterOperationFocusItemPriority {
  if (status === 'critical' || score >= 80) return 'urgent';
  if (status === 'strained' || score >= 60) return 'high';
  if (status === 'watch' || score >= 40) return 'normal';
  return 'low';
}

function activeTargetPriorityToTone(
  priority: CenterActiveTarget['priority'],
): CenterOperationFocusItemTone {
  if (priority === 'urgent') return 'urgent';
  if (priority === 'high') return 'warning';
  return 'stable';
}

function shortenSubtitle(text: string, maxLen = 42): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trim()}…`;
}

function signalSubtitle(signal: OperationDomainSignal): string {
  const summary = signal.summary?.trim();
  if (summary && summary.length > 8 && !summary.includes('Günlük sinyal izleniyor')) {
    return shortenSubtitle(summary);
  }
  switch (signal.domain) {
    case 'vehicles':
      return 'Rota baskısı izleniyor';
    case 'containers':
      return 'Toplama düzeni izleniyor';
    case 'personnel':
      return 'Kaynak baskısı oluşuyor';
    case 'districts':
      return 'Mahalle talebi izleniyor';
    default:
      return 'Genel denge izleniyor';
  }
}

function signalStatusLabel(signal: OperationDomainSignal, isActive: boolean): string {
  if (isActive) return 'Bugünkü odak';
  switch (signal.status) {
    case 'critical':
      return 'Kritik';
    case 'strained':
      return 'Baskı var';
    case 'watch':
      return 'İzleniyor';
    default:
      return 'Dengeli';
  }
}

function mergeDraft(
  map: Map<CenterOperationDomain, DraftItem>,
  draft: DraftItem,
): void {
  const existing = map.get(draft.domain);
  if (!existing) {
    map.set(draft.domain, draft);
    return;
  }

  const merged: DraftItem = {
    ...existing,
    priority:
      ALLOWED_PRIORITIES.indexOf(draft.priority) >
      ALLOWED_PRIORITIES.indexOf(existing.priority)
        ? draft.priority
        : existing.priority,
    tone:
      ALLOWED_TONES.indexOf(draft.tone) > ALLOWED_TONES.indexOf(existing.tone)
        ? draft.tone
        : existing.tone,
    statusLabel: draft.isActiveTargetDomain ? draft.statusLabel : existing.statusLabel,
    subtitle: draft.subtitle ?? existing.subtitle,
    sourceLabel: draft.isActiveTargetDomain ? draft.sourceLabel : existing.sourceLabel,
    isActiveTargetDomain: existing.isActiveTargetDomain || draft.isActiveTargetDomain,
    isLocked: existing.isLocked && draft.isLocked,
    sortScore: Math.max(existing.sortScore, draft.sortScore),
    signalScore: Math.max(existing.signalScore ?? 0, draft.signalScore ?? 0),
  };
  map.set(draft.domain, merged);
}

function buildDay1Focus(): CenterOperationFocus {
  const items: CenterOperationFocusItem[] = [
    {
      id: 'focus-day1-first-operation',
      domain: 'transport',
      title: 'İlk Operasyon',
      statusLabel: 'Hazır',
      subtitle: 'İlk olayla başlar',
      tone: 'locked',
      priority: 'normal',
      iconKey: 'flag-outline',
      sourceLabel: 'Giriş',
      isLocked: true,
    },
    {
      id: 'focus-day1-planning',
      domain: 'logistics',
      title: 'Planlama',
      statusLabel: 'Kilitli',
      subtitle: 'İlk olayla açılır',
      tone: 'locked',
      priority: 'low',
      iconKey: 'map-outline',
      sourceLabel: 'Giriş',
      isLocked: true,
    },
    {
      id: 'focus-day1-field-flow',
      domain: 'general',
      title: 'Saha Akışı',
      statusLabel: 'Yakında',
      subtitle: 'Yönlendirme sonrası görünür',
      tone: 'locked',
      priority: 'low',
      iconKey: 'navigate-outline',
      sourceLabel: 'Giriş',
      isLocked: true,
    },
  ];

  return {
    visibility: 'locked',
    title: 'Operasyon Odağı',
    subtitle: 'Alanlar ilk olayla netleşir',
    items,
    helperText: 'İlk olayı tamamladıkça operasyon alanları netleşir.',
    cta: {
      label: 'Yakında',
      actionKey: 'locked',
      enabled: false,
    },
    displayMode: 'locked',
    motionHint: { revealLevel: 'none', shouldUseStagger: false },
    accessibilityLabel: 'Operasyon odağı kilitli. İlk olayı tamamladıkça alanlar açılır.',
    showViewAll: false,
  };
}

function collectDedupeLines(input: BuildCenterOperationFocusInput): string[] {
  const lines: string[] = [];
  if (input.activeTarget.title) lines.push(input.activeTarget.title);
  if (input.activeTarget.description) lines.push(input.activeTarget.description);
  if (input.advisorSuggestion?.recommendation) {
    lines.push(input.advisorSuggestion.recommendation);
  }
  if (input.advisorSuggestion?.contextLine) {
    lines.push(input.advisorSuggestion.contextLine);
  }
  if (input.citySummary?.primaryInsight?.text) {
    lines.push(input.citySummary.primaryInsight.text);
  }
  for (const label of input.operationSignalLabels ?? []) {
    if (label.trim()) lines.push(label);
  }
  const bindingSubtitle = buildOperationFocusBindingSubtitle(input.day8OperationFeedBinding ?? {
    day: input.day,
    isActive: false,
    biases: [],
    feedBindings: [],
    sourceIds: [],
  });
  if (bindingSubtitle) lines.push(bindingSubtitle);
  return lines;
}

function subtitleIsSafe(subtitle: string, dedupeLines: string[]): boolean {
  return !dedupeLines.some((line) => linesAreDuplicate(subtitle, line));
}

function draftToItem(
  draft: DraftItem,
  dedupeLines: string[],
  day: number,
): CenterOperationFocusItem {
  const catalog = DOMAIN_CATALOG[draft.domain];
  let subtitle = draft.subtitle ?? catalog.calmSubtitle;
  if (!subtitleIsSafe(subtitle, dedupeLines)) {
    subtitle = catalog.calmSubtitle;
  }

  const shouldHighlight =
    draft.isActiveTargetDomain ||
    draft.priority === 'urgent' ||
    draft.priority === 'high';

  return {
    id: `focus-${draft.domain}`,
    domain: draft.domain,
    title: catalog.title,
    subtitle,
    statusLabel: draft.statusLabel,
    tone: draft.tone,
    priority: draft.priority,
    iconKey: catalog.iconKey,
    sourceLabel: draft.sourceLabel,
    isActiveTargetDomain: draft.isActiveTargetDomain,
    isLocked: draft.isLocked,
    route: draft.isLocked ? undefined : '/events',
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

function buildCalmFallbackItems(dedupeLines: string[]): CenterOperationFocusItem[] {
  const calmDomains: CenterOperationDomain[] = ['transport', 'environment', 'logistics'];
  return calmDomains.map((domain) => {
    const catalog = DOMAIN_CATALOG[domain];
    const subtitle = subtitleIsSafe(catalog.calmSubtitle, dedupeLines)
      ? catalog.calmSubtitle
      : 'Yeni sinyal bekleniyor';
    return {
      id: `focus-calm-${domain}`,
      domain,
      title: catalog.title,
      subtitle,
      statusLabel: 'Sakin',
      tone: 'stable' as const,
      priority: 'low' as const,
      iconKey: catalog.iconKey,
      sourceLabel: 'Genel',
      route: '/events',
      motionHint: { shouldHighlight: false, attentionLevel: 'none' as const },
    };
  });
}

export function buildCenterOperationFocus(
  input: BuildCenterOperationFocusInput,
): CenterOperationFocus {
  const day = input.day > 0 ? input.day : 1;

  if (day <= 1) {
    return buildDay1Focus();
  }

  const dedupeLines = collectDedupeLines(input);
  const draftMap = new Map<CenterOperationDomain, DraftItem>();
  const signals = input.operationSignals;
  const activeDomain = input.activeTarget.domain as CenterOperationDomain;

  if (activeDomain && activeDomain !== 'general' && DOMAIN_CATALOG[activeDomain]) {
    const catalog = DOMAIN_CATALOG[activeDomain];
    mergeDraft(draftMap, {
      domain: activeDomain,
      priority: input.activeTarget.priority,
      tone: activeTargetPriorityToTone(input.activeTarget.priority),
      statusLabel: 'Bugünkü odak',
      subtitle: catalog.calmSubtitle,
      sourceLabel: input.activeTarget.sourceLabel ?? 'Aktif hedef',
      isActiveTargetDomain: true,
      sortScore: 1000,
    });
  }

  if (signals) {
    const signalDomains: OperationDomainSignal['domain'][] = [
      'vehicles',
      'containers',
      'personnel',
      'districts',
      'overall',
    ];
    for (const signalKey of signalDomains) {
      const signal = signals[signalKey];
      const domain = resolveDomainFromSignal(signal.domain);
      if (domain === activeDomain && draftMap.has(domain)) {
        const existing = draftMap.get(domain)!;
        mergeDraft(draftMap, {
          ...existing,
          tone: signalStatusToTone(signal.status),
          priority: signalStatusToPriority(signal.status, signal.score),
          subtitle: signalSubtitle(signal),
          sourceLabel: 'Operasyon sinyali',
          signalScore: signal.score,
          sortScore: existing.sortScore + signal.score,
        });
        continue;
      }
      const priority = signalStatusToPriority(signal.status, signal.score);
      const isCalm = priority === 'low' && signal.status === 'stable';

      mergeDraft(draftMap, {
        domain,
        priority: isCalm ? 'low' : priority,
        tone: isCalm ? 'success' : signalStatusToTone(signal.status),
        statusLabel: isCalm ? 'Dengeli' : signalStatusLabel(signal, false),
        subtitle: isCalm ? DOMAIN_CATALOG[domain].calmSubtitle : signalSubtitle(signal),
        sourceLabel: 'Operasyon sinyali',
        signalScore: signal.score,
        sortScore: isCalm ? 50 + signal.score : 200 + signal.score + (priority === 'urgent' ? 100 : 0),
      });
    }

    const focusDomain = resolveDomainFromDailyFocus(signals.dailyFocus);
    if (focusDomain) {
      const catalog = DOMAIN_CATALOG[focusDomain];
      mergeDraft(draftMap, {
        domain: focusDomain,
        priority: 'normal',
        tone: 'stable',
        statusLabel: 'Günün odağı',
        subtitle: catalog.calmSubtitle,
        sourceLabel: 'Ana operasyon',
        sortScore: 150,
      });
    }
  }

  const socialModel = buildHubSocialPulseModel(input.socialPulseState, day);
  if (
    socialModel.statusTone === 'caution' ||
    socialModel.statusTone === 'crisis'
  ) {
    mergeDraft(draftMap, {
      domain: 'social',
      priority: socialModel.statusTone === 'crisis' ? 'urgent' : 'high',
      tone: socialModel.statusTone === 'crisis' ? 'urgent' : 'warning',
      statusLabel: 'Hassas',
      subtitle: 'Vatandaş tepkisi izleniyor',
      sourceLabel: 'Sosyal nabız',
      sortScore: 180,
    });
  }

  if (input.hubVehicleMaintenanceLine?.trim()) {
    mergeDraft(draftMap, {
      domain: 'maintenance',
      priority: 'normal',
      tone: 'warning',
      statusLabel: 'İzleniyor',
      subtitle: shortenSubtitle(input.hubVehicleMaintenanceLine),
      sourceLabel: 'Bakım',
      sortScore: 120,
    });
  }

  const feel = input.mainOperationFeelPresentation;
  if (feel?.visible && feel.detailLine?.trim()) {
    const feelDomain = resolveDomainFromDailyFocus(
      signals?.dailyFocus ?? 'balanced',
    );
    if (feelDomain) {
      const catalog = DOMAIN_CATALOG[feelDomain];
      const subtitle = subtitleIsSafe(feel.detailLine, dedupeLines)
        ? shortenSubtitle(feel.detailLine)
        : catalog.calmSubtitle;
      mergeDraft(draftMap, {
        domain: feelDomain,
        priority: 'normal',
        tone: 'stable',
        statusLabel: 'Öne çıkan',
        subtitle,
        sourceLabel: 'Ana operasyon',
        sortScore: 140,
      });
    }
  }

  const riskMetric = input.citySummary?.metrics.find((m) => m.id === 'risk');
  if (riskMetric && (riskMetric.tone === 'warning' || riskMetric.tone === 'urgent')) {
    const domain: CenterOperationDomain =
      riskMetric.tone === 'urgent' ? 'logistics' : 'environment';
    mergeDraft(draftMap, {
      domain,
      priority: riskMetric.tone === 'urgent' ? 'high' : 'normal',
      tone: riskMetric.tone === 'urgent' ? 'warning' : 'stable',
      statusLabel: 'Dikkat',
      subtitle: 'Kaynak baskısı izleniyor',
      sourceLabel: 'Merkez özeti',
      sortScore: 110,
    });
  }

  let sortedDrafts = [...draftMap.values()].sort((a, b) => b.sortScore - a.sortScore);

  if (sortedDrafts.length === 0) {
    const calmItems = buildCalmFallbackItems(dedupeLines);
    return {
      visibility: 'visible',
      title: 'Operasyon Odağı',
      subtitle: 'Bugün kritik odak yok',
      items: calmItems.slice(0, CENTER_OPERATION_FOCUS_PREFERRED_ITEMS),
      helperText: 'Operasyon alanları dengede. Yeni sinyal bekleniyor.',
      cta: {
        label: 'Operasyonları Gör',
        route: '/events',
        actionKey: 'view_operations',
        enabled: true,
      },
      displayMode: 'empty',
      motionHint: { revealLevel: 'soft', shouldUseStagger: false },
      accessibilityLabel: 'Operasyon odağı sakin. Kritik odak yok.',
      showViewAll: false,
    };
  }

  sortedDrafts = sortedDrafts.slice(0, CENTER_OPERATION_FOCUS_MAX_ITEMS);
  let items = sortedDrafts.map((draft) => draftToItem(draft, dedupeLines, day));

  if (day >= 8 && input.day8OperationFeedBinding?.isActive) {
    const bindingSubtitle = buildOperationFocusBindingSubtitle(input.day8OperationFeedBinding);
    if (bindingSubtitle && items[0] && subtitleIsSafe(bindingSubtitle, dedupeLines)) {
      items = [
        {
          ...items[0],
          subtitle: shortenSubtitle(bindingSubtitle),
          sourceLabel: input.day8OperationFeedBinding.primaryFeedBinding?.badgeLabel ?? items[0].sourceLabel,
        },
        ...items.slice(1),
      ];
    }
  }

  const selectedDomain =
    items.find((item) => item.isActiveTargetDomain)?.domain ?? items[0]?.domain;

  const itemCount = items.length;
  const displayMode: CenterOperationFocusDisplayMode =
    itemCount <= 2 ? 'compact' : itemCount <= 4 ? 'carousel' : 'grid';

  const showViewAll = day >= 3;

  return {
    visibility: 'visible',
    title: 'Operasyon Odağı',
    subtitle: 'Bugün öne çıkan alanlar',
    items,
    selectedDomain,
    helperText:
      items.some((item) => item.isActiveTargetDomain)
        ? 'Aktif hedefin bağlı olduğu alan öne çıkarıldı.'
        : undefined,
    cta: {
      label: 'Tümünü Gör',
      route: '/events',
      actionKey: 'view_operations',
      enabled: showViewAll,
    },
    displayMode,
    motionHint: {
      revealLevel: 'soft',
      shouldUseStagger: itemCount >= 3,
    },
    accessibilityLabel: `Operasyon odağı. ${items.length} alan gösteriliyor.`,
    showViewAll,
  };
}

export function centerOperationFocusDedupeText(focus: CenterOperationFocus): string {
  return focus.items
    .map((item) => [item.title, item.subtitle, item.statusLabel].filter(Boolean).join(' '))
    .join(' ');
}

export function centerOperationFocusCoreFieldsValid(focus: CenterOperationFocus): boolean {
  if (!focus.title.trim()) return false;
  if (!focus.accessibilityLabel.trim()) return false;
  if (!ALLOWED_DISPLAY_MODES.includes(focus.displayMode)) return false;
  return focus.items.every(
    (item) =>
      item.id.trim().length > 0 &&
      item.title.trim().length > 0 &&
      item.statusLabel.trim().length > 0 &&
      ALLOWED_TONES.includes(item.tone) &&
      ALLOWED_PRIORITIES.includes(item.priority),
  );
}

export function centerOperationFocusMaxItems(focus: CenterOperationFocus): boolean {
  return focus.items.length <= CENTER_OPERATION_FOCUS_MAX_ITEMS;
}

export function centerOperationFocusUniqueDomains(
  focus: CenterOperationFocus,
): boolean {
  if (focus.displayMode === 'locked') return true;
  const domains = focus.items.map((item) => item.domain);
  return new Set(domains).size === domains.length;
}

export function centerOperationFocusActiveDomainRepresented(
  focus: CenterOperationFocus,
  activeDomain: CenterActiveTargetDomain,
): boolean {
  if (activeDomain === 'general') return true;
  if (focus.displayMode === 'locked') return true;
  return (
    focus.selectedDomain === activeDomain ||
    focus.items.some(
      (item) => item.domain === activeDomain && item.isActiveTargetDomain,
    ) ||
    focus.items[0]?.domain === activeDomain
  );
}

export function centerOperationFocusNotDuplicateTitle(
  focus: CenterOperationFocus,
  activeTargetTitle: string,
): boolean {
  return !focus.items.some((item) =>
    linesAreDuplicate(item.title, activeTargetTitle),
  );
}

export function centerOperationFocusNotDuplicateAdvisor(
  focus: CenterOperationFocus,
  advisorText: string,
): boolean {
  return !focus.items.some(
    (item) =>
      linesAreDuplicate(item.subtitle, advisorText) ||
      linesAreDuplicate(`${item.title} ${item.statusLabel}`, advisorText),
  );
}

export function centerOperationFocusNoFakeRisk(focus: CenterOperationFocus): boolean {
  if (focus.displayMode !== 'empty') return true;
  return !focus.items.some((item) => item.tone === 'urgent' || item.priority === 'urgent');
}

export function centerOperationFocusDay1Locked(focus: CenterOperationFocus): boolean {
  return (
    focus.visibility === 'locked' &&
    focus.displayMode === 'locked' &&
    focus.items.length >= 2 &&
    focus.items.length <= 3 &&
    focus.items.every((item) => item.isLocked)
  );
}

export function centerOperationFocusRouteSafety(focus: CenterOperationFocus): boolean {
  return focus.items.every((item) => {
    if (item.route) return true;
    return item.isLocked || !item.route;
  });
}
