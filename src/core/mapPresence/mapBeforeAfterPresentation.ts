import { inferCarryOverDomainFromText } from '@/core/carryOver/carryOverMemorySelectors';

import {
  MAP_BEFORE_AFTER_DOMAINS,
  type MapBeforeAfterDomain,
  type MapBeforeAfterImpactModel,
  type MapBeforeAfterInput,
  type MapBeforeAfterMarkerStatusUpdate,
  type MapBeforeAfterOutcome,
  type MapBeforeAfterSummary,
  type MapBeforeAfterSurface,
  type MapBeforeAfterTone,
} from './mapBeforeAfterTypes';
import type { MapPresenceMarkerStatus, MapPresenceViewModel } from './mapPresenceTypes';

export const TITLE_LIMIT = 28;
export const BEFORE_LABEL_LIMIT = 20;
export const AFTER_LABEL_LIMIT = 22;
export const SUMMARY_LIMIT = 150;

type ImpactTemplate = {
  title: string;
  beforeLabel: string;
  afterLabel: string;
  summary: string;
  primaryTag: string;
  secondaryTag?: string;
  iconKey: string;
  tone: MapBeforeAfterTone;
};

const DOMAIN_TEMPLATES: Record<
  MapBeforeAfterDomain,
  Partial<Record<MapBeforeAfterOutcome, ImpactTemplate>>
