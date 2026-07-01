import { lineDuplicatesAvoidLines, normalizePresentationText } from '@/core/presentationDedupe';
import type { HubDisclosureBand } from './centerHubDensityPresentation';
import {
  HUB_DENSITY_LIMITS,
  HUB_LIGHT_PREMIUM_THEME,
  hubSectionIsHidden,
  resolveHubFeedItemCap,
  resolveHubNextMovesCap,
  resolveHubQuickActionsCap,
  type HubLayoutSectionKey,
  type HubThemeTone,
} from './centerHubDensityPolicy';
import type { CenterHomePresentation } from './centerHomePresentation';
import type {
  CenterHubAction,
  CenterNextActionCard,
} from './centerHubGameplayPresentation';
import type { MiniCityFeedItem } from './centerMiniCityFeedPresentation';
import {
  buildCenterHubFirstViewportPulseBundle,
  buildCenterGameFirstCityPulseFromFeed,
  type CenterHubFirstViewportPulseBundle,
} from './centerHubPulsePresentation';
import {
  buildHubPrimaryCtaPresentation,
  hubPrimaryCtaToHubAction,
  type HubPrimaryCtaPresentation,
} from './centerHubNextBestActionPresentation';

export type CenterGameFirstHeader = {
  playerName: string;
  cityName: string;
  dayLabel: string;
  rankLabel?: string;
  resourcePills: { id: string; label: string; valueText: string; iconKey?: string }[];
  criticalSignal?: string;
  notificationRoute?: string;
};

export type CenterTodayFocusOperationMeta = {
  districtLabel?: string;
  phaseLabel?: string;
  riskLabel?: string;
  mode?: 'active';
};

export type CenterTodayFocusPresentation = {
  visibility: 'visible' | 'hidden';
  sectionTitle: string;
  goalSentence: string;
  whyImportant: string;
  nextActionSentence: string;
  cta: CenterHubAction;
  progressRatio?: number;
  stageLabel?: string;
  operationMeta?: CenterTodayFocusOperationMeta;
};

export type CenterActiveOperationFocusMode =
  | 'active'
  | 'recommended'
  | 'signal'
  | 'dailyGoal'
  | 'fallback';

export type CenterActiveOperationFocusPresentation = {
  visibility: 'visible' | 'hidden';
  mode: CenterActiveOperationFocusMode;
  operationName: string;
  districtLabel?: string;
  phaseLabel?: string;
  riskLabel?: string;
  expectedImpact?: string;
  nextDecision?: string;
  cta: CenterHubAction;
};

export type CenterNextMoveItem = {
  id: string;
  title: string;
  description: string;
  impactTag?: string;
  lockReason?: string;
  disabled?: boolean;
  iconKey: string;
  accent: 'green' | 'gold' | 'amber' | 'sage';
  cta: CenterHubAction;
};

export type CenterNextMovesPresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  subtitle?: string;
  moves: CenterNextMoveItem[];
};

export type CenterGameFirstCityPulseItem = {
  id: string;
  message: string;
  detail?: string;
  tone: MiniCityFeedItem['tone'];
  sourceLabel: string;
  type: MiniCityFeedItem['type'];
  routeKey?: string;
  actionKey?: string;
};

export type CenterGameFirstCityPulse = {
  visibility: 'visible' | 'hidden';
  title: string;
  subtitle: string;
  statusPill: string;
  items: CenterGameFirstCityPulseItem[];
};

export type CenterDistrictSpotlightPresentation = {
  visibility: 'visible' | 'hidden';
  districtName: string;
  trustBand: string;
  dominantIssue?: string;
  latestDevelopment?: string;
  suggestedAction?: string;
  cta: CenterHubAction;
};

export type CenterGameFirstAdvisorPresentation = {
  visibility: 'visible' | 'hidden';
  advisorName: string;
  recommendation: string;
  rationale?: string;
  suggestedAction?: CenterHubAction;
  riskWarning?: string;
  trustIndicator?: string;
};

export type CenterGameFirstProgressionPresentation = {
  visibility: 'visible' | 'hidden';
  sectionTitle: string;
  rankLabel: string;
  nextUnlockLabel: string;
  streakLabel?: string;
  periodGoalLabel?: string;
  progressPercent?: number;
  cta?: CenterHubAction;
};

export type CenterGameFirstQuickActionItem = {
  id: string;
  title: string;
  subtitle?: string;
  iconKey: string;
  accent: 'green' | 'gold' | 'sage' | 'amber';
  disabled?: boolean;
  lockReason?: string;
  actionKey?: string;
  cta: CenterHubAction;
};

