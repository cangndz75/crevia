import { selectHubQuickActionCards } from '@/core/hubQuickActions';
import type { HubQuickActionCardModel } from '@/core/hubQuickActions/hubQuickActionTypes';
import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import type { GameState } from '@/core/models/GameState';
import type { HubQuickActionState } from '@/core/hubQuickActions/hubQuickActionTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import type { CenterActiveTarget, CenterActiveTargetDomain } from './centerActiveTargetPresentation';
import type { CenterAdvisorSuggestion } from './centerAdvisorPresentation';
import type { CenterHeaderSummary } from './centerHeaderPresentation';
import type { CenterOperationDomain } from './centerOperationFocusPresentation';
import type { CenterOperationSignalItem } from './centerOperationSignalsPresentation';
import type { CenterHomeVisibilityState } from './centerHomePresentation';

export const CENTER_QUICK_ACTIONS_MAX = 4;

export type CenterQuickActionDomain =
  | CenterOperationDomain
  | 'personnel';

export type CenterQuickActionStatus =
  | 'available'
  | 'locked'
  | 'disabled'
  | 'completed';

export type CenterQuickActionTone =
  | 'green'
  | 'teal'
  | 'gold'
  | 'warning'
  | 'neutral'
  | 'locked';

export type CenterQuickActionPriority = 'low' | 'normal' | 'high';

export type CenterQuickActionKey =
  | 'open_operations'
  | 'open_map'
  | 'open_assignments'
  | 'open_resources'
  | 'open_report'
  | 'open_authority'
  | 'open_domain'
  | 'locked'
  | 'none';

export type CenterQuickActionItem = {
  id: string;
  label: string;
  description?: string;
  iconKey: string;
  domain: CenterQuickActionDomain;
  status: CenterQuickActionStatus;
  tone: CenterQuickActionTone;
  priority: CenterQuickActionPriority;
  route?: string;
  actionKey: CenterQuickActionKey;
  enabled: boolean;
  lockedReason?: string;
  badgeText?: string;
  sourceLabel: string;
  isRecommended?: boolean;
  isLinkedToActiveTarget?: boolean;
  motionHint?: {
    shouldHighlight: boolean;
    attentionLevel: 'none' | 'soft';
  };
};

export type CenterQuickActionsDisplayMode = 'grid' | 'compact' | 'locked' | 'empty';

export type CenterQuickActions = {
  visibility: CenterHomeVisibilityState;
  title: string;
  subtitle?: string;
  items: CenterQuickActionItem[];
  displayMode: CenterQuickActionsDisplayMode;
  helperText?: string;
  accessibilityLabel: string;
};

export type BuildCenterQuickActionsInput = {
  gameState: GameState;
  day: number;
  activeTarget: CenterActiveTarget;
  advisorSuggestion?: CenterAdvisorSuggestion | null;
  headerSummary?: CenterHeaderSummary | null;
  operationSignals?: OperationSignalsState | null;
  operationSignalItems?: CenterOperationSignalItem[];
  hubQuickActionState?: HubQuickActionState | null;
  cardVisibility?: HubCardVisibilityModel;
};

type CatalogEntry = {
  id: string;
  label: string;
  description: string;
  iconKey: string;
  domain: CenterQuickActionDomain;
  actionKey: CenterQuickActionKey;
  route?: string;
  tone: CenterQuickActionTone;
  baseScore: number;
  requiresRoute: boolean;
};

const QUICK_ACTION_CATALOG: CatalogEntry[] = [
  {
    id: 'open_operations',
    label: 'Operasyonları Gör',
    description: 'Aktif olay ve görevlere git.',
    iconKey: 'flag-outline',
    domain: 'general',
    actionKey: 'open_operations',
    route: '/events',
    tone: 'teal',
    baseScore: 320,
    requiresRoute: true,
  },
  {
    id: 'open_map',
    label: 'Haritayı Aç',
    description: 'Mahalle ve saha görünümüne geç.',
    iconKey: 'map-outline',
    domain: 'logistics',
    actionKey: 'open_map',
    route: '/risks',
    tone: 'teal',
    baseScore: 300,
    requiresRoute: true,
  },
  {
    id: 'open_report',
    label: 'Raporu Aç',
    description: 'Gün sonu ve etki özetine bak.',
    iconKey: 'document-text-outline',
    domain: 'general',
    actionKey: 'open_report',
    route: '/reports',
    tone: 'green',
    baseScore: 280,
    requiresRoute: true,
  },
  {
    id: 'open_authority',
    label: 'Yetkileri Gör',
    description: 'Yetki ve rozet ilerlemesini incele.',
    iconKey: 'shield-checkmark-outline',
    domain: 'general',
    actionKey: 'open_authority',
    route: '/profile',
    tone: 'gold',
    baseScore: 260,
    requiresRoute: true,
  },
  {
    id: 'open_assignments',
    label: 'Personel Atama',
    description: 'Ekip dağılımı yakında burada.',
    iconKey: 'people-outline',
    domain: 'personnel',
    actionKey: 'open_assignments',
    tone: 'teal',
    baseScore: 240,
    requiresRoute: false,
  },
  {
    id: 'open_resources',
    label: 'Kaynakları İncele',
    description: 'Kaynak paneli hazırlanıyor.',
    iconKey: 'cube-outline',
    domain: 'energy',
    actionKey: 'open_resources',
    tone: 'gold',
    baseScore: 220,
    requiresRoute: false,
  },
];

