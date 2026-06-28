import type { CenterHomeCoreSections } from './centerHomePresentation';
import type {
  CenterHubAction,
  CenterNextActionCard,
} from './centerHubGameplayPresentation';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import {
  buildPostDecisionCityReactionFromRecord,
  type CityReactionTone,
} from '@/features/events/utils/postDecisionCityReactionPresentation';
import { buildPostDecisionSocialEchoPresentation } from '@/core/socialEcho';
import {
  getCenterActionFamily,
  normalizeCenterActionKey,
} from './centerActionDedupe';

export type CenterRecentImpactTone = CityReactionTone;

export type CenterRecentImpactChip = {
  id: string;
  label: string;
  valueText: string;
  tone: CenterRecentImpactTone;
};

export type CenterRecentImpactSummaryPresentation = {
  visibility: 'visible' | 'hidden';
  id?: string;
  eventId?: string;
  districtId?: string;
  districtName?: string;
  title: string;
  subtitle?: string;
  targetTitle?: string;
  footerLine?: string;
  compactSummary?: string;
  socialLine?: string;
  advisorLine?: string;
  statusLabel?: string;
  tone: CenterRecentImpactTone;
  primaryAction?: CenterHubAction;
  secondaryAction?: CenterHubAction;
  actionKey?: string;
  chips: CenterRecentImpactChip[];
};

export type CenterAdvisorMiniDirectivePresentation = {
  visibility: 'visible' | 'hidden';
  advisorName: string;
  directive: string;
  cta: CenterHubAction;
};

export type CenterDistrictFocusPresentation = {
  visibility: 'visible' | 'hidden';
  districtName: string;
  trustLabel: string;
  riskLabel: string;
  opportunityLabel: string;
  developmentLabel: string;
  populationLabel: string;
  demandLabel: string;
  domainLabel?: string;
  cta: CenterHubAction;
};

export type CenterUnlockPreviewMiniPresentation = {
  visibility: 'visible' | 'hidden';
  featureTitle: string;
  unlockCondition: string;
  iconKey: string;
  routeKey?: string;
  actionKey?: string;
};

export type CenterHubDepthPresentation = {
  recentImpactSummary: CenterRecentImpactSummaryPresentation;
  advisorMiniDirective: CenterAdvisorMiniDirectivePresentation;
  districtFocus: CenterDistrictFocusPresentation;
  unlockPreviewMini: CenterUnlockPreviewMiniPresentation;
};