> = {
  container: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Baskı vardı',
      afterLabel: 'Toparlandı',
      summary:
        'Konteyner çevresindeki görünür baskı azaldı; aynı hat yarın sakin izlenebilir.',
      primaryTag: 'Konteyner',
      secondaryTag: 'Toparlandı',
      iconKey: 'trash-outline',
      tone: 'positive',
    },
    partially_improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Baskı vardı',
      afterLabel: 'Azaldı',
      summary: 'Konteyner baskısı düştü; aynı hattın yarın tekrar izlenmesi faydalı olur.',
      primaryTag: 'Konteyner',
      iconKey: 'trash-outline',
      tone: 'mixed',
    },
    carried_over: {
      title: 'Harita Etkisi',
      beforeLabel: 'Baskı vardı',
      afterLabel: 'Yarına kaldı',
      summary:
        'Bugünkü müdahale şikayeti düşürdü, ancak konteyner hattı yarın tekrar izlenmeli.',
      primaryTag: 'Konteyner',
      secondaryTag: 'Yarın',
      iconKey: 'trash-outline',
      tone: 'warning',
    },
    worsened: {
      title: 'Harita Etkisi',
      beforeLabel: 'Baskı vardı',
      afterLabel: 'Baskı arttı',
      summary: 'Konteyner çevresi bugün daha yoğun görünüyor; mahalle dengesi izlenmeli.',
      primaryTag: 'Konteyner',
      iconKey: 'warning-outline',
      tone: 'warning',
    },
    prevented: {
      title: 'Harita Etkisi',
      beforeLabel: 'İzleniyordu',
      afterLabel: 'Sakin',
      summary: 'Erken müdahale konteyner baskısının büyümesini engelledi.',
      primaryTag: 'Konteyner',
      iconKey: 'checkmark-circle-outline',
      tone: 'positive',
    },
  },
  vehicle_route: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Yoğun rota',
      afterLabel: 'Dengeli',
      summary: 'Araç hattı bugün dengeli görünüyor; yarın aynı tempo sürdürülebilir.',
      primaryTag: 'Araç',
      iconKey: 'car-outline',
      tone: 'positive',
    },
    partially_improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Gecikme riski',
      afterLabel: 'Çalışıyor',
      summary: 'Rota bugün sonuç verdi; yarın aynı hattı tekrar zorlamamak önemli.',
      primaryTag: 'Araç',
      iconKey: 'car-outline',
      tone: 'mixed',
    },
    carried_over: {
      title: 'Harita Etkisi',
      beforeLabel: 'Hızlı rota',
      afterLabel: 'Araç yorgun',
      summary:
        'Rota bugün sonuç verdi; aynı araç hattı yarın daha dikkatli planlanmalı.',
      primaryTag: 'Araç',
      secondaryTag: 'Yorgunluk',
      iconKey: 'car-outline',
      tone: 'warning',
    },
    worsened: {
      title: 'Harita Etkisi',
      beforeLabel: 'Araç yükü',
      afterLabel: 'Bakım riski',
      summary: 'Araç yükü yükseldi; sonraki rotada daha dengeli seçim güvenli olur.',
      primaryTag: 'Araç',
      iconKey: 'build-outline',
      tone: 'warning',
    },
    prevented: {
      title: 'Harita Etkisi',
      beforeLabel: 'Rota riski',
      afterLabel: 'İzlendi',
      summary: 'Rota baskısı büyümeden kontrol altında tutuldu.',
      primaryTag: 'Araç',
      iconKey: 'navigate-outline',
      tone: 'strategic',
    },
  },
  personnel: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Yoğun ekip',
      afterLabel: 'Dengeli',
      summary: 'Ekip temposu bugün yönetilebilir seviyeye indi.',
      primaryTag: 'Ekip',
      iconKey: 'people-outline',
      tone: 'positive',
    },
    partially_improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Yoğun ekip',
      afterLabel: 'Tempo izleniyor',
      summary:
        'Ekip sahada hızlı sonuç verdi, fakat yarın rotasyon daha güvenli olabilir.',
      primaryTag: 'Ekip',
      iconKey: 'people-outline',
      tone: 'mixed',
    },
    carried_over: {
      title: 'Harita Etkisi',
      beforeLabel: 'Yoğun ekip',
      afterLabel: 'Yorgunluk izi',
      summary: 'Ekip bugün sonuç verdi; yarın tempo daha dengeli planlanmalı.',
      primaryTag: 'Ekip',
      iconKey: 'people-outline',
      tone: 'warning',
    },
    worsened: {
      title: 'Harita Etkisi',
      beforeLabel: 'Ekip temposu',
      afterLabel: 'Yük arttı',
      summary: 'Ekip yükü bugün arttı; yarın rotasyon önemli.',
      primaryTag: 'Ekip',
      iconKey: 'people-outline',
      tone: 'warning',
    },
    prevented: {
      title: 'Harita Etkisi',
      beforeLabel: 'Yoğun tempo',
      afterLabel: 'Rotasyon',
      summary: 'Rotasyonla ekip temposu dengede tutuldu.',
      primaryTag: 'Ekip',
      iconKey: 'people-outline',
      tone: 'positive',
    },
  },
  social: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Görünür şikayet',
      afterLabel: 'Sosyal baskı azaldı',
      summary:
        'Mahallede konu sakinleşti; yarın saha sonucunun görünür kalması önemli.',
      primaryTag: 'Sosyal',
      iconKey: 'chatbubbles-outline',
      tone: 'positive',
    },
    partially_improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Sosyal baskı',
      afterLabel: 'İzleniyor',
      summary: 'Görünürlük azaldı; yarın aynı mahallede net sonuç önemli.',
      primaryTag: 'Sosyal',
      iconKey: 'chatbubbles-outline',
      tone: 'mixed',
    },
    carried_over: {
      title: 'Harita Etkisi',
      beforeLabel: 'Sosyal baskı',
      afterLabel: 'Beklenti sürüyor',
      summary: 'Bugünkü müdahale algıyı yumuşattı; yarın görünürlük izlenmeli.',
      primaryTag: 'Sosyal',
      iconKey: 'chatbubbles-outline',
      tone: 'warning',
    },
    prevented: {
      title: 'Harita Etkisi',
      beforeLabel: 'Şikayet hattı',
      afterLabel: 'Sakinleşti',
      summary: 'Görünür müdahale konunun büyümesini engelledi.',
      primaryTag: 'Sosyal',
      iconKey: 'chatbubbles-outline',
      tone: 'positive',
    },
  },
  crisis_adjacent: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Risk sinyali',
      afterLabel: 'İzlemeye alındı',
      summary: 'Risk sinyali kontrol altında; aynı mahalle yarın sakin izlenmeli.',
      primaryTag: 'Risk',
      iconKey: 'pulse-outline',
      tone: 'strategic',
    },
    prevented: {
      title: 'Harita Etkisi',
      beforeLabel: 'Risk sinyali',
      afterLabel: 'İzlemeye alındı',
      summary:
        'Birleşen sinyaller büyümeden kontrol edildi; aynı mahalle yarın sakin izlenmeli.',
      primaryTag: 'Risk',
      iconKey: 'pulse-outline',
      tone: 'strategic',
    },
    carried_over: {
      title: 'Harita Etkisi',
      beforeLabel: 'Risk sinyali',
      afterLabel: 'İzleniyor',
      summary: 'Risk sinyali sürüyor; yarın erken müdahale önemli.',
      primaryTag: 'Risk',
      iconKey: 'pulse-outline',
      tone: 'warning',
    },
    worsened: {
      title: 'Harita Etkisi',
      beforeLabel: 'Risk sinyali',
      afterLabel: 'Hassasiyet arttı',
      summary: 'Risk hassasiyeti yükseldi; mahalle dengesi izlenmeli.',
      primaryTag: 'Risk',
      iconKey: 'pulse-outline',
      tone: 'warning',
    },
  },
  district_balance: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Öncelik baskısı',
      afterLabel: 'Denge izleniyor',
      summary:
        'Bir mahalle rahatladı; yarın bekleme algısı oluşan bölgeler izlenmeli.',
      primaryTag: 'Denge',
      iconKey: 'map-outline',
      tone: 'strategic',
    },
    carried_over: {
      title: 'Harita Etkisi',
      beforeLabel: 'Öncelik baskısı',
      afterLabel: 'Bekleyen mahalle',
      summary: 'Bir bölge rahatladı; diğer mahalleler yarın izlenmeli.',
      primaryTag: 'Denge',
      iconKey: 'map-outline',
      tone: 'mixed',
    },
    worsened: {
      title: 'Harita Etkisi',
      beforeLabel: 'Denge',
      afterLabel: 'Dengesizlik',
      summary: 'Mahalleler arası bekleme algısı arttı; denge yarın önemli.',
      primaryTag: 'Denge',
      iconKey: 'map-outline',
      tone: 'warning',
    },
  },
  generic_operation: {
    improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Saha baskısı',
      afterLabel: 'Sakinleşti',
      summary: 'Kararın harita üzerinde görünür etkisi oluştu.',
      primaryTag: 'Operasyon',
      iconKey: 'map-outline',
      tone: 'positive',
    },
    partially_improved: {
      title: 'Harita Etkisi',
      beforeLabel: 'Saha sinyali',
      afterLabel: 'İzleniyor',
      summary: 'Saha etkisi kısmen yumuşadı; yarın izlenmeye devam.',
      primaryTag: 'Operasyon',
      iconKey: 'map-outline',
      tone: 'mixed',
    },
  },
};

