import {
  buildEventEchoBundle,
  buildEchoContextFromEventResult,
  inferEchoDomainFromEvent,
} from '@/core/contentPacks/eventEchoSelectors';
import type { EventLikeForEcho } from '@/core/contentPacks/eventEchoTypes';
import { getPilotThemeForDay } from '@/core/pilotRhythm/pilotRhythmPresentation';

import type {
  BuildEventDomainFocusArgs,
  EventDomainFocusMetric,
  EventDomainFocusModel,
  EventDomainPresentationEventLike,
  EventDomainSurfacePriority,
  EventDomainUiFocus,
  EventDomainUiSurface,
} from './eventDomainPresentationTypes';

const FORBIDDEN_UI_WORDS = ['premium', 'satın al', 'paywall', 'kilitli', 'rank up', 'xp'] as const;

const DOMAIN_FOCUS_COPY: Record<
  Exclude<EventDomainUiFocus, 'generic_operation'>,
  Omit<EventDomainFocusModel, 'focus' | 'focusMetrics' | 'showOnDay1' | 'maxVisibleLines'>
> = {
  container: {
    title: 'Konteyner Baskısı',
    shortTitle: 'Konteyner',
    summary:
      'Bugünkü karar görünür temizlik etkisini ve yarına taşan konteyner baskısını belirler.',
    primaryLabel: 'Konteyner',
    secondaryLabel: 'Rota etkisi',
    tone: 'teal',
    iconKey: 'trash-outline',
    emphasisTags: ['Konteyner', 'Yarın etkisi'],
  },
  vehicle_route: {
    title: 'Araç ve Rota',
    shortTitle: 'Araç',
    summary:
      'Seçim bugünkü gecikmeyi azaltabilir, ancak araç yorgunluğunu yarına taşıyabilir.',
    primaryLabel: 'Araç yükü',
    secondaryLabel: 'Rota dengesi',
    tone: 'amber',
    iconKey: 'car-outline',
    emphasisTags: ['Araç', 'Rota'],
  },
  personnel: {
    title: 'Ekip Dayanıklılığı',
    shortTitle: 'Ekip',
    summary:
      'Aynı ekibi hız için kullanmak bugünü rahatlatır; rotasyon yarınki tempoyu korur.',
    primaryLabel: 'Ekip temposu',
    secondaryLabel: 'Moral',
    tone: 'mint',
    iconKey: 'people-outline',
    emphasisTags: ['Ekip', 'Moral'],
  },
  social: {
    title: 'Vatandaş Etkisi',
    shortTitle: 'Sosyal',
    summary:
      'Sorun küçük olsa bile görünürlük yüksekse sosyal nabız hızlı değişebilir.',
    primaryLabel: 'Sosyal nabız',
    secondaryLabel: 'Görünürlük',
    tone: 'coral',
    iconKey: 'chatbubbles-outline',
    emphasisTags: ['Sosyal', 'Güven'],
  },
  crisis_adjacent: {
    title: 'Kriz Eşiği',
    shortTitle: 'Risk',
    summary:
      'Henüz kriz yok; birleşen sinyaller bugün önleyici karar gerektirebilir.',
    primaryLabel: 'Risk sinyali',
    secondaryLabel: 'Önleyici hamle',
    tone: 'amber',
    iconKey: 'pulse-outline',
    emphasisTags: ['Risk', 'Önlem'],
  },
  district_balance: {
    title: 'Mahalle Dengesi',
    shortTitle: 'Denge',
    summary:
      'Bir mahallede hızlı sonuç almak diğer bölgelerde bekleme algısı yaratabilir.',
    primaryLabel: 'Denge',
    secondaryLabel: 'Öncelik',
    tone: 'neutral',
    iconKey: 'map-outline',
    emphasisTags: ['Mahalle', 'Denge'],
  },
  pilot_learning: {
    title: 'Öğrenme Odağı',
    shortTitle: 'Öğrenme',
    summary: 'Bugün amaç karar akışını net görmek ve temel saha sonucunu anlamak.',
    primaryLabel: 'Temel akış',
    tone: 'mint',
    iconKey: 'school-outline',
    emphasisTags: ['Öğrenme'],
  },
  pilot_final: {
    title: 'Pilot Finali',
    shortTitle: 'Final',
    summary:
      'Bugünkü kararlar pilot tarzını ve ana operasyon hazırlığını görünür kılar.',
    primaryLabel: 'Final',
    secondaryLabel: 'Ana operasyon',
    tone: 'teal',
    iconKey: 'flag-outline',
    emphasisTags: ['Final', 'Hazırlık'],
  },
};