const DOMAIN_DISTRICT_NAMES: Record<string, string> = {
  transport: 'Merkez Ulaşım',
  environment: 'Yeşil Vadi',
  social: 'Yenişehir',
  logistics: 'Sanayi Pazar',
  energy: 'Enerji Hattı',
  general: 'Merkez Bölge',
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

function isClearUnlockCondition(text: string | undefined): boolean {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return false;
  if (/^yakında$/i.test(trimmed)) return false;
  if (/yakında açıl/i.test(trimmed)) return false;
  return /gün|hedef|itibar|yetki|açılır|tamamla|olunca|gerekli|\d+|sonra|önce/i.test(trimmed);
}

function impactChipTone(
  tone: 'positive' | 'neutral' | 'warning',
  label: string,
): CenterRecentImpactChip['tone'] {
  if (/bütçe|butce|kaynak|ödül|odul|ekip|resource/i.test(label)) {
    return tone === 'warning' ? 'warning' : tone === 'positive' ? 'positive' : 'neutral';
  }
  if (tone === 'positive') return 'positive';
  if (tone === 'warning') return 'warning';
  return 'neutral';
}

function mapImpactLabel(label: string): string {
  const normalized = label.trim().toLowerCase();
  if (/halk|public|güven|guven|trust|itibar/.test(normalized)) return 'Güven';
  if (/kaynak|bütçe|butce|ekip|resource|morale|moral/.test(normalized)) return 'Kaynak';
  if (/risk|baskı|baski/.test(normalized)) return 'Risk';
  switch (normalized) {
    case 'risk':
    case 'baskı':
      return 'Baskı';
    case 'trust':
    case 'güven':
    case 'itibar':
      return 'Güven';
    case 'authority':
      return 'Yetki';
    case 'happiness':
      return 'Mutluluk';
    case 'resource':
    case 'bütçe':
      return 'Bütçe';
    case 'district':
      return 'Bölge';
    case 'ilerleme':
    case 'progress':
      return 'İlerleme';
    case 'fırsat':
    case 'opportunity':
      return 'Fırsat';
    default:
      return label.length <= 12 ? label : label.slice(0, 12);
  }
}

function toneForValue(valueText: string): CenterRecentImpactTone {
  const numeric = Number(valueText.replace(/[^\d\-+]/g, ''));
  if (!Number.isFinite(numeric) || numeric === 0) return 'neutral';
  return numeric > 0 ? 'positive' : 'warning';
}

function normalizeImpactChip(label: string, valueText: string): CenterRecentImpactChip {
  const shortLabel = mapImpactLabel(label);
  const cleaned = valueText.trim();
  const numeric = cleaned.match(/^([+−-]?\d[\d.,]*)/)?.[1];
  if (numeric) {
    return {
      id: `${shortLabel}-${numeric}`,
      label: shortLabel,
      valueText: numeric,
      tone: toneForValue(numeric),
    };
  }
  return {
    id: `${shortLabel}-${cleaned}`,
    label: shortLabel,
    valueText: cleaned.length <= 14 ? cleaned : cleaned.slice(0, 14),
    tone: 'neutral',
  };
}

function statusLabelForTone(tone: CenterRecentImpactTone, day?: number): string {
  if (day !== undefined && day <= 1) return 'Kayda geçti';
  switch (tone) {
    case 'positive':
      return 'Olumlu';
    case 'mixed':
      return 'Karma';
    case 'warning':
      return 'İzle';
    case 'critical':
      return 'Kritik';
    default:
      return 'Kayda geçti';
  }
}

function clampText(value: string | undefined, limit: number): string | undefined {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function buildRecentImpactAction(
  nextActions: CenterNextActionCard[],
): CenterHubAction | undefined {
  const action: CenterHubAction = {
    label: 'Raporda İncele',
    route: '/reports',
    actionKey: 'open_report',
    enabled: true,
  };
  const actionCanonical = normalizeCenterActionKey(action);
  const actionFamily = getCenterActionFamily(actionCanonical);

  const conflicts = nextActions.some((nextAction) => {
    const nextCanonical = normalizeCenterActionKey({
      actionKey: nextAction.actionKey,
      canonicalKey: nextAction.canonicalKey,
      id: nextAction.id,
      label: nextAction.title,
    });
    const nextFamily = getCenterActionFamily(nextCanonical);
    return (
      (Boolean(action.route) && nextAction.routeKey === action.route) ||
      nextCanonical === actionCanonical ||
      nextFamily === actionFamily
    );
  });

  return conflicts ? undefined : action;
}

function hiddenRecentImpactSummary(): CenterRecentImpactSummaryPresentation {
  return {
    visibility: 'hidden',
    title: 'Son Etki',
    statusLabel: '',
    tone: 'neutral',
    chips: [],
  };
}

export function buildCenterRecentImpactSummary(
  presentation: CenterHomeCoreSections,
  recentDecision?: DecisionRecord | null,
  nextActions: CenterNextActionCard[] = [],
): CenterRecentImpactSummaryPresentation {
  const { activeTarget } = presentation;
  const reaction = recentDecision
    ? buildPostDecisionCityReactionFromRecord({ record: recentDecision })
    : null;

  if (reaction) {
    const day = recentDecision?.day;
    const simpleDayOne = day !== undefined && day <= 1;
    const tone = reaction.tone;
    const secondaryAction = buildRecentImpactAction(nextActions);
    const socialEcho = buildPostDecisionSocialEchoPresentation({
      cityReaction: reaction,
      surface: 'recentImpact',
      day,
      excludeMessages: [reaction.shortSummary, reaction.advisorNote],
    });

    return {
      visibility: 'visible',
      id: reaction.reactionId,
      eventId: reaction.eventId,
      districtId: reaction.districtId,
      districtName: reaction.districtName,
      title: 'Son Etki',
      subtitle: clampText(
        simpleDayOne ? reaction.recentImpactCard.subtitle : reaction.shortSummary,
        96,
      ),
      targetTitle: clampText(
        simpleDayOne ? 'İlk etki rapora işlendi' : reaction.headline,
        54,
      ),
      footerLine: reaction.advisorNote,
      compactSummary: clampText(reaction.shortSummary, 88),
      socialLine: socialEcho
        ? clampText(`${socialEcho.title}: ${socialEcho.message}`, 92)
        : undefined,
      advisorLine: socialEcho ? undefined : clampText(reaction.advisorNote, 92),
      statusLabel: statusLabelForTone(tone, day),
      tone,
      secondaryAction,
      actionKey: secondaryAction?.actionKey,
      chips: reaction.impactItems.slice(0, 3).map((impact) => ({
        id: `reaction-${impact.id}`,
        label: mapImpactLabel(impact.label),
        valueText: impact.valueText,
        tone: impact.tone,
      })),
    };
  }

  const isCompleted =
    activeTarget.status === 'completed' || activeTarget.visibility === 'completed';

  if (!isCompleted) {
    return hiddenRecentImpactSummary();
  }

  const chips: CenterRecentImpactChip[] = [];

  if (activeTarget.reward?.valueText) {
    chips.push(
      normalizeImpactChip(activeTarget.reward.label || 'Bütçe', activeTarget.reward.valueText),
    );
  } else if (activeTarget.reward?.label) {
    chips.push({
      id: 'reward-label',
      label: 'Ödül',
      valueText: activeTarget.reward.label,
      tone: 'positive',
    });
  }

  activeTarget.impactPreview.slice(0, 4).forEach((impact) => {
    const chip = normalizeImpactChip(impact.label, impact.valueText);
    chips.push({
      ...chip,
      id: `impact-${impact.id}`,
      tone: impactChipTone(impact.tone, impact.label),
    });
  });

  if (chips.length === 0) {
    return hiddenRecentImpactSummary();
  }

  const signalLine = presentation.operationSignals.signals[0]?.title;
  const secondaryAction = buildRecentImpactAction(nextActions);

  return {
    visibility: 'visible',
    title: 'Son Etki',
    subtitle: 'Sonuç etkisi şehir nabzına işlendi.',
    targetTitle:
      activeTarget.title && !/ilk olay|merkez masası/i.test(activeTarget.title)
        ? activeTarget.title
        : 'İlk etki rapora işlendi',
    footerLine: signalLine ? `Yeni sinyal: ${signalLine}` : 'Rapor hafızasına eklendi',
    compactSummary: 'Sonuç etkisi şehir nabzına işlendi.',
    socialLine: signalLine ? `Yeni sinyal: ${signalLine}` : undefined,
    advisorLine: presentation.advisorSuggestion.recommendation || undefined,
    statusLabel: 'Kayda geçti',
    tone: 'neutral',
    secondaryAction,
    actionKey: secondaryAction?.actionKey,
    chips: chips.slice(0, 3),
  };
}

function collectAdvisorDedupeLines(
  presentation: CenterHomeCoreSections,
  nextActions: CenterNextActionCard[],
): string[] {
  const lines = [
    presentation.activeTarget.title,
    presentation.activeTarget.description,
    presentation.activeTarget.cta.label,
    presentation.recommendedPlan.body,
    presentation.citySummary.primaryInsight?.text,
  ];

  nextActions.forEach((action) => {
    lines.push(action.title, action.subtitle);
  });

  return lines.filter((line): line is string => Boolean(line?.trim()));
}

export function buildCenterAdvisorMiniDirective(
  presentation: CenterHomeCoreSections,
  nextActions: CenterNextActionCard[],
  strategicAdvisorHint?: string,
): CenterAdvisorMiniDirectivePresentation {
  const advisor = presentation.advisorSuggestion;
  const hidden =
    advisor.visibility === 'hidden' ||
    advisor.visibility === 'empty' ||
    !advisor.recommendation.trim();

  if (hidden) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      directive: '',
      cta: { label: 'Devam', actionKey: 'none' },
    };
  }

  const directive = advisor.recommendation.trim();
  const dedupeLines = collectAdvisorDedupeLines(presentation, nextActions);

  if (
    dedupeLines.some((line) => linesAreDuplicate(directive, line)) ||
    linesAreDuplicate(directive, strategicAdvisorHint)
  ) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      directive,
      cta: { label: 'Devam', actionKey: 'none' },
    };
  }

  const cta = advisor.action?.enabled
    ? {
        label: advisor.action.label,
        route: advisor.action.route,
        actionKey: advisor.action.actionKey,
        enabled: true,
      }
    : {
        label: 'Planı Gör',
        route: presentation.recommendedPlan.cta?.route ?? '/events',
        actionKey: presentation.recommendedPlan.cta?.actionKey ?? 'view_plan',
        enabled: true,
      };

  return {
    visibility: 'visible',
    advisorName: advisor.advisorName,
    directive,
    cta,
  };
}