export type CenterGameFirstQuickActionsPresentation = {
  visibility: 'visible' | 'hidden';
  title: string;
  actions: CenterGameFirstQuickActionItem[];
};

export type CenterHubDensityLayout = {
  themeTone: HubThemeTone;
  mergedPrimaryFocus: boolean;
  hiddenSections: HubLayoutSectionKey[];
  densityReason?: string;
  duplicateCityPulseSuppressed: boolean;
  firstViewportPrimaryCtaCount: number;
};

export type CenterHubGameFirstPresentation = {
  densityBand: HubDisclosureBand;
  fallbackReason?: string;
  themeTone: HubThemeTone;
  densityLayout: CenterHubDensityLayout;
  primaryCta: HubPrimaryCtaPresentation;
  firstViewportPulse: CenterHubFirstViewportPulseBundle;
  header: CenterGameFirstHeader;
  todayFocus: CenterTodayFocusPresentation;
  activeOperationFocus: CenterActiveOperationFocusPresentation;
  nextMoves: CenterNextMovesPresentation;
  cityPulse: CenterGameFirstCityPulse;
  districtSpotlight: CenterDistrictSpotlightPresentation;
  advisor: CenterGameFirstAdvisorPresentation;
  progression: CenterGameFirstProgressionPresentation;
  quickActions: CenterGameFirstQuickActionsPresentation;
};

export type {
  CenterHubFirstViewportPulseBundle,
  CenterHubCompactPulsePresentation,
  CenterHubCompactAdvisorPresentation,
} from './centerHubPulsePresentation';
export type { HubPrimaryCtaPresentation, HubPrimaryCtaIntent } from './centerHubNextBestActionPresentation';
export { HUB_PRIMARY_CTA_LABELS } from './centerHubNextBestActionPresentation';
export {
  HUB_DENSITY_LIMITS,
  HUB_LIGHT_PREMIUM_THEME,
  hubSectionLayoutZone,
  hubSectionIsHidden,
  resolveHubFeedItemCap,
  resolveHubQuickActionsCap,
} from './centerHubDensityPolicy';
export type { HubLayoutSectionKey, HubThemeTone } from './centerHubDensityPolicy';

const WEAK_CTA = /^(devam et|detay|işlem yap|detaya git|tümünü gör)$/i;

function normalizeLine(value: string | null | undefined): string {
  return normalizePresentationText(value);
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  return lineDuplicatesAvoidLines(a, [b]);
}

function clampText(value: string | undefined, limit: number): string {
  const cleaned = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!cleaned) return '';
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function resolveDay(presentation: Omit<CenterHomePresentation, 'gameFirst'>): number {
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  return Number(dayChip?.valueText.match(/\d+/)?.[0] ?? presentation.hubDensity.day ?? 1);
}

function isWeakCta(label: string | undefined): boolean {
  return WEAK_CTA.test(label?.trim() ?? '');
}

function strengthenCta(
  label: string | undefined,
  fallback: string,
  route?: string,
  actionKey = 'open_domain',
): CenterHubAction {
  const cleaned = label?.trim() ?? '';
  const resolved = !cleaned || isWeakCta(cleaned) ? fallback : cleaned;
  return {
    label: resolved,
    route,
    actionKey,
    enabled: Boolean(route),
  };
}

function isActiveOperationInProgress(presentation: Omit<CenterHomePresentation, 'gameFirst'>): boolean {
  const target = presentation.activeTarget;
  return (
    target.visibility === 'visible' &&
    target.status === 'in_progress' &&
    (target.progress?.progressRatio ?? 0) < 1
  );
}

function isTargetCompleted(presentation: Omit<CenterHomePresentation, 'gameFirst'>): boolean {
  const target = presentation.activeTarget;
  return (
    target.status === 'completed' ||
    target.visibility === 'completed' ||
    (target.progress?.progressRatio ?? 0) >= 1
  );
}

function resolvePhaseLabel(presentation: Omit<CenterHomePresentation, 'gameFirst'>): string | undefined {
  const currentStep = presentation.recommendedPlan.steps?.find((step) => step.state === 'current');
  if (currentStep?.label) return currentStep.label;
  const progress = presentation.activeTarget.progress?.valueText?.trim();
  if (progress) return `Aşama ${progress}`;
  return undefined;
}

function resolveDistrictLabel(presentation: Omit<CenterHomePresentation, 'gameFirst'>): string | undefined {
  const subtitle = presentation.activeTarget.subtitle?.replace(/^konum:\s*/i, '').trim();
  if (subtitle) return subtitle.split('·')[0]?.trim() || subtitle;
  return presentation.districtFocus.districtName || undefined;
}