const ALLOWED_STATUSES: CenterQuickActionStatus[] = [
  'available',
  'locked',
  'disabled',
  'completed',
];

const ALLOWED_ACTION_KEYS: CenterQuickActionKey[] = [
  'open_operations',
  'open_map',
  'open_assignments',
  'open_resources',
  'open_report',
  'open_authority',
  'open_domain',
  'locked',
  'none',
];

const ALLOWED_DISPLAY_MODES: CenterQuickActionsDisplayMode[] = [
  'grid',
  'compact',
  'locked',
  'empty',
];

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function domainMatchesTarget(
  domain: CenterQuickActionDomain,
  targetDomain: CenterActiveTargetDomain,
): boolean {
  if (targetDomain === 'general') return domain === 'general';
  return domain === targetDomain;
}

function collectDedupeLabels(input: BuildCenterQuickActionsInput): string[] {
  const lines: string[] = [];
  if (input.activeTarget.cta.label) lines.push(input.activeTarget.cta.label);
  if (input.advisorSuggestion?.action?.label) {
    lines.push(input.advisorSuggestion.action.label);
  }
  if (input.headerSummary?.notification?.label) {
    lines.push(input.headerSummary.notification.label);
  }
  return lines;
}

function labelIsSafe(label: string, avoid: string[]): boolean {
  return !avoid.some((line) => linesAreDuplicate(label, line));
}

function resolveDomainBoost(
  entry: CatalogEntry,
  targetDomain: CenterActiveTargetDomain,
): number {
  if (!domainMatchesTarget(entry.domain, targetDomain)) return 0;
  if (entry.id === 'open_operations') return 120;
  if (entry.id === 'open_map') return 100;
  return 60;
}

function resolveSignalBoost(
  entry: CatalogEntry,
  signalItems: CenterOperationSignalItem[],
): number {
  let boost = 0;
  for (const signal of signalItems) {
    if (signal.priority !== 'urgent' && signal.priority !== 'high') continue;
    if (
      signal.signalType === 'maintenance_warning' &&
      (entry.id === 'open_map' || entry.id === 'open_assignments')
    ) {
      boost = Math.max(boost, 90);
    }
    if (
      signal.signalType === 'rising_demand' &&
      entry.id === 'open_map'
    ) {
      boost = Math.max(boost, 80);
    }
    if (
      signal.signalType === 'social_reaction' &&
      entry.id === 'open_operations'
    ) {
      boost = Math.max(boost, 70);
    }
  }
  return boost;
}

function resolveHubCardBoost(
  entry: CatalogEntry,
  hubCards: HubQuickActionCardModel[],
): { boost: number; description?: string; recommended?: boolean } {
  const routeCard = hubCards.find((c) => c.id === 'route_preparation');
  const patrolCard = hubCards.find((c) => c.id === 'neighborhood_patrol');
  const fieldCard = hubCards.find((c) => c.id === 'field_duty');
  const socialCard = hubCards.find((c) => c.id === 'social_response');

  if (entry.id === 'open_map' && routeCard?.status === 'available') {
    return {
      boost: 110,
      description: routeCard.helperLine ?? entry.description,
      recommended: true,
    };
  }
  if (entry.id === 'open_map' && patrolCard?.status === 'available') {
    return {
      boost: 100,
      description: patrolCard.helperLine ?? entry.description,
      recommended: true,
    };
  }
  if (entry.id === 'open_operations' && socialCard?.status === 'available') {
    return {
      boost: 85,
      description: socialCard.helperLine ?? entry.description,
      recommended: true,
    };
  }
  if (entry.id === 'open_assignments' && fieldCard?.status === 'available') {
    return {
      boost: 75,
      description: 'Saha panelinden ekip ataması yapılır.',
      recommended: false,
    };
  }
  return { boost: 0 };
}