function resolveDistrictName(presentation: CenterHomeCoreSections): string {
  const target = presentation.activeTarget;
  const safeFallback =
    DOMAIN_DISTRICT_NAMES[target.domain] ??
    presentation.headerSummary.displayCityName ??
    'Merkez Bölgesi';
  const isUnsafeDistrictName = (value: string | undefined): boolean => {
    const normalized = normalizeLine(value);
    return (
      !normalized ||
      normalized === 'ilk olay' ||
      normalized === 'günlük hedef' ||
      normalized === 'başlangıç' ||
      normalized === 'baslangic' ||
      normalized.includes('taşma') ||
      normalized.includes('tasma') ||
      normalized.includes('olay') ||
      normalized.includes('hedef tamamlandı') ||
      normalized.includes('hedef tamamlandi')
    );
  };
  const subtitle = target.subtitle?.replace(/^konum:\s*/i, '').trim();
  const subtitleName = subtitle?.split('·')[0]?.trim() || subtitle;
  if (!isUnsafeDistrictName(subtitleName)) return subtitleName!;

  const category = target.categoryLabel?.trim();
  if (!isUnsafeDistrictName(category)) return category!;

  const portfolioTitle = presentation.portfolioSurface.items[0]?.title?.trim();
  if (portfolioTitle && portfolioTitle.length <= 28 && !isUnsafeDistrictName(portfolioTitle)) {
    return portfolioTitle;
  }

  const signalSource = presentation.operationSignals.signals[0]?.sourceLabel?.trim();
  if (
    signalSource &&
    signalSource.length <= 28 &&
    /bölge|bolge|mahalle|pazar|sokak|vadi|merkez|sanayi|yenişehir|yenisehir/i.test(signalSource) &&
    !isUnsafeDistrictName(signalSource)
  ) {
    return signalSource;
  }

  const focusItem = presentation.operationFocus.items.find((item) => item.title.trim());
  if (focusItem?.title && focusItem.title.length <= 28 && !isUnsafeDistrictName(focusItem.title)) {
    return focusItem.title;
  }

  return safeFallback;
}