function resolveRiskLabel(presentation: Omit<CenterHomePresentation, 'gameFirst'>): string | undefined {
  const urgent = presentation.operationSignals.signals.filter(
    (signal) => signal.severity === 'urgent' || signal.severity === 'high',
  ).length;
  if (urgent >= 2) return 'Risk Yüksek';
  if (urgent === 1) return 'Risk Orta';
  const riskMetric = presentation.citySummary.metrics.find((metric) => metric.id === 'risk');
  if (riskMetric?.tone === 'urgent' || riskMetric?.tone === 'warning') return 'Risk Orta';
  return presentation.hubDensity.band === 'day1' ? undefined : 'Risk Dengede';
}

function resolveExpectedImpact(presentation: Omit<CenterHomePresentation, 'gameFirst'>): string | undefined {
  const impact = presentation.activeTarget.impactPreview[0];
  if (impact) return `${impact.label} ${impact.valueText}`.trim();
  const signal = presentation.operationSignals.signals[0];
  if (signal?.helperText) return signal.helperText;
  return undefined;
}

function buildHeader(presentation: Omit<CenterHomePresentation, 'gameFirst'>): CenterGameFirstHeader {
  const { headerSummary } = presentation;
  const dayChip = headerSummary.resourceChips.find((chip) => chip.id === 'day');
  const resourcePills = headerSummary.resourceChips
    .filter((chip) => chip.id !== 'day')
    .slice(0, 3)
    .map((chip) => ({
      id: chip.id,
      label: chip.label,
      valueText: chip.valueText,
      iconKey: chip.iconKey,
    }));

  const topSignal = [...presentation.operationSignals.signals].sort((left, right) => {
    const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
    return weight[right.severity] - weight[left.severity];
  })[0];

  let criticalSignal: string | undefined;
  if (topSignal && (topSignal.severity === 'urgent' || topSignal.severity === 'high')) {
    criticalSignal = clampText(topSignal.title, 48);
  } else if (presentation.hubDensity.maintenanceSignal?.tone === 'critical') {
    criticalSignal = clampText(presentation.hubDensity.maintenanceSignal.title, 48);
  }

  return {
    playerName: headerSummary.playerName,
    cityName: headerSummary.displayCityName,
    dayLabel: dayChip?.valueText ?? 'Gün 1',
    rankLabel: headerSummary.levelLabel,
    resourcePills,
    criticalSignal,
    notificationRoute: headerSummary.notification.targetRoute,
  };
}