function buildDay1QuickActions(): CenterQuickActions {
  const items: CenterQuickActionItem[] = [
    {
      id: 'open_operations',
      label: 'Operasyonları Gör',
      description: 'İlk olaya kısa yoldan git.',
      iconKey: 'flag-outline',
      domain: 'general',
      status: 'available',
      tone: 'teal',
      priority: 'high',
      route: '/events',
      actionKey: 'open_operations',
      enabled: true,
      sourceLabel: 'Giriş',
      isLinkedToActiveTarget: true,
      isRecommended: true,
      motionHint: { shouldHighlight: true, attentionLevel: 'soft' },
    },
    {
      id: 'open_map',
      label: 'Haritayı Aç',
      description: 'İlk olaydan sonra açılır.',
      iconKey: 'map-outline',
      domain: 'logistics',
      status: 'locked',
      tone: 'locked',
      priority: 'low',
      actionKey: 'locked',
      enabled: false,
      lockedReason: 'İlk olaydan sonra',
      sourceLabel: 'Giriş',
    },
    {
      id: 'open_assignments',
      label: 'Personel Atama',
      description: 'Ekip yönetimi kilitli.',
      iconKey: 'people-outline',
      domain: 'personnel',
      status: 'locked',
      tone: 'locked',
      priority: 'low',
      actionKey: 'locked',
      enabled: false,
      lockedReason: 'Gün 2’den itibaren',
      sourceLabel: 'Giriş',
    },
    {
      id: 'open_report',
      label: 'Raporu Aç',
      description: 'İlk sonuçtan sonra görünür.',
      iconKey: 'document-text-outline',
      domain: 'general',
      status: 'locked',
      tone: 'locked',
      priority: 'low',
      actionKey: 'locked',
      enabled: false,
      lockedReason: 'İlk sonuçtan sonra',
      sourceLabel: 'Giriş',
    },
  ];

  return {
    visibility: 'locked',
    title: 'Hızlı İşlemler',
    subtitle: 'Yardımcı kısayollar',
    items,
    displayMode: 'locked',
    helperText: 'İlk operasyonu tamamladıkça hızlı işlemler açılır.',
    accessibilityLabel: 'Hızlı işlemler kilitli. İlk operasyonla açılır.',
  };
}

function resolveDay2PlusStatus(
  entry: CatalogEntry,
  day: number,
): CenterQuickActionStatus {
  if (!entry.requiresRoute) return 'disabled';
  if (entry.id === 'open_report' && day < 2) return 'locked';
  if (entry.id === 'open_authority' && day < 3) return 'locked';
  if (entry.route) return 'available';
  return 'disabled';
}

function buildItemFromCatalog(
  entry: CatalogEntry,
  input: BuildCenterQuickActionsInput,
  sortScore: number,
  options: {
    status?: CenterQuickActionStatus;
    description?: string;
    recommended?: boolean;
    linked?: boolean;
    lockedReason?: string;
  },
): CenterQuickActionItem & { sortScore: number } {
  const dedupe = collectDedupeLabels(input);
  const status = options.status ?? resolveDay2PlusStatus(entry, input.day);
  const hasRoute = Boolean(entry.route);
  const enabled =
    status === 'available' && hasRoute && entry.requiresRoute;
  const linked = options.linked ?? domainMatchesTarget(entry.domain, input.activeTarget.domain);

  let label = entry.label;
  if (!labelIsSafe(label, dedupe) && entry.id === 'open_operations') {
    label = 'Operasyon Merkezi';
  }

  const tone: CenterQuickActionTone =
    status === 'locked' || status === 'disabled'
      ? 'locked'
      : entry.tone;

  return {
    sortScore: sortScore + (linked ? 40 : 0) + (options.recommended ? 30 : 0),
    id: entry.id,
    label,
    description: options.description ?? entry.description,
    iconKey: entry.iconKey,
    domain: entry.domain,
    status,
    tone,
    priority: linked || options.recommended ? 'high' : 'normal',
    route: enabled ? entry.route : undefined,
    actionKey: enabled ? entry.actionKey : status === 'locked' ? 'locked' : 'none',
    enabled,
    lockedReason:
      options.lockedReason ??
      (status === 'locked'
        ? entry.id === 'open_authority'
          ? 'Yetki ilerlemesiyle açılır'
          : 'Yakında açılır'
        : status === 'disabled'
          ? 'Hazırlanıyor'
          : undefined),
    sourceLabel: options.recommended ? 'Önerilen' : 'Katalog',
    isRecommended: options.recommended,
    isLinkedToActiveTarget: linked,
    motionHint: {
      shouldHighlight: Boolean(options.recommended || linked) && enabled,
      attentionLevel: options.recommended ? 'soft' : 'none',
    },
  };
}