function resolveTrustLabel(presentation: CenterHomeCoreSections): string {
  const metric =
    presentation.citySummary.metrics.find((item) => item.id === 'trust') ??
    presentation.citySummary.metrics.find((item) => item.id === 'reputation');
  if (metric) {
    const numeric = metric.valueText.replace(/[^\d]/g, '');
    return numeric ? `Güven ${numeric}` : `Güven ${metric.valueText}`;
  }
  const authorityChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'authority');
  if (authorityChip) return `Güven ${authorityChip.valueText}`;
  return 'Güven dengede';
}

function resolveRiskLabel(presentation: CenterHomeCoreSections): string {
  const metric = presentation.citySummary.metrics.find((item) => item.id === 'risk');
  if (metric) {
    switch (metric.tone) {
      case 'success':
      case 'stable':
        return 'Risk Düşük';
      case 'warning':
        return 'Risk Orta';
      case 'urgent':
        return 'Risk Yüksek';
      default:
        break;
    }
    return `Risk ${metric.valueText}`;
  }
  const urgentSignals = presentation.operationSignals.signals.filter(
    (signal) => signal.severity === 'urgent' || signal.severity === 'high',
  ).length;
  if (urgentSignals === 0) return 'Risk Düşük';
  if (urgentSignals === 1) return 'Risk Orta';
  return 'Risk Yüksek';
}

function resolveOpportunityLabel(presentation: CenterHomeCoreSections): string {
  const insight = presentation.citySummary.primaryInsight?.text?.trim();
  if (insight) {
    const short = insight.length > 42 ? `${insight.slice(0, 41)}…` : insight;
    return `Fırsat: ${short}`;
  }
  const signal = presentation.operationSignals.signals.find(
    (item) => item.tone !== 'warning' && item.tone !== 'urgent',
  );
  if (signal?.title) return `Fırsat: ${signal.title}`;
  const focusSubtitle = presentation.operationFocus.items[0]?.subtitle?.trim();
  if (focusSubtitle) return `Fırsat: ${focusSubtitle}`;
  return 'Fırsat: Saha hareketlendi';
}

function resolveDevelopmentLabel(presentation: CenterHomeCoreSections): string {
  const happiness = presentation.citySummary.metrics.find((item) => item.id === 'happiness');
  if (happiness?.valueText.includes('%')) return happiness.valueText;
  const insight = presentation.citySummary.primaryInsight?.text?.trim();
  if (insight && /%\d|\+?\d+%/.test(insight)) {
    const match = insight.match(/(\+?\d+%)/);
    if (match) return match[1];
  }
  return '+18%';
}

function resolvePopulationLabel(presentation: CenterHomeCoreSections): string {
  const reputation = presentation.citySummary.metrics.find((item) => item.id === 'reputation');
  if (reputation?.valueText && /\d/.test(reputation.valueText) && !reputation.valueText.startsWith('%')) {
    return reputation.valueText;
  }
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  const day = Number(dayChip?.valueText.match(/\d+/)?.[0] ?? 1);
  const population = 18540 + day * 120;
  return population.toLocaleString('tr-TR');
}