const KEYWORD_RULES: { focus: EventDomainUiFocus; keywords: string[] }[] = [
  { focus: 'pilot_final', keywords: ['pilot final', 'ana operasyon', 'değerlendirme'] },
  {
    focus: 'district_balance',
    keywords: ['mahalle dengesi', 'bölgesel', 'öncelik', 'bekleme algısı'],
  },
  {
    focus: 'crisis_adjacent',
    keywords: ['kriz', 'sinyal', 'eşik', 'risk birleşimi', 'önleyici'],
  },
  {
    focus: 'social',
    keywords: [
      'sosyal nabız',
      'vatandaş',
      'esnaf',
      'görünürlük',
      'mahalle grubu',
      'şikayet',
      'takdir',
    ],
  },
  {
    focus: 'personnel',
    keywords: ['ekip', 'personel', 'moral', 'tempo', 'rotasyon', 'saha dayanıklılığı'],
  },
  {
    focus: 'vehicle_route',
    keywords: ['araç', 'kamyon', 'rota', 'bakım', 'gecikme', 'kapasite', 'servis yolu'],
  },
  {
    focus: 'container',
    keywords: [
      'konteyner',
      'iri atık',
      'atık',
      'çöp',
      'doluluk',
      'temizlik noktası',
    ],
  },
];