export function buildCenterQuickActions(
  input: BuildCenterQuickActionsInput,
): CenterQuickActions {
  const day = input.day > 0 ? input.day : 1;

  if (day <= 1) {
    return buildDay1QuickActions();
  }

  const hubCards = input.hubQuickActionState
    ? selectHubQuickActionCards({
        hubQuickActionState: input.hubQuickActionState,
        currentDay: day,
        day1Disabled: false,
      })
    : [];

  const signalItems = input.operationSignalItems ?? [];
  const drafts: Array<CenterQuickActionItem & { sortScore: number }> = [];

  for (const entry of QUICK_ACTION_CATALOG) {
    let score = entry.baseScore;
    score += resolveDomainBoost(entry, input.activeTarget.domain);
    score += resolveSignalBoost(entry, signalItems);

    const hubBoost = resolveHubCardBoost(entry, hubCards);
    score += hubBoost.boost;

    const item = buildItemFromCatalog(entry, input, score, {
      description: hubBoost.description,
      recommended: hubBoost.recommended,
      linked: domainMatchesTarget(entry.domain, input.activeTarget.domain),
      lockedReason:
        entry.id === 'open_assignments' || entry.id === 'open_resources'
          ? 'Henüz güvenli kısayol yok'
          : undefined,
    });
    drafts.push(item);
  }

  const sorted = [...drafts].sort((a, b) => b.sortScore - a.sortScore);
  const items = sorted.slice(0, CENTER_QUICK_ACTIONS_MAX).map(({ sortScore: _s, ...item }) => item);

  if (input.activeTarget.status === 'completed') {
    const reportItem = items.find((item) => item.id === 'open_report');
    if (reportItem && reportItem.status === 'available') {
      reportItem.isRecommended = true;
      reportItem.motionHint = { shouldHighlight: true, attentionLevel: 'soft' };
    }
  }

  return {
    visibility: 'visible',
    title: 'Hızlı İşlemler',
    subtitle: 'Yardımcı kısayollar',
    items,
    displayMode: 'grid',
    helperText: 'Ana hedef dışında hızlı geçiş noktaları.',
    accessibilityLabel: `Hızlı işlemler. ${items.length} kısayol.`,
  };
}

export function centerQuickActionsCoreFieldsValid(section: CenterQuickActions): boolean {
  if (!section.title.trim()) return false;
  if (!section.accessibilityLabel.trim()) return false;
  if (!ALLOWED_DISPLAY_MODES.includes(section.displayMode)) return false;
  return section.items.every(
    (item) =>
      item.id.trim().length > 0 &&
      item.label.trim().length > 0 &&
      ALLOWED_STATUSES.includes(item.status) &&
      ALLOWED_ACTION_KEYS.includes(item.actionKey) &&
      (!item.enabled || Boolean(item.route)),
  );
}

export function centerQuickActionsMaxItems(section: CenterQuickActions): boolean {
  return section.items.length <= CENTER_QUICK_ACTIONS_MAX;
}

export function centerQuickActionsUniqueIds(section: CenterQuickActions): boolean {
  const ids = section.items.map((item) => item.id);
  return new Set(ids).size === ids.length;
}

export function centerQuickActionsRouteSafety(section: CenterQuickActions): boolean {
  return section.items.every((item) => !item.enabled || Boolean(item.route));
}

export function centerQuickActionsNoFakeSpend(section: CenterQuickActions): boolean {
  return !section.items.some(
    (item) =>
      item.enabled &&
      (item.id === 'open_resources' || item.actionKey === 'open_resources'),
  );
}

export function centerQuickActionsDay1Safe(section: CenterQuickActions): boolean {
  return (
    section.items.length <= 4 &&
    section.displayMode === 'locked' &&
    !section.items.some((item) => item.status === 'available' && item.id !== 'open_operations')
  );
}

export function centerQuickActionsNotDuplicateTargetCta(
  section: CenterQuickActions,
  ctaLabel: string,
): boolean {
  return !section.items.some((item) => linesAreDuplicate(item.label, ctaLabel));
}

export function centerQuickActionsNotDuplicateAdvisor(
  section: CenterQuickActions,
  advisorActionLabel: string,
): boolean {
  return !section.items.some((item) => linesAreDuplicate(item.label, advisorActionLabel));
}

export function centerQuickActionsLinkedTarget(
  section: CenterQuickActions,
): boolean {
  return section.items.some((item) => item.isLinkedToActiveTarget) || section.displayMode === 'locked';
}