function buildTodayFocus(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  day: number,
  band: HubDisclosureBand,
): CenterTodayFocusPresentation {
  const target = presentation.activeTarget;
  const completed = isTargetCompleted(presentation);

  if (completed) {
    const nextMove = presentation.nextActions.actions.find((action) => action.routeKey && !action.disabled);
    const goal = nextMove?.title ?? presentation.recommendedPlan.title ?? 'Sıradaki operasyonu seç';
    return {
      visibility: 'visible',
      sectionTitle: 'Bugünün Odağı',
      goalSentence: clampText(goal, 72),
      whyImportant: 'Son operasyonun etkisi şehre işlendi; sıradaki hamle güveni korur.',
      nextActionSentence: clampText(
        nextMove?.subtitle ?? presentation.recommendedPlan.body,
        96,
      ),
      cta: strengthenCta(
        nextMove?.title ? `“${nextMove.title}” hamlesine git` : undefined,
        'Sıradaki operasyonu aç',
        nextMove?.routeKey ?? presentation.recommendedPlan.cta?.route,
        nextMove?.actionKey ?? 'start_operation',
      ),
      progressRatio: 0.2,
      stageLabel: 'Yeni hedef',
    };
  }

  const district = resolveDistrictLabel(presentation);
  const phase = resolvePhaseLabel(presentation);

  if (band === 'day1' || day <= 1) {
    const isDay1Entry = target.id === 'day1-entry';
    const goal = isDay1Entry
      ? 'İlk operasyonu başlat ve şehri tanı'
      : clampText(target.title, 72);
    const why = isDay1Entry
      ? 'İlk gün tek hedef: sahayı oku, doğru ekiple müdahale et.'
      : clampText(target.helperText ?? target.description, 96);
    const nextAction = phase
      ? `${phase} adımını tamamla, sonra ekibi yönlendir.`
      : 'Olayı incele, planı netleştir ve ekibi sahaya gönder.';
    return {
      visibility: 'visible',
      sectionTitle: 'Bugünün Odağı',
      goalSentence: goal,
      whyImportant: why,
      nextActionSentence: nextAction,
      cta: strengthenCta(
        target.cta.label,
        isDay1Entry ? 'İlk olayı incele' : 'Operasyona git',
        target.cta.route,
        target.cta.actionKey,
      ),
      progressRatio: target.progress?.progressRatio ?? 0.15,
      stageLabel: phase ?? 'Başlangıç',
    };
  }

  const signalTitle = presentation.operationSignals.signals[0]?.title;
  const goalParts = [district ? `${district}'de` : null, clampText(target.title, 56)]
    .filter(Boolean)
    .join(' ');
  const goalSentence =
    goalParts ||
    clampText(presentation.cityAgenda.goalTitle, 72) ||
    'Şehir önceliğini netleştir';

  let whyImportant = clampText(
    presentation.advisorSuggestion.reason ??
      presentation.recommendedPlan.body ??
      target.description,
    96,
  );
  if (band === 'openEnded' && presentation.hubDensity.maintenanceSignal) {
    const maintenanceHint = presentation.hubDensity.maintenanceSignal.subtitle;
    if (maintenanceHint && !linesAreDuplicate(whyImportant, maintenanceHint)) {
      whyImportant = clampText(`${whyImportant} ${maintenanceHint}`, 96);
    }
  }

  let nextActionSentence = '';
  const commandMove = presentation.operationFocus.commandPanel?.recommendedMove;
  if (commandMove?.description) {
    nextActionSentence = clampText(commandMove.description, 96);
  } else if (phase && district) {
    nextActionSentence = `${district}'de ${phase.toLowerCase()} fazını tamamla, doğru ekip ve araçla müdahale et.`;
  } else if (signalTitle) {
    nextActionSentence = `${signalTitle} sinyalini operasyona bağla.`;
  } else {
    nextActionSentence = clampText(target.helperText ?? target.description, 96);
  }

  return {
    visibility: target.visibility === 'hidden' ? 'hidden' : 'visible',
    sectionTitle: 'Bugünün Odağı',
    goalSentence,
    whyImportant,
    nextActionSentence,
    cta: strengthenCta(
      commandMove?.ctaLabel ?? target.cta.label,
      phase ? `${phase} fazına git` : 'Operasyona git',
      commandMove?.route ?? target.cta.route,
      target.cta.actionKey,
    ),
    progressRatio: target.progress?.progressRatio,
    stageLabel: phase,
  };
}

function buildActiveOperationFocus(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  day: number,
): CenterActiveOperationFocusPresentation {
  const target = presentation.activeTarget;
  const inProgress = isActiveOperationInProgress(presentation);
  const completed = isTargetCompleted(presentation);
  const district = resolveDistrictLabel(presentation);
  const phase = resolvePhaseLabel(presentation);
  const risk = resolveRiskLabel(presentation);
  const impact = resolveExpectedImpact(presentation);

  if (inProgress && !completed) {
    const nextDecision =
      presentation.operationFocus.commandPanel?.recommendedMove.description ??
      presentation.operationFocus.items[0]?.subtitle ??
      target.helperText;
    return {
      visibility: 'visible',
      mode: 'active',
      operationName: clampText(target.title, 64),
      districtLabel: district,
      phaseLabel: phase,
      riskLabel: risk,
      expectedImpact: impact,
      nextDecision: clampText(nextDecision, 88),
      cta: strengthenCta(
        target.cta.label,
        phase ? `${phase} fazını sürdür` : 'Operasyona dön',
        target.cta.route,
        target.cta.actionKey,
      ),
    };
  }

  const topSignal = presentation.operationSignals.signals[0];
  const recommended = presentation.operationFocus.commandPanel?.recommendedMove;

  if (recommended && recommended.enabled && recommended.state !== 'completed') {
    return {
      visibility: 'visible',
      mode: 'recommended',
      operationName: clampText(recommended.title, 64),
      districtLabel: district,
      phaseLabel: phase,
      riskLabel: risk,
      expectedImpact: recommended.rewardLine ?? impact,
      nextDecision: clampText(recommended.description, 88),
      cta: strengthenCta(
        recommended.ctaLabel,
        'Önerilen operasyonu aç',
        recommended.route,
        'start_operation',
      ),
    };
  }

  if (topSignal) {
    return {
      visibility: 'visible',
      mode: 'signal',
      operationName: clampText(topSignal.title, 64),
      districtLabel: topSignal.sourceLabel ?? district,
      riskLabel:
        topSignal.severity === 'urgent' || topSignal.severity === 'high' ? 'Acil sinyal' : risk,
      nextDecision: clampText(topSignal.description ?? presentation.operationSignals.summaryLine, 88),
      cta: strengthenCta(
        presentation.operationSignals.cta?.label,
        'Sinyali operasyona bağla',
        topSignal.route ?? presentation.operationSignals.cta?.route,
        topSignal.actionKey ?? 'view_signal',
      ),
    };
  }

  if (presentation.dailyReward.visibility === 'visible' && day <= 3) {
    return {
      visibility: 'visible',
      mode: 'dailyGoal',
      operationName: clampText(presentation.dailyReward.title, 64),
      nextDecision: clampText(presentation.dailyReward.helperText, 88),
      cta: strengthenCta(
        presentation.dailyReward.ctaLabel,
        'Günlük hedefe git',
        '/rewards',
        'view_rewards',
      ),
    };
  }

  if (completed || target.visibility === 'hidden') {
    return {
      visibility: 'hidden',
      mode: 'fallback',
      operationName: '',
      cta: { label: '', actionKey: 'none', enabled: false },
    };
  }

  return {
    visibility: 'visible',
    mode: 'fallback',
    operationName: clampText(target.title, 64),
    districtLabel: district,
    phaseLabel: phase,
    riskLabel: risk,
    nextDecision: clampText(target.description, 88),
    cta: strengthenCta(
      target.cta.label,
      'Günlük önceliğe git',
      target.cta.route,
      target.cta.actionKey,
    ),
  };
}