function clamp(text: string, limit: number): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  return `${t.slice(0, limit - 1).trimEnd()}…`;
}

function normalizeForDuplicate(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'".:,;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNormalizedDuplicate(a: string, b: string): boolean {
  if (!a || !b || a.length < 12 || b.length < 12) return false;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length >= b.length ? a : b;
  if (!longer.includes(shorter)) return false;
  return shorter.length / longer.length >= 0.7;
}

export function isMapBeforeAfterDuplicateOf(
  impact: MapBeforeAfterImpactModel | null | undefined,
  existingLines: string[],
): boolean {
  if (!impact?.visible) return false;
  const candidates = [
    normalizeForDuplicate(impact.summary),
    normalizeForDuplicate(`${impact.beforeLabel} ${impact.afterLabel}`),
    normalizeForDuplicate(
      `${impact.title} ${impact.summary} ${impact.beforeLabel} ${impact.afterLabel}`,
    ),
  ].filter((c) => c.length >= 12);

  for (const line of existingLines) {
    const other = normalizeForDuplicate(line);
    if (!other || other.length < 12) continue;
    for (const blob of candidates) {
      if (isNormalizedDuplicate(blob, other)) return true;
    }
  }
  return false;
}

export function suppressMapBeforeAfterDuplicate(
  impact: MapBeforeAfterImpactModel | null,
  existingLines: string[],
): MapBeforeAfterImpactModel | null {
  if (!impact?.visible) return null;
  if (isMapBeforeAfterDuplicateOf(impact, existingLines)) {
    return { ...impact, visible: false, debugReason: 'duplicate_suppressed' };
  }
  return impact;
}