function resolveDemandLabel(presentation: CenterHomeCoreSections): string {
  const risk = resolveRiskLabel(presentation);
  return risk.replace(/^Risk\s*/i, '').trim() || 'Orta';
}

export function buildCenterDistrictFocus(
  presentation: CenterHomeCoreSections,
): CenterDistrictFocusPresentation {
  const districtName = resolveDistrictName(presentation);
  const domainLabel = DOMAIN_DISTRICT_NAMES[presentation.activeTarget.domain];

  return {
    visibility: 'visible',
    districtName,
    trustLabel: resolveTrustLabel(presentation),
    riskLabel: resolveRiskLabel(presentation),
    opportunityLabel: resolveOpportunityLabel(presentation),
    developmentLabel: resolveDevelopmentLabel(presentation),
    populationLabel: resolvePopulationLabel(presentation),
    demandLabel: resolveDemandLabel(presentation),
    domainLabel: domainLabel !== districtName ? domainLabel : undefined,
    cta: {
      label: 'Bölgeyi Yönet',
      route: '/risks',
      actionKey: 'open_map',
      enabled: true,
    },
  };
}

export function buildCenterUnlockPreviewMini(
  presentation: CenterHomeCoreSections,
): CenterUnlockPreviewMiniPresentation {
  const candidates: {
    featureTitle: string;
    unlockCondition: string;
    iconKey: string;
    routeKey?: string;
    actionKey?: string;
    priority: number;
  }[] = [];

  presentation.continuationCards.cards.forEach((card) => {
    const condition = card.lockedReason?.trim() || card.body?.trim();
    if (!isClearUnlockCondition(condition)) return;
    candidates.push({
      featureTitle: card.title,
      unlockCondition: condition!,
      iconKey: card.iconKey,
      routeKey: card.route,
      actionKey: card.actionKey,
      priority: card.kind === 'authority' || card.kind === 'next_unlock' ? 90 : 70,
    });
  });

  presentation.quickActions.items.forEach((item) => {
    if (item.status !== 'locked' || !isClearUnlockCondition(item.lockedReason)) return;
    candidates.push({
      featureTitle: item.label,
      unlockCondition: item.lockedReason!,
      iconKey: item.iconKey,
      routeKey: item.route,
      actionKey: item.actionKey,
      priority: 60,
    });
  });

  const unlockLine = presentation.operationFocus.commandPanel?.recommendedMove.unlockLine?.trim();
  if (isClearUnlockCondition(unlockLine)) {
    candidates.push({
      featureTitle: presentation.operationFocus.commandPanel!.recommendedMove.title,
      unlockCondition: unlockLine!,
      iconKey: 'grid-outline',
      routeKey: presentation.operationFocus.commandPanel?.recommendedMove.route,
      actionKey: 'start_operation',
      priority: 80,
    });
  }

  if (presentation.quickActions.visibility === 'locked' && presentation.quickActions.helperText) {
    const helper = presentation.quickActions.helperText.trim();
    if (isClearUnlockCondition(helper)) {
      candidates.push({
        featureTitle: 'Hızlı Komutlar',
        unlockCondition: helper,
        iconKey: 'lock-closed-outline',
        priority: 50,
      });
    }
  }

  const best = [...candidates].sort((left, right) => right.priority - left.priority)[0];
  if (!best) {
    return {
      visibility: 'hidden',
      featureTitle: '',
      unlockCondition: '',
      iconKey: 'lock-closed-outline',
    };
  }

  return {
    visibility: 'visible',
    featureTitle: best.featureTitle,
    unlockCondition: best.unlockCondition,
    iconKey: best.iconKey,
    routeKey: best.routeKey,
    actionKey: best.actionKey,
  };
}

export function centerUnlockConditionIsClear(text: string | undefined): boolean {
  return isClearUnlockCondition(text);
}

export function buildCenterHubDepthPresentation(
  presentation: CenterHomeCoreSections,
  nextActions: CenterNextActionCard[],
  strategicAdvisorHint?: string,
  recentDecision?: DecisionRecord | null,
): CenterHubDepthPresentation {
  return {
    recentImpactSummary: buildCenterRecentImpactSummary(
      presentation,
      recentDecision,
      nextActions,
    ),
    advisorMiniDirective: buildCenterAdvisorMiniDirective(
      presentation,
      nextActions,
      strategicAdvisorHint,
    ),
    districtFocus: buildCenterDistrictFocus(presentation),
    unlockPreviewMini: buildCenterUnlockPreviewMini(presentation),
  };
}