function resolveImpactTag(action: CenterNextActionCard, presentation: Omit<CenterHomePresentation, 'gameFirst'>): string | undefined {
  const label = action.title.toLowerCase();
  if (/ekip|team|personel/.test(label)) return 'müdahale süresi riskini azaltır';
  if (/rapor|report/.test(label)) return 'güven kırılımını gösterir';
  if (/ece|plan|öneri/.test(label)) return 'riskli seçimleri özetler';
  if (/harita|map|sinyal|signal/.test(label)) return 'bölge yoğunluğunu gösterir';
  if (/bakım|maintenance|araç|vehicle/.test(label)) return 'rota süresi riskini görünür kılar';
  if (/kaynak|resource|bütçe/.test(label)) return 'kaynak baskısını dengeler';
  const impact = presentation.activeTarget.impactPreview[0];
  if (impact) return `${impact.label.toLowerCase()} etkisini taşır`;
  return action.statusLabel;
}

function buildNextMoves(presentation: Omit<CenterHomePresentation, 'gameFirst'>): CenterNextMovesPresentation {
  const sourceActions = presentation.nextActions.actions;
  const usedTitles = new Set<string>();

  const moveCap = resolveHubNextMovesCap(presentation.hubDensity.band);
  const moves: CenterNextMoveItem[] = [];
  for (const action of sourceActions) {
    if (moves.length >= moveCap) break;
    const titleKey = normalizeLine(action.title);
    if (!titleKey || usedTitles.has(titleKey)) continue;
    usedTitles.add(titleKey);

    moves.push({
      id: action.id,
      title: action.title,
      description: clampText(action.subtitle ?? '', 72),
      impactTag: resolveImpactTag(action, presentation),
      disabled: action.disabled,
      iconKey: action.iconKey,
      accent: action.accent,
      cta: strengthenCta(
        action.title,
        'Hamleyi uygula',
        action.routeKey,
        action.actionKey,
      ),
    });
  }

  const minMoves = presentation.hubDensity.band === 'day1' ? 1 : 2;
  if (moves.length < minMoves && presentation.activeTarget.cta.enabled) {
    const fallbackTitle = presentation.activeTarget.cta.label;
    if (!usedTitles.has(normalizeLine(fallbackTitle))) {
      moves.push({
        id: 'fallback-primary',
        title: fallbackTitle,
        description: clampText(presentation.activeTarget.title, 72),
        impactTag: 'günün ana önceliğini taşır',
        iconKey: 'flag-outline',
        accent: 'gold',
        cta: strengthenCta(
          fallbackTitle,
          'Önceliğe git',
          presentation.activeTarget.cta.route,
          presentation.activeTarget.cta.actionKey,
        ),
      });
    }
  }

  return {
    visibility: moves.length > 0 ? 'visible' : 'hidden',
    title: 'Sıradaki Hamleler',
    subtitle:
      presentation.hubDensity.band === 'day1'
        ? 'Bugün için en doğru 1-2 adım.'
        : 'Her hamle şehir, kaynak veya güven üzerinde etki yaratır.',
    moves: moves.slice(0, moveCap),
  };
}

function buildCityPulse(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  band: HubDisclosureBand,
): CenterGameFirstCityPulse {
  return buildCenterGameFirstCityPulseFromFeed(presentation, band);
}