export function inferMapBeforeAfterDomain(input: MapBeforeAfterInput): MapBeforeAfterDomain {
  const focus = input.eventDomainFocus?.focus;
  if (focus === 'container') return 'container';
  if (focus === 'vehicle_route' || focus === 'vehicle') return 'vehicle_route';
  if (focus === 'personnel') return 'personnel';
  if (focus === 'social') return 'social';
  if (focus === 'crisis_adjacent' || focus === 'crisis') return 'crisis_adjacent';
  if (focus === 'district_balance') return 'district_balance';

  if (input.carryOverMemory?.domain) {
    const d = input.carryOverMemory.domain as MapBeforeAfterDomain;
    if (MAP_BEFORE_AFTER_DOMAINS.includes(d)) return d;
  }

  if (input.reportTomorrowPreview?.domain && input.reportTomorrowPreview.visible !== false) {
    const d = input.reportTomorrowPreview.domain as MapBeforeAfterDomain;
    if (MAP_BEFORE_AFTER_DOMAINS.includes(d)) return d;
  }

  const category = input.activeEvent?.contentCategory?.toLowerCase() ?? '';
  const title = `${input.activeEvent?.title ?? ''} ${input.eventResult?.summaryTitle ?? ''}`.toLowerCase();
  const blob = `${category} ${title}`;
  if (blob.includes('container') || blob.includes('konteyner')) return 'container';
  if (blob.includes('vehicle') || blob.includes('araç') || blob.includes('rota')) return 'vehicle_route';
  if (blob.includes('personnel') || blob.includes('ekip')) return 'personnel';
  if (blob.includes('social') || blob.includes('sosyal')) return 'social';
  if (blob.includes('crisis') || blob.includes('risk')) return 'crisis_adjacent';

  if (input.mapPresence?.domain) {
    const d = input.mapPresence.domain as MapBeforeAfterDomain;
    if (MAP_BEFORE_AFTER_DOMAINS.includes(d)) return d;
  }

  const inferred = inferCarryOverDomainFromText(
    `${input.eventResult?.summaryText ?? ''} ${input.carryOverMemory?.summary ?? ''}`,
  );
  if (inferred === 'vehicle_route' || inferred === 'container' || inferred === 'personnel') {
    return inferred;
  }
  if (inferred === 'social') return 'social';
  if (inferred === 'crisis_adjacent') return 'crisis_adjacent';
  if (inferred === 'district_balance') return 'district_balance';

  return 'generic_operation';
}

function toneFromResult(resultTone?: string): MapBeforeAfterOutcome | null {
  const t = resultTone?.toLowerCase() ?? '';
  if (t.includes('success') || t.includes('positive') || t.includes('strong')) return 'improved';
  if (t.includes('partial') || t.includes('mixed')) return 'partially_improved';
  if (t.includes('weak') || t.includes('negative') || t.includes('fail')) return 'worsened';
  return null;
}

export function inferMapBeforeAfterOutcome(input: MapBeforeAfterInput): MapBeforeAfterOutcome {
  if (input.carryOverMemory?.domain && !input.carryOverMemory.resolved) {
    return 'carried_over';
  }

  const fatigueState = input.resourceFatigue?.state;
  if (fatigueState === 'tired' || fatigueState === 'maintenance_risk' || fatigueState === 'strained') {
    return 'carried_over';
  }

  const fromResult = toneFromResult(input.eventResult?.resultTone);
  if (fromResult) return fromResult;

  const summary = `${input.eventResult?.summaryText ?? ''} ${input.eventResult?.summaryTitle ?? ''}`.toLowerCase();
  if (summary.includes('yarın') || summary.includes('taşın') || summary.includes('carry')) {
    return 'carried_over';
  }
  if (summary.includes('azaldı') || summary.includes('sakin') || summary.includes('topar')) {
    return 'improved';
  }
  if (summary.includes('risk') && summary.includes('önle')) return 'prevented';
  if (summary.includes('arttı') || summary.includes('kötü')) return 'worsened';

  if (input.reportTomorrowPreview?.visible !== false && input.reportTomorrowPreview?.summary) {
    return 'carried_over';
  }

  return 'partially_improved';
}