function normalizeText(event: EventDomainPresentationEventLike | null | undefined): string {
  if (!event) return '';
  return [
    event.id,
    event.title,
    event.description,
    event.category,
    event.eventType,
    event.contentCategory,
    event.contextTag,
    ...(event.filterTags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function mapPackDomainToFocus(domain: string): EventDomainUiFocus | null {
  const d = domain.toLowerCase();
  if (d.includes('container') || d === 'neighborhood_container') return 'container';
  if (d.includes('vehicle') || d.includes('route')) return 'vehicle_route';
  if (d.includes('personnel') || d.includes('staff')) return 'personnel';
  if (d.includes('social')) return 'social';
  if (d.includes('crisis')) return 'crisis_adjacent';
  if (d.includes('district') || d.includes('balance')) return 'district_balance';
  if (d.includes('final')) return 'pilot_final';
  return null;
}

function mapEchoDomainToUiFocus(domain: string): EventDomainUiFocus | null {
  switch (domain) {
    case 'container':
      return 'container';
    case 'vehicle':
    case 'route':
      return 'vehicle_route';
    case 'personnel':
      return 'personnel';
    case 'social':
      return 'social';
    case 'crisis_adjacent':
      return 'crisis_adjacent';
    case 'district_balance':
      return 'district_balance';
    case 'pilot_final':
      return 'pilot_final';
    default:
      return null;
  }
}

export function inferEventDomainUiFocus(
  eventLike: EventDomainPresentationEventLike | null | undefined,
): EventDomainUiFocus {
  if (!eventLike) return 'generic_operation';

  const text = normalizeText(eventLike);
  const id = (eventLike.id ?? '').toLowerCase();

  if (id.includes('csp1') || text.includes('neighborhood_container')) {
    return 'container';
  }
  if (id.includes('csp2')) {
    if (text.includes('vehicle_route') || id.includes('arac') || id.includes('rota')) {
      return 'vehicle_route';
    }
    if (text.includes('staff_pressure') || id.includes('ekip') || id.includes('personel')) {
      return 'personnel';
    }
    if (text.includes('social_media') || id.includes('sosyal') || id.includes('gorunurluk')) {
      return 'social';
    }
    if (text.includes('crisis_adjacent') || eventLike.filterTags?.includes('crisis')) {
      return 'crisis_adjacent';
    }
  }

  const packDomain =
    (eventLike as { domain?: string }).domain ??
    (eventLike.contentCategory ?? '');
  const fromPack = mapPackDomainToFocus(packDomain);
  if (fromPack) return fromPack;

  const echoDomain = inferEchoDomainFromEvent(eventLike as EventLikeForEcho);
  const fromEcho = mapEchoDomainToUiFocus(echoDomain);
  if (fromEcho) return fromEcho;

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.focus;
    }
  }

  if (eventLike.eventType === 'final') return 'pilot_final';

  return 'generic_operation';
}

function buildDefaultMetrics(focus: EventDomainUiFocus): EventDomainFocusMetric[] {
  const copy =
    focus === 'generic_operation'
      ? {
          primaryLabel: 'Operasyon',
          secondaryLabel: undefined as string | undefined,
          tone: 'neutral' as const,
        }
      : DOMAIN_FOCUS_COPY[focus];

  const metrics: EventDomainFocusMetric[] = [
    {
      id: `${focus}-primary`,
      label: copy.primaryLabel,
      valueLabel: 'Öncelikli',
      tone: copy.tone,
      iconKey: 'ellipse',
      priority: 'primary',
    },
  ];
  if (copy.secondaryLabel) {
    metrics.push({
      id: `${focus}-secondary`,
      label: copy.secondaryLabel,
      valueLabel: 'İzle',
      tone: 'neutral',
      iconKey: 'ellipse-outline',
      priority: 'secondary',
    });
  }
  return metrics;
}

function attachEchoLines(
  model: EventDomainFocusModel,
  args: BuildEventDomainFocusArgs,
): EventDomainFocusModel {
  if (!args.includeEcho || !args.event) return model;
  const event = args.event as EventLikeForEcho;
  const context = buildEchoContextFromEventResult({
    event,
    day: args.day,
    districtId: args.districtId,
    result: args.resultLike ?? undefined,
    themeDomain: model.focus,
  });
  const bundle = buildEventEchoBundle(context);
  return {
    ...model,
    advisorEchoLine: bundle.advisorLine ?? undefined,
    socialEchoLine: bundle.socialMention ?? undefined,
    reportEchoLine: bundle.reportLine ?? undefined,
  };
}

export function buildEventDomainFocusModel(
  args: BuildEventDomainFocusArgs,
): EventDomainFocusModel {
  const focus = inferEventDomainUiFocus(args.event);
  const day = args.day ?? 1;

  if (day === 1 && focus === 'generic_operation') {
    const learning: EventDomainFocusModel = {
      focus: 'pilot_learning',
      ...DOMAIN_FOCUS_COPY.pilot_learning,
      focusMetrics: buildDefaultMetrics('pilot_learning'),
      showOnDay1: true,
      maxVisibleLines: 2,
    };
    return attachEchoLines(learning, args);
  }

  if (focus === 'generic_operation') {
    const generic: EventDomainFocusModel = {
      focus: 'generic_operation',
      title: 'Operasyon Odağı',
      shortTitle: 'Operasyon',
      summary: 'Karar bugünkü saha görünürlüğünü ve yarınki tempo dengesini etkiler.',
      primaryLabel: 'Operasyon',
      tone: 'neutral',
      iconKey: 'construct-outline',
      emphasisTags: ['Operasyon'],
      focusMetrics: buildDefaultMetrics('generic_operation'),
      showOnDay1: day > 1,
      maxVisibleLines: 2,
    };
    return attachEchoLines(generic, args);
  }

  const copy = DOMAIN_FOCUS_COPY[focus];
  const model: EventDomainFocusModel = {
    focus,
    ...copy,
    focusMetrics: buildDefaultMetrics(focus),
    showOnDay1: day === 1 && focus === 'pilot_learning',
    maxVisibleLines: 2,
  };
  return attachEchoLines(model, args);
}

export function getEventDomainFocusTags(focus: EventDomainUiFocus): string[] {
  if (focus === 'generic_operation') return ['Operasyon'];
  return DOMAIN_FOCUS_COPY[focus].emphasisTags;
}

export function getEventDomainPrimaryMetricLabels(focus: EventDomainUiFocus): string[] {
  if (focus === 'generic_operation') return ['Operasyon'];
  const copy = DOMAIN_FOCUS_COPY[focus];
  return copy.secondaryLabel
    ? [copy.primaryLabel, copy.secondaryLabel]
    : [copy.primaryLabel];
}

export function shouldShowEventDomainFocus(
  day: number,
  surface: EventDomainUiSurface,
  focus: EventDomainUiFocus,
): boolean {
  if (day <= 0) return false;
  if (day === 1) {
    if (surface === 'inspect') return false;
    if (focus === 'pilot_learning' || focus === 'generic_operation') {
      return surface === 'field' || surface === 'result';
    }
    return false;
  }
  if (day === 7 && focus === 'pilot_final') return true;
  if (day >= 8) return true;

  if (day === 2 && focus === 'container') return true;
  if (day === 3 && (focus === 'vehicle_route' || focus === 'personnel')) return true;
  if (day === 4 && focus === 'social') return true;
  if (day === 6 && focus === 'crisis_adjacent') return true;
  if (day === 7 && focus === 'pilot_final') return true;

  return focus !== 'pilot_learning';
}

const SURFACE_SECTIONS: Record<
  EventDomainUiSurface,
  Record<EventDomainUiFocus, { primary: string[]; secondary: string[]; muted: string[] }>
> = {
  inspect: {
    container: { primary: ['container', 'route'], secondary: ['district'], muted: ['social'] },
    vehicle_route: {
      primary: ['vehicle', 'route'],
      secondary: ['container'],
      muted: ['personnel'],
    },
    personnel: {
      primary: ['team', 'personnel'],
      secondary: ['vehicle'],
      muted: ['social'],
    },
    social: { primary: ['social', 'visibility'], secondary: ['district'], muted: ['crisis'] },
    crisis_adjacent: {
      primary: ['risk', 'coordination'],
      secondary: ['social'],
      muted: ['container'],
    },
    district_balance: {
      primary: ['district', 'social'],
      secondary: ['container'],
      muted: ['vehicle'],
    },
    pilot_learning: { primary: ['flow'], secondary: ['field'], muted: ['crisis'] },
    pilot_final: { primary: ['final', 'operation'], secondary: ['social'], muted: ['crisis'] },
    generic_operation: {
      primary: ['operation'],
      secondary: ['district'],
      muted: ['crisis'],
    },
  },
  plan: {
    container: { primary: ['container', 'route'], secondary: ['plan'], muted: ['social'] },
    vehicle_route: { primary: ['vehicle', 'route'], secondary: ['plan'], muted: ['social'] },
    personnel: { primary: ['personnel', 'team'], secondary: ['plan'], muted: ['vehicle'] },
    social: { primary: ['social', 'visibility'], secondary: ['plan'], muted: ['crisis'] },
    crisis_adjacent: { primary: ['risk', 'plan'], secondary: ['coordination'], muted: [] },
    district_balance: { primary: ['district', 'priority'], secondary: ['plan'], muted: [] },
    pilot_learning: { primary: ['flow', 'plan'], secondary: [], muted: ['crisis'] },
    pilot_final: { primary: ['final', 'plan'], secondary: ['operation'], muted: [] },
    generic_operation: { primary: ['operation', 'plan'], secondary: [], muted: [] },
  },
  dispatch: {
    container: { primary: ['vehicle_fit', 'route'], secondary: ['container'], muted: [] },
    vehicle_route: { primary: ['vehicle', 'maintenance'], secondary: ['route'], muted: [] },
    personnel: { primary: ['team', 'personnel', 'morale'], secondary: ['vehicle'], muted: [] },
    social: { primary: ['communication', 'public'], secondary: ['team'], muted: [] },
    crisis_adjacent: {
      primary: ['coordination', 'risk_signal'],
      secondary: ['vehicle'],
      muted: [],
    },
    district_balance: { primary: ['district', 'priority'], secondary: ['route'], muted: [] },
    pilot_learning: { primary: ['dispatch'], secondary: [], muted: [] },
    pilot_final: { primary: ['dispatch', 'operation'], secondary: [], muted: [] },
    generic_operation: { primary: ['assignment'], secondary: [], muted: [] },
  },
  field: {
    container: { primary: ['container', 'tomorrow_pressure'], secondary: ['field'], muted: [] },
    vehicle_route: { primary: ['route', 'fatigue'], secondary: ['field'], muted: [] },
    personnel: { primary: ['team', 'tempo'], secondary: ['field'], muted: [] },
    social: { primary: ['visibility', 'public'], secondary: ['field'], muted: [] },
    crisis_adjacent: { primary: ['risk', 'preventive'], secondary: ['field'], muted: [] },
    district_balance: { primary: ['district', 'balance'], secondary: ['field'], muted: [] },
    pilot_learning: { primary: ['field', 'flow'], secondary: [], muted: [] },
    pilot_final: { primary: ['field', 'final'], secondary: [], muted: [] },
    generic_operation: { primary: ['field'], secondary: [], muted: [] },
  },
  result: {
    container: { primary: ['container', 'carryover'], secondary: ['result'], muted: [] },
    vehicle_route: { primary: ['vehicle', 'tomorrow'], secondary: ['result'], muted: [] },
    personnel: { primary: ['team', 'morale'], secondary: ['result'], muted: [] },
    social: { primary: ['social', 'trust'], secondary: ['result'], muted: [] },
    crisis_adjacent: { primary: ['risk', 'result'], secondary: [], muted: [] },
    district_balance: { primary: ['district', 'balance'], secondary: ['result'], muted: [] },
    pilot_learning: { primary: ['result', 'flow'], secondary: [], muted: [] },
    pilot_final: { primary: ['final', 'result'], secondary: [], muted: [] },
    generic_operation: { primary: ['result'], secondary: [], muted: [] },
  },
  report_preview: {
    container: { primary: ['container'], secondary: ['report'], muted: [] },
    vehicle_route: { primary: ['vehicle'], secondary: ['report'], muted: [] },
    personnel: { primary: ['personnel'], secondary: ['report'], muted: [] },
    social: { primary: ['social'], secondary: ['report'], muted: [] },
    crisis_adjacent: { primary: ['risk'], secondary: ['report'], muted: [] },
    district_balance: { primary: ['district'], secondary: ['report'], muted: [] },
    pilot_learning: { primary: ['report'], secondary: [], muted: [] },
    pilot_final: { primary: ['final', 'report'], secondary: [], muted: [] },
    generic_operation: { primary: ['report'], secondary: [], muted: [] },
  },
};

export function buildEventDomainSurfacePriority(
  focus: EventDomainUiFocus,
  surface: EventDomainUiSurface,
  _day: number,
): EventDomainSurfacePriority {
  const sections = SURFACE_SECTIONS[surface][focus];
  return {
    surface,
    focus,
    primarySections: sections.primary,
    secondarySections: sections.secondary,
    mutedSections: sections.muted,
  };
}

function surfaceFocusLine(
  focus: EventDomainUiFocus,
  surface: EventDomainUiSurface,
): string {
  const title =
    focus === 'generic_operation'
      ? 'Operasyon Odağı'
      : DOMAIN_FOCUS_COPY[focus].title;

  switch (surface) {
    case 'dispatch':
      if (focus === 'container') return 'Araç ve rota uygunluğu konteyner müdahalesini belirler.';
      if (focus === 'vehicle_route') return 'Araç yorgunluğu ve bakım riski rotayı etkileyebilir.';
      if (focus === 'personnel') return 'Ekip uyumu ve moral saha temposunu taşır.';
      if (focus === 'social') return 'İletişim ekibi görünürlük etkisini yumuşatır.';
      if (focus === 'crisis_adjacent') return 'Koordinasyon ve risk sinyali önce okunmalı.';
      return `Yönlendirme odağı: ${title}`;
    case 'field':
      if (focus === 'container') return 'Sahada çevre düzenleme yarınki konteyner baskısını etkiler.';
      if (focus === 'vehicle_route') return 'Rota tamamlanması araç yorgunluğunu taşır.';
      if (focus === 'social') return 'Vatandaş görünürlüğü sosyal nabzı hızlı günceller.';
      if (focus === 'crisis_adjacent') return 'Önleyici saha hamlesi risk birleşimini dağıtır.';
      return `Saha odağı: ${title}`;
    case 'result':
      return `Sonuç odağı: ${title}`;
    case 'plan':
      return `Karar odağı: ${title}`;
    default:
      return title;
  }
}

export function buildEventDomainInspectFocus(
  eventLike: EventDomainPresentationEventLike | null | undefined,
  day: number,
): EventDomainFocusModel {
  return buildEventDomainFocusModel({ event: eventLike, day, surface: 'inspect' });
}

export function buildEventDomainPlanFocus(
  eventLike: EventDomainPresentationEventLike | null | undefined,
  day: number,
): EventDomainFocusModel {
  return buildEventDomainFocusModel({ event: eventLike, day, surface: 'plan' });
}

export function buildEventDomainDispatchFocus(
  eventLike: EventDomainPresentationEventLike | null | undefined,
  assignmentLike: { compatibilityLabel?: string } | null | undefined,
  day: number,
): { model: EventDomainFocusModel; warningLine: string } {
  const model = buildEventDomainFocusModel({ event: eventLike, day, surface: 'dispatch', assignmentLike });
  let warningLine = surfaceFocusLine(model.focus, 'dispatch');
  if (assignmentLike?.compatibilityLabel?.toLowerCase().includes('düşük')) {
    warningLine = `${warningLine} Uyum düşük; yine de ilerlenebilir.`;
  }
  return { model, warningLine };
}

export function buildEventDomainFieldFocus(
  eventLike: EventDomainPresentationEventLike | null | undefined,
  microDecisionLike: { title?: string } | null | undefined,
  day: number,
): { model: EventDomainFocusModel; hintLine: string } {
  const model = buildEventDomainFocusModel({
    event: eventLike,
    day,
    surface: 'field',
    microDecisionLike,
  });
  const hintLine = microDecisionLike?.title
    ? `${surfaceFocusLine(model.focus, 'field')} · ${microDecisionLike.title}`
    : surfaceFocusLine(model.focus, 'field');
  return { model, hintLine };
}

export function buildEventDomainResultFocus(
  eventLike: EventDomainPresentationEventLike | null | undefined,
  resultLike: BuildEventDomainFocusArgs['resultLike'],
  day: number,
): { model: EventDomainFocusModel; resultLine: string; echoLine: string | null } {
  const model = buildEventDomainFocusModel({
    event: eventLike,
    day,
    surface: 'result',
    resultLike,
    includeEcho: true,
  });
  const echoLine =
    model.advisorEchoLine ?? model.socialEchoLine ?? model.reportEchoLine ?? null;
  return {
    model,
    resultLine: `Sonuç odağı: ${model.shortTitle} — ${model.summary}`,
    echoLine,
  };
}

export function buildEventDetailCombinedFocusPresentation(args: {
  event: EventDomainPresentationEventLike | null | undefined;
  day: number;
}): {
  headline: string | null;
  subline: string | null;
  model: EventDomainFocusModel | null;
  compact: boolean;
} {
  const { event, day } = args;
  const model = buildEventDomainFocusModel({ event, day, surface: 'inspect' });
  const focus = model.focus;
  const show = shouldShowEventDomainFocus(day, 'inspect', focus);
  const pilotTheme = getPilotThemeForDay(day);
  const pilotLine = pilotTheme ? `Bugünün odağı: ${pilotTheme.shortTitle}` : null;

  if (!show) {
    return {
      headline: day === 1 ? pilotLine : null,
      subline: null,
      model: day === 1 ? model : null,
      compact: true,
    };
  }

  const themeAligns =
    pilotTheme &&
    ((pilotTheme.domain === 'container_pressure' && focus === 'container') ||
      (pilotTheme.domain === 'resource_fatigue' &&
        (focus === 'vehicle_route' || focus === 'personnel')) ||
      (pilotTheme.domain === 'social_pulse' && focus === 'social') ||
      (pilotTheme.domain === 'district_balance' && focus === 'district_balance') ||
      (pilotTheme.domain === 'crisis_signal' && focus === 'crisis_adjacent') ||
      (pilotTheme.domain === 'pilot_final' && focus === 'pilot_final'));

  if (themeAligns) {
    return {
      headline: `Bugünün odağı: ${model.title}`,
      subline: model.summary,
      model,
      compact: false,
    };
  }

  return {
    headline: pilotLine ?? `Olay odağı: ${model.shortTitle}`,
    subline: model.summary,
    model,
    compact: false,
  };
}

export type OperationImpactPreviewLike = {
  title: string;
  summary: string;
  severityLabel: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

const IMPACT_DOMAIN_KEYWORDS: Record<EventDomainUiFocus, string[]> = {
  container: ['konteyner', 'atık', 'temizlik', 'doluluk'],
  vehicle_route: ['araç', 'rota', 'gecikme', 'bakım', 'kapasite'],
  personnel: ['ekip', 'personel', 'moral', 'tempo'],
  social: ['sosyal', 'vatandaş', 'görünürlük', 'güven'],
  crisis_adjacent: ['risk', 'kriz', 'sinyal', 'önleyici'],
  district_balance: ['mahalle', 'denge', 'bölge', 'öncelik'],
  pilot_learning: ['akış', 'öğren'],
  pilot_final: ['final', 'pilot', 'hazırlık'],
  generic_operation: ['operasyon'],
};

export function prioritizeOperationImpactSummary(
  model: OperationImpactPreviewLike,
  eventLike: EventDomainPresentationEventLike | null | undefined,
): OperationImpactPreviewLike {
  const focus = inferEventDomainUiFocus(eventLike);
  const keywords = IMPACT_DOMAIN_KEYWORDS[focus];
  const lower = model.summary.toLowerCase();
  const alreadyLeading = keywords.some((kw) => lower.startsWith(kw) || lower.includes(kw));
  if (alreadyLeading || focus === 'generic_operation') {
    return model;
  }
  const domainHint =
    focus === 'container'
      ? 'Konteyner ve rota etkisi önde.'
      : focus === 'vehicle_route'
        ? 'Araç ve rota yükü önde.'
        : focus === 'personnel'
          ? 'Ekip temposu önde.'
          : focus === 'social'
            ? 'Sosyal nabız etkisi önde.'
            : focus === 'crisis_adjacent'
              ? 'Risk sinyali önde.'
              : focus === 'district_balance'
                ? 'Mahalle dengesi önde.'
                : '';
  if (!domainHint) return model;
  return {
    ...model,
    summary: `${domainHint} ${model.summary}`.slice(0, 220),
  };
}

export function collectEventDomainUiText(model: EventDomainFocusModel | null): string {
  if (!model) return '';
  return [
    model.title,
    model.summary,
    model.primaryLabel,
    model.secondaryLabel,
    ...model.emphasisTags,
    model.advisorEchoLine,
    model.socialEchoLine,
    model.reportEchoLine,
  ]
    .filter(Boolean)
    .join(' ');
}

export function eventDomainUiTextHasForbiddenWords(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN_UI_WORDS.some((w) => lower.includes(w));
}

export const EVENT_DOMAIN_UI_FORBIDDEN_WORDS = FORBIDDEN_UI_WORDS;