function buildDistrictSpotlight(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  band: HubDisclosureBand,
): CenterDistrictSpotlightPresentation {
  const district = presentation.districtFocus;
  if (band === 'day1') {
    return {
      visibility: 'hidden',
      districtName: district.districtName,
      trustBand: district.trustLabel,
      cta: district.cta,
    };
  }

  const dominantIssue =
    presentation.operationSignals.signals.find(
      (signal) => signal.severity === 'urgent' || signal.severity === 'high',
    )?.title ?? presentation.operationFocus.items[0]?.title;

  const latestDevelopment =
    presentation.recentImpactSummary.compactSummary ??
    presentation.miniCityFeed.items[0]?.title;

  return {
    visibility: 'visible',
    districtName: district.districtName,
    trustBand: district.trustLabel,
    dominantIssue: clampText(dominantIssue, 56),
    latestDevelopment: clampText(latestDevelopment, 72),
    suggestedAction: clampText(district.opportunityLabel.replace(/^Fırsat:\s*/i, ''), 72),
    cta: strengthenCta(district.cta.label, 'Haritada mahalleyi aç', district.cta.route, district.cta.actionKey),
  };
}

function buildAdvisor(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
  todayFocus: CenterTodayFocusPresentation,
): CenterGameFirstAdvisorPresentation {
  const advisor = presentation.advisorSuggestion;
  const mini = presentation.advisorMiniDirective;
  const band = presentation.hubDensity.band;

  const recommendation =
    mini.visibility === 'visible' && mini.directive.trim()
      ? mini.directive.trim()
      : advisor.recommendation.trim();

  if (!recommendation || linesAreDuplicate(recommendation, todayFocus.goalSentence)) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      recommendation: '',
    };
  }

  const rationale = clampText(advisor.reason ?? advisor.contextLine, 72);
  const riskWarning = clampText(advisor.caution, 56);
  const trustIndicator =
    advisor.confidence === 'high'
      ? 'Güvenilir öneri'
      : advisor.confidence === 'medium'
        ? 'Orta güven'
        : undefined;

  const suggestedAction =
    advisor.action?.enabled && !isWeakCta(advisor.action.label)
      ? {
          label: advisor.action.label,
          route: advisor.action.route,
          actionKey: advisor.action.actionKey,
          enabled: true,
        }
      : mini.visibility === 'visible' && mini.cta.enabled && !isWeakCta(mini.cta.label)
        ? mini.cta
        : undefined;

  const maxLen = band === 'day1' ? 88 : 120;
  if (recommendation.length > maxLen) {
    return {
      visibility: 'hidden',
      advisorName: advisor.advisorName,
      recommendation,
    };
  }

  return {
    visibility: 'visible',
    advisorName: advisor.advisorName,
    recommendation: clampText(recommendation, maxLen),
    rationale: band === 'day1' ? undefined : rationale,
    suggestedAction,
    riskWarning: band === 'day1' ? undefined : riskWarning,
    trustIndicator: band === 'openEnded' ? trustIndicator : undefined,
  };
}

function shouldMergePrimaryFocus(
  todayFocus: CenterTodayFocusPresentation,
  activeOp: CenterActiveOperationFocusPresentation,
): boolean {
  if (todayFocus.visibility !== 'visible' || activeOp.visibility !== 'visible') return false;
  if (activeOp.mode !== 'active') return false;

  const goalNorm = normalizeLine(todayFocus.goalSentence);
  const opNorm = normalizeLine(activeOp.operationName);
  if (!goalNorm || !opNorm) return false;

  return (
    goalNorm === opNorm ||
    goalNorm.includes(opNorm) ||
    opNorm.includes(goalNorm) ||
    linesAreDuplicate(todayFocus.goalSentence, activeOp.operationName)
  );
}

function districtDuplicatesPrimaryFocus(
  district: CenterDistrictSpotlightPresentation,
  todayFocus: CenterTodayFocusPresentation,
  activeOp: CenterActiveOperationFocusPresentation,
): boolean {
  const districtName = normalizeLine(district.districtName);
  if (!districtName) return false;

  const goal = normalizeLine(todayFocus.goalSentence);
  const opDistrict = normalizeLine(activeOp.districtLabel);
  return goal.includes(districtName) || opDistrict === districtName;
}

function applyPrimaryFocusMerge(
  todayFocus: CenterTodayFocusPresentation,
  activeOp: CenterActiveOperationFocusPresentation,
): void {
  todayFocus.operationMeta = {
    districtLabel: activeOp.districtLabel,
    phaseLabel: activeOp.phaseLabel,
    riskLabel: activeOp.riskLabel,
    mode: 'active',
  };
  if (activeOp.nextDecision && !linesAreDuplicate(todayFocus.whyImportant, activeOp.nextDecision)) {
    todayFocus.nextActionSentence = clampText(activeOp.nextDecision, 88);
  }
  activeOp.visibility = 'hidden';
}

function buildDensityLayout(input: {
  band: HubDisclosureBand;
  todayFocus: CenterTodayFocusPresentation;
  activeOperationFocus: CenterActiveOperationFocusPresentation;
  firstViewportPulse: CenterHubFirstViewportPulseBundle;
  districtSpotlight: CenterDistrictSpotlightPresentation;
  mergedPrimaryFocus: boolean;
}): CenterHubDensityLayout {
  const hiddenSections: HubLayoutSectionKey[] = [];

  if (input.mergedPrimaryFocus) {
    hiddenSections.push('activeOperationFocus');
  }

  const duplicateCityPulseSuppressed = input.firstViewportPulse.pulse.visibility === 'visible';
  if (duplicateCityPulseSuppressed) {
    hiddenSections.push('miniCityFeed', 'strategicPulse');
  }

  if (input.band === 'day1') {
    hiddenSections.push('districtSpotlight', 'progressImpact', 'strategicPulse', 'liveDevelopments');
  }

  if (
    input.districtSpotlight.visibility === 'visible' &&
    districtDuplicatesPrimaryFocus(
      input.districtSpotlight,
      input.todayFocus,
      input.activeOperationFocus,
    ) &&
    (input.mergedPrimaryFocus || input.activeOperationFocus.mode === 'active')
  ) {
    hiddenSections.push('districtSpotlight');
  }

  let densityReason: string | undefined;
  if (input.mergedPrimaryFocus) {
    densityReason = 'merged-primary-focus';
  } else if (duplicateCityPulseSuppressed) {
    densityReason = 'single-city-pulse';
  }

  return {
    themeTone: HUB_LIGHT_PREMIUM_THEME.themeTone,
    mergedPrimaryFocus: input.mergedPrimaryFocus,
    hiddenSections,
    densityReason,
    duplicateCityPulseSuppressed,
    firstViewportPrimaryCtaCount: HUB_DENSITY_LIMITS.firstViewportPrimaryCtaMax,
  };
}

function buildProgression(presentation: Omit<CenterHomePresentation, 'gameFirst'>): CenterGameFirstProgressionPresentation {
  const unlock = presentation.unlockPreviewMini;
  const agenda = presentation.cityAgenda;
  const header = presentation.headerSummary;
  const reward = presentation.dailyReward;
  const band = presentation.hubDensity.band;

  if (band === 'day1' && unlock.visibility !== 'visible') {
    return {
      visibility: 'hidden',
      sectionTitle: 'Yaklaşan Açılım',
      rankLabel: header.levelLabel ?? 'Başlangıç',
      nextUnlockLabel: '',
    };
  }

  const nextUnlock =
    unlock.visibility === 'visible'
      ? `${unlock.featureTitle}: ${unlock.unlockCondition}`
      : agenda.nextHint?.trim() ||
        clampText(agenda.summary, 72) ||
        'Sonraki yetki yakında açılır';

  const streakCurrent = Math.max(1, reward.today.dayIndex);
  const streakTotal = Math.max(7, reward.days.length || 7);

  return {
    visibility: 'visible',
    sectionTitle: 'Yaklaşan Açılım',
    rankLabel: header.playerRoleLabel || header.levelLabel || 'Şehir Yöneticisi',
    nextUnlockLabel: clampText(nextUnlock, 88),
    streakLabel: `Seri ${streakCurrent}/${streakTotal}`,
    periodGoalLabel: agenda.visibility === 'visible' ? agenda.goalTitle : undefined,
    progressPercent: (() => {
      const match = agenda.progressLabel.match(/(\d+)\s*%/);
      return match ? Number(match[1]) : undefined;
    })(),
    cta: unlock.routeKey
      ? {
          label: 'Yetki önizlemesi',
          route: unlock.routeKey,
          actionKey: unlock.actionKey ?? 'open_authority',
          enabled: true,
        }
      : band !== 'day1'
        ? {
            label: 'Gelişim şeridine git',
            route: '/progression',
            actionKey: 'open_authority',
            enabled: true,
          }
        : undefined,
  };
}

function buildQuickActions(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
): CenterGameFirstQuickActionsPresentation {
  const commands = presentation.quickCommands.commands;
  const usedLabels = new Set(
    presentation.nextActions.actions.map((item) => normalizeLine(item.title)),
  );
  const cap = resolveHubQuickActionsCap(presentation.hubDensity.band);

  const actions: CenterGameFirstQuickActionItem[] = [];
  for (const command of commands) {
    if (actions.length >= cap) break;
    const key = normalizeLine(command.title);
    if (usedLabels.has(key)) continue;
    actions.push({
      id: command.id,
      title: command.title,
      subtitle: command.subtitle,
      iconKey: command.iconKey,
      accent: command.accent,
      disabled: command.disabled,
      lockReason: command.unlockLabel,
      actionKey: command.actionKey,
      cta: strengthenCta(
        command.title,
        'Komutu çalıştır',
        command.routeKey,
        command.actionKey,
      ),
    });
  }

  return {
    visibility: actions.length > 0 ? 'visible' : 'hidden',
    title: 'Hızlı İşlemler',
    actions,
  };
}

export function buildCenterHubGameFirstPresentation(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
): CenterHubGameFirstPresentation {
  const band = presentation.hubDensity.band;
  const day = resolveDay(presentation);

  const primaryCta = buildHubPrimaryCtaPresentation(presentation);
  const todayFocus = buildTodayFocus(presentation, day, band);
  const activeOperationFocus = buildActiveOperationFocus(presentation, day);
  const nextMoves = buildNextMoves(presentation);
  const cityPulse = buildCityPulse(presentation, band);
  const districtSpotlight = buildDistrictSpotlight(presentation, band);
  const advisor = buildAdvisor(presentation, todayFocus);
  const progression = buildProgression(presentation);
  const quickActions = buildQuickActions(presentation);
  const firstViewportPulse = buildCenterHubFirstViewportPulseBundle({
    presentation,
    cityPulse,
    advisor,
    todayFocus,
    band,
  });

  const mergedPrimaryFocus = shouldMergePrimaryFocus(todayFocus, activeOperationFocus);
  if (mergedPrimaryFocus) {
    applyPrimaryFocusMerge(todayFocus, activeOperationFocus);
  }

  const densityLayout = buildDensityLayout({
    band,
    todayFocus,
    activeOperationFocus,
    firstViewportPulse,
    districtSpotlight,
    mergedPrimaryFocus,
  });

  if (hubSectionIsHidden(densityLayout.hiddenSections, 'districtSpotlight')) {
    districtSpotlight.visibility = 'hidden';
  }

  // Primary CTA overrides weak labels on hero and active operation focus surfaces.
  const primaryAction = hubPrimaryCtaToHubAction(primaryCta);
  if (todayFocus.visibility === 'visible' && primaryAction.enabled) {
    todayFocus.cta = primaryAction;
  }
  if (activeOperationFocus.visibility === 'visible' && primaryAction.enabled) {
    activeOperationFocus.cta = primaryAction;
  }

  let fallbackReason: string | undefined;
  if (activeOperationFocus.mode === 'fallback' && activeOperationFocus.visibility === 'visible') {
    fallbackReason = 'active-operation-fallback';
  } else if (activeOperationFocus.visibility === 'hidden') {
    fallbackReason = 'no-active-operation';
  }

  return {
    densityBand: band,
    fallbackReason,
    themeTone: densityLayout.themeTone,
    densityLayout,
    primaryCta,
    firstViewportPulse,
    header: buildHeader(presentation),
    todayFocus,
    activeOperationFocus,
    nextMoves,
    cityPulse,
    districtSpotlight,
    advisor,
    progression,
    quickActions,
  };
}

export function gameFirstHasDuplicateCopy(presentation: CenterHubGameFirstPresentation): boolean {
  const titles = [
    presentation.todayFocus.goalSentence,
    presentation.activeOperationFocus.operationName,
    ...presentation.nextMoves.moves.map((move) => move.title),
    ...presentation.cityPulse.items.map((item) => item.message),
    presentation.advisor.recommendation,
  ].filter(Boolean);

  const normalized = titles.map((title) => normalizeLine(title));
  return new Set(normalized).size !== normalized.length;
}

export function gameFirstWeakCtaCount(presentation: CenterHubGameFirstPresentation): number {
  const labels = [
    presentation.todayFocus.cta.label,
    presentation.activeOperationFocus.cta.label,
    ...presentation.nextMoves.moves.map((move) => move.cta.label),
    ...presentation.quickActions.actions.map((action) => action.cta.label),
    presentation.districtSpotlight.cta.label,
    presentation.advisor.suggestedAction?.label,
    presentation.progression.cta?.label,
  ].filter((label): label is string => Boolean(label?.trim()));

  return labels.filter((label) => isWeakCta(label)).length;
}