export function inferMapBeforeAfterTone(outcome: MapBeforeAfterOutcome): MapBeforeAfterTone {
  switch (outcome) {
    case 'improved':
    case 'prevented':
      return 'positive';
    case 'carried_over':
    case 'worsened':
      return 'warning';
    case 'partially_improved':
      return 'mixed';
    case 'unchanged':
      return 'muted';
    default:
      return 'strategic';
  }
}

export function buildBeforeAfterLabels(
  domain: MapBeforeAfterDomain,
  outcome: MapBeforeAfterOutcome,
  input: MapBeforeAfterInput,
): { beforeLabel: string; afterLabel: string } {
  const template = DOMAIN_TEMPLATES[domain]?.[outcome];
  if (template) {
    return { beforeLabel: template.beforeLabel, afterLabel: template.afterLabel };
  }
  return { beforeLabel: 'Önce', afterLabel: 'Sonra' };
}

export function buildMapBeforeAfterImpact(input: MapBeforeAfterInput): MapBeforeAfterImpactModel | null {
  const surface = input.surface ?? 'result';
  if (!shouldShowMapBeforeAfter(input.day, surface, input)) return null;

  const domain = inferMapBeforeAfterDomain(input);
  const outcome = inferMapBeforeAfterOutcome(input);
  if (outcome === 'unknown' || outcome === 'unchanged') {
    if (input.day <= 2 && domain !== 'container') return null;
  }

  const template =
    DOMAIN_TEMPLATES[domain]?.[outcome] ??
    DOMAIN_TEMPLATES.generic_operation?.[outcome] ??
    DOMAIN_TEMPLATES.generic_operation?.partially_improved;

  if (!template) return null;

  const labels = buildBeforeAfterLabels(domain, outcome, input);

  return {
    id: `map-before-after-${domain}-${outcome}`,
    domain,
    outcome,
    tone: inferMapBeforeAfterTone(outcome),
    title: clamp(template.title, TITLE_LIMIT),
    beforeLabel: clamp(labels.beforeLabel, BEFORE_LABEL_LIMIT),
    afterLabel: clamp(labels.afterLabel, AFTER_LABEL_LIMIT),
    summary: clamp(template.summary, SUMMARY_LIMIT),
    primaryTag: template.primaryTag,
    secondaryTag: template.secondaryTag,
    iconKey: template.iconKey,
    visible: true,
    maxLines: 2,
    debugReason: `domain:${domain} outcome:${outcome}`,
  };
}

export function buildMapBeforeAfterPanelLine(impact: MapBeforeAfterImpactModel): string | null {
  if (!impact.visible) return null;
  return clamp(`${impact.beforeLabel} → ${impact.afterLabel}: ${impact.summary}`, SUMMARY_LIMIT);
}

function markerStatusForOutcome(
  domain: MapBeforeAfterDomain,
  outcome: MapBeforeAfterOutcome,
): MapPresenceMarkerStatus {
  switch (domain) {
    case 'container':
      if (outcome === 'improved' || outcome === 'prevented') return 'resolved';
      if (outcome === 'partially_improved') return 'in_progress';
      if (outcome === 'carried_over') return 'carry_over';
      if (outcome === 'worsened') return 'critical';
      return 'pressure';
    case 'vehicle_route':
      if (outcome === 'improved' || outcome === 'prevented') return 'working';
      if (outcome === 'carried_over' || outcome === 'worsened') return 'tired';
      if (outcome === 'partially_improved') return 'en_route';
      return 'maintenance_risk';
    case 'personnel':
      if (outcome === 'improved' || outcome === 'prevented') return 'working';
      if (outcome === 'carried_over' || outcome === 'worsened') return 'tired';
      if (outcome === 'partially_improved') return 'assigned';
      return 'pressure';
    case 'social':
      if (outcome === 'improved') return 'social_watch';
      return 'risk_watch';
    case 'crisis_adjacent':
      return 'risk_watch';
    default:
      return 'normal';
  }
}

export function buildMapBeforeAfterMarkerStatusUpdates(
  input: MapBeforeAfterInput,
): MapBeforeAfterMarkerStatusUpdate[] {
  const impact = buildMapBeforeAfterImpact(input);
  if (!impact?.visible) return [];

  const domain = impact.domain;
  const beforeStatus =
    domain === 'container'
      ? 'pressure'
      : domain === 'vehicle_route'
        ? 'en_route'
        : domain === 'personnel'
          ? 'assigned'
          : 'risk_watch';
  const afterStatus = markerStatusForOutcome(domain, impact.outcome);

  return [
    {
      domain,
      beforeStatus,
      afterStatus,
    },
  ];
}

export function shouldShowMapBeforeAfter(
  day: number,
  surface: MapBeforeAfterSurface,
  input: MapBeforeAfterInput,
): boolean {
  if (input.crisisState?.active && surface === 'map_panel') return false;
  if (day <= 1) {
    return surface === 'result' && Boolean(input.eventResult);
  }
  if (day > 7 && !input.hasRealPostPilotData) return false;

  const domain = inferMapBeforeAfterDomain(input);
  if (day === 2 && domain !== 'container' && domain !== 'generic_operation') {
    if (surface === 'map_panel') return false;
  }
  if (day === 3 && (domain === 'social' || domain === 'crisis_adjacent')) {
    if (surface === 'map_panel') return false;
  }
  if (day === 4 && domain === 'crisis_adjacent' && surface === 'map_panel') return false;
  if (day >= 6 && domain === 'crisis_adjacent' && surface === 'map_panel') {
    return true;
  }

  if (!input.eventResult && !input.carryOverMemory && !input.reportTomorrowPreview) {
    if (day > 7) return false;
    if (surface === 'debug') return true;
    return day >= 2 && Boolean(input.activeEvent);
  }

  return true;
}

export function buildMapBeforeAfterSummary(input: MapBeforeAfterInput): MapBeforeAfterSummary {
  const warnings: string[] = [];
  let impact = buildMapBeforeAfterImpact(input);

  const existingLines: string[] = [];
  if (input.carryOverMemory?.summary) existingLines.push(input.carryOverMemory.summary);
  if (input.reportTomorrowPreview?.summary) existingLines.push(input.reportTomorrowPreview.summary);
  if (input.socialEcho?.mention) existingLines.push(input.socialEcho.mention);
  if (input.eventDomainFocus?.reportEchoLine) existingLines.push(input.eventDomainFocus.reportEchoLine);
  if (input.eventDomainFocus?.summary) existingLines.push(input.eventDomainFocus.summary);
  if (input.eventResult?.summaryText) existingLines.push(input.eventResult.summaryText);

  impact = suppressMapBeforeAfterDuplicate(impact, existingLines);
  const markerStatusUpdates =
    impact?.visible
      ? [
          {
            domain: impact.domain,
            beforeStatus:
              impact.domain === 'container'
                ? 'pressure'
                : impact.domain === 'vehicle_route'
                  ? 'en_route'
                  : impact.domain === 'personnel'
                    ? 'assigned'
                    : 'risk_watch',
            afterStatus: markerStatusForOutcome(impact.domain, impact.outcome),
          },
        ]
      : [];

  const panelLine = impact ? buildMapBeforeAfterPanelLine(impact) ?? undefined : undefined;

  return {
    impact: impact ?? undefined,
    panelLine,
    markerStatusUpdates,
    warnings,
  };
}

export function applyMapBeforeAfterToPresenceViewModel(
  viewModel: MapPresenceViewModel,
  summary: MapBeforeAfterSummary | null | undefined,
): MapPresenceViewModel {
  if (!summary?.impact?.visible || summary.markerStatusUpdates.length === 0) {
    return viewModel;
  }

  const update = summary.markerStatusUpdates[0];
  if (!update) return viewModel;

  switch (update.domain) {
    case 'container':
      return {
        ...viewModel,
        containerMarkers: viewModel.containerMarkers.map((m, i) =>
          i === 0 ? { ...m, status: update.afterStatus, pulse: update.afterStatus === 'pressure' } : m,
        ),
      };
    case 'vehicle_route':
      return {
        ...viewModel,
        vehicleMarkers: viewModel.vehicleMarkers.map((m, i) =>
          i === 0 ? { ...m, status: update.afterStatus } : m,
        ),
      };
    case 'personnel':
      return {
        ...viewModel,
        teamMarkers: viewModel.teamMarkers.map((m, i) =>
          i === 0 ? { ...m, status: update.afterStatus } : m,
        ),
      };
    default:
      return viewModel;
  }
}