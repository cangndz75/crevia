import {
  buildEceMemorySnapshot,
  buildReportEceReflection,
  type EceMemoryContextInput,
} from '@/core/eceTone';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { PostDecisionCityReactionPresentation } from '@/features/events/utils/postDecisionCityReactionPresentation';

export type CliffhangerChipTone = 'positive' | 'neutral' | 'warning' | 'mixed';

export type CliffhangerRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type EndDayCliffhangerChip = {
  label: string;
  value: string;
  tone: CliffhangerChipTone;
};

export type EndDayCliffhangerTomorrowRisk = {
  title: string;
  riskLabel: string;
  description: string;
  tone: CliffhangerRiskLevel;
  reasons: Array<{ label: string; tone: CliffhangerChipTone }>;
  suggestedFocus: string;
};

export type EndDayCliffhangerDistrictItem = {
  districtName: string;
  description: string;
  tone: CliffhangerChipTone;
  statusLabel: string;
};

export type EndDayCarriedPressureItem = {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: CliffhangerChipTone;
  iconKey: string;
};

export type EndDayCliffhangerPresentation = {
  visible: boolean;
  closingBridge: {
    title: string;
    summary: string;
    tone: CliffhangerChipTone;
    chips: EndDayCliffhangerChip[];
  };
  tomorrowRisk: EndDayCliffhangerTomorrowRisk;
  districtWatch: {
    title: string;
    districts: EndDayCliffhangerDistrictItem[];
  };
  carriedPressures: {
    title: string;
    items: EndDayCarriedPressureItem[];
  };
  advisor: {
    title: string;
    message: string;
    toneLabel: string;
  };
  primaryCta: {
    label: string;
    enabled: boolean;
    actionKey: string;
  };
};

export type BuildEndDayCliffhangerInput = {
  day: number;
  tomorrowRisk?: TomorrowRiskModel | null;
  cityReaction?: PostDecisionCityReactionPresentation | null;
  carryOverSummary?: string | null;
  socialPulseScore?: number;
  socialPulseTrend?: string | null;
  operationSignals?: {
    dailyFocus?: string;
    priorityDistrictId?: string;
    personnel?: { status?: string; summary?: string };
    vehicles?: { status?: string; summary?: string };
    containers?: { status?: string; summary?: string };
    overall?: { status?: string };
  } | null;
  resourceFatigueLabel?: string | null;
  lastDistrictName?: string | null;
  lastDistrictId?: string | null;
  priorityDistrictName?: string | null;
  dominantStrategyNote?: string | null;
  reportSummaryLines?: string[];
  existingLines?: string[];
  eceMemoryContext?: EceMemoryContextInput;
  hasPilotCompletion?: boolean;
};

const FORBIDDEN_CLIFFHANGER_PHRASES = [
  'yarın büyük kriz',
  'oyunu kaybed',
  'mükemmel',
  'efsanevi',
  'dashboard güncellendi',
  'veriler işlendi',
] as const;

function clampLine(value: string, limit = 140): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit - 1).trimEnd()}…`;
}

function isDuplicateLine(candidate: string, existing: string[]): boolean {
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return true;
  return existing.some((line) => {
    const other = line.trim().toLowerCase();
    if (!other) return false;
    if (other === normalized) return true;
    if (other.length >= 24 && normalized.includes(other.slice(0, 24))) return true;
    if (normalized.length >= 24 && other.includes(normalized.slice(0, 24))) return true;
    return false;
  });
}

function mapTomorrowRiskLevel(
  model?: TomorrowRiskModel | null,
): CliffhangerRiskLevel {
  if (!model) return 'medium';
  if (model.priority === 'high' && model.tone === 'risk') return 'critical';
  if (model.priority === 'high' || model.tone === 'risk') return 'high';
  if (model.tone === 'watch') return 'medium';
  if (model.tone === 'calm' || model.tone === 'recovery' || model.tone === 'opportunity') {
    return 'low';
  }
  return 'medium';
}

function riskLabelForLevel(level: CliffhangerRiskLevel): string {
  switch (level) {
    case 'low':
      return 'Düşük';
    case 'high':
      return 'Yüksek';
    case 'critical':
      return 'Kritik';
    default:
      return 'Orta';
  }
}

function mapRiskTitle(model?: TomorrowRiskModel | null): string {
  if (!model?.title?.trim()) return 'Yarın Dikkat Sinyali';
  const title = model.title.trim();
  if (/ekip|personel|yorgun/i.test(title)) return 'Ekip Temposu Baskısı';
  if (/sosyal|beklenti|güven/i.test(title)) return 'Sosyal Beklenti Birikiyor';
  if (/kaynak|bütçe|denge/i.test(title)) return 'Kaynak Baskısı Artıyor';
  if (/mahalle|bölge|district/i.test(title)) return 'Mahalle Güveni Kırılgan';
  if (/rota|araç|container|konteyner/i.test(title)) return 'Rutin Hizmet Birikiyor';
  return title;
}

function buildClosingChips(input: BuildEndDayCliffhangerInput): EndDayCliffhangerChip[] {
  const trustTone: CliffhangerChipTone =
    input.cityReaction?.tone === 'positive'
      ? 'positive'
      : input.cityReaction?.tone === 'warning' || input.cityReaction?.tone === 'critical'
        ? 'warning'
        : 'neutral';
  const trustValue =
    trustTone === 'positive'
      ? 'Toparlanıyor'
      : trustTone === 'warning'
        ? 'Kırılgan'
        : 'Dengede';

  const resourceTone: CliffhangerChipTone =
    input.operationSignals?.personnel?.status === 'critical' ||
    input.operationSignals?.vehicles?.status === 'critical' ||
    input.resourceFatigueLabel
      ? 'warning'
      : 'neutral';
  const resourceValue = resourceTone === 'warning' ? 'İzlenmeli' : 'Dengede';

  const socialScore = input.socialPulseScore ?? 50;
  const socialTone: CliffhangerChipTone =
    socialScore >= 68 ? 'warning' : socialScore <= 42 ? 'positive' : 'neutral';
  const socialValue =
    socialTone === 'warning'
      ? 'Beklemede'
      : socialTone === 'positive'
        ? 'Sakinleşiyor'
        : 'İzleniyor';

  const riskLevel = mapTomorrowRiskLevel(input.tomorrowRisk);

  return [
    { label: 'Güven', value: trustValue, tone: trustTone },
    { label: 'Kaynak', value: resourceValue, tone: resourceTone },
    { label: 'Sosyal Nabız', value: socialValue, tone: socialTone },
    { label: 'Yarın Riski', value: riskLabelForLevel(riskLevel), tone: riskLevel === 'low' ? 'positive' : riskLevel === 'critical' ? 'warning' : 'mixed' },
  ];
}

function buildClosingSummary(
  input: BuildEndDayCliffhangerInput,
  chips: EndDayCliffhangerChip[],
): string {
  const day = input.day;
  const resourceChip = chips.find((c) => c.label === 'Kaynak');
  const socialChip = chips.find((c) => c.label === 'Sosyal Nabız');
  const trustChip = chips.find((c) => c.label === 'Güven');

  if (day <= 1) {
    return 'İlk gün tamamlandı. Yarın sosyal nabız ve ekip temposu daha görünür olacak.';
  }

  if (trustChip?.tone === 'positive' && resourceChip?.tone === 'warning') {
    return 'Bugün güven kısmen toparlandı, ancak ekip temposu ve sosyal beklenti yarına sinyal taşıyor.';
  }
  if (socialChip?.tone === 'warning') {
    return 'Operasyonlar sonuç verdi. Yarın sosyal tepki ve ekip temposu daha kritik olacak.';
  }
  if (resourceChip?.tone === 'warning') {
    return 'Şehir bugün sakinleşti, fakat kaynak baskısı tamamen kapanmadı.';
  }
  if (trustChip?.tone === 'positive') {
    return 'Bazı mahallelerde güven toparlandı, bazı baskılar yarına kaldı.';
  }
  return 'Bugün kararların şehirde iz bıraktı. Yarınki sinyalleri izlemek önemli.';
}

function buildTomorrowRiskSection(
  input: BuildEndDayCliffhangerInput,
  existingLines: string[],
): EndDayCliffhangerTomorrowRisk {
  const model = input.tomorrowRisk;
  const level = mapTomorrowRiskLevel(model);
  const title = mapRiskTitle(model);

  const description =
    model?.mainLine?.trim() ||
    (level === 'low'
      ? 'Bugün dengeli ilerledin. Yarın da sosyal nabız ve kaynak temposunu izlemek yeterli.'
      : 'Bugünkü operasyonların etkisi yarına taşınabilir. Sinyalleri yakından izle.');

  const reasons: EndDayCliffhangerTomorrowRisk['reasons'] = [];
  if (input.operationSignals?.personnel?.status === 'watch' || input.operationSignals?.personnel?.status === 'critical') {
    reasons.push({ label: 'Ekip yorgunluğu', tone: 'warning' });
  }
  if (resourceFatigueReason(input)) {
    reasons.push({ label: 'Kaynak baskısı', tone: 'warning' });
  }
  if ((input.socialPulseScore ?? 50) >= 65) {
    reasons.push({ label: 'Sosyal beklenti', tone: 'warning' });
  }
  if (input.carryOverSummary?.trim()) {
    reasons.push({ label: 'Operasyon izi', tone: 'mixed' });
  }
  while (reasons.length < 2) {
    reasons.push(
      reasons.length === 0
        ? { label: 'Şehir sinyali', tone: 'neutral' }
        : { label: 'Günlük tempo', tone: 'neutral' },
    );
  }

  const suggestedFocus =
    model?.ctaLine?.trim() ||
    (level === 'high' || level === 'critical'
      ? 'Yarın ilk hamle güveni onarmaya odaklanmalı.'
      : level === 'low'
        ? 'Dengeyi koru, sosyal nabzı izle.'
        : 'Yarın daha dengeli bir plan tercih edilebilir.');

  const dedupedDescription = isDuplicateLine(description, existingLines)
    ? clampLine(suggestedFocus)
    : clampLine(description);

  return {
    title: 'Yarın Riski',
    riskLabel: riskLabelForLevel(level),
    description: dedupedDescription,
    tone: level,
    reasons: reasons.slice(0, 3),
    suggestedFocus: clampLine(suggestedFocus, 100),
  };
}

function resourceFatigueReason(input: BuildEndDayCliffhangerInput): boolean {
  return Boolean(
    input.resourceFatigueLabel ||
      input.operationSignals?.vehicles?.status === 'watch' ||
      input.operationSignals?.vehicles?.status === 'critical' ||
      input.operationSignals?.overall?.status === 'strained',
  );
}

function buildDistrictWatch(
  input: BuildEndDayCliffhangerInput,
  existingLines: string[],
): EndDayCliffhangerPresentation['districtWatch'] {
  const districts: EndDayCliffhangerDistrictItem[] = [];

  const primaryName = input.lastDistrictName?.trim() || 'Merkez Bölge';
  const primaryDesc =
    input.cityReaction?.shortSummary?.trim() ||
    input.carryOverSummary?.trim() ||
    'Sosyal nabız ve kaynak dengesi izlenmeli.';
  const primaryTone: CliffhangerChipTone =
    input.cityReaction?.tone === 'positive'
      ? 'positive'
      : input.cityReaction?.tone === 'warning' || input.cityReaction?.tone === 'critical'
        ? 'warning'
        : 'neutral';

  if (!isDuplicateLine(primaryDesc, existingLines)) {
    districts.push({
      districtName: primaryName,
      description: clampLine(primaryDesc, 110),
      tone: primaryTone,
      statusLabel: primaryTone === 'warning' ? 'Dikkat' : primaryTone === 'positive' ? 'İzle' : 'Öncelik',
    });
  } else {
    districts.push({
      districtName: primaryName,
      description: 'Güven toparlandı, fakat sosyal beklenti tamamen kapanmadı.',
      tone: 'mixed',
      statusLabel: 'İzle',
    });
  }

  const secondaryName = input.priorityDistrictName?.trim();
  if (
    secondaryName &&
    secondaryName !== primaryName &&
    districts.length < 2
  ) {
    districts.push({
      districtName: secondaryName,
      description: 'Rutin hizmet gecikirse sosyal tepki büyüyebilir.',
      tone: 'warning',
      statusLabel: 'Dikkat',
    });
  }

  return {
    title: 'Takip Edilecek Mahalle',
    districts: districts.slice(0, 2),
  };
}

function buildCarriedPressures(input: BuildEndDayCliffhangerInput): EndDayCliffhangerPresentation['carriedPressures'] {
  const personnelStatus = input.operationSignals?.personnel?.status;
  const teamTone: CliffhangerChipTone =
    personnelStatus === 'critical' || personnelStatus === 'watch' ? 'warning' : 'neutral';
  const teamValue = teamTone === 'warning' ? 'Tempo yüksek' : 'Tempo korunuyor';

  const resourceTone: CliffhangerChipTone = resourceFatigueReason(input) ? 'warning' : 'neutral';
  const resourceValue = resourceTone === 'warning' ? 'Orta baskı' : 'Dengede';

  const socialScore = input.socialPulseScore ?? 50;
  const socialTone: CliffhangerChipTone = socialScore >= 65 ? 'warning' : socialScore <= 45 ? 'positive' : 'neutral';
  const socialValue =
    socialTone === 'warning'
      ? 'Beklenti sürüyor'
      : socialTone === 'positive'
        ? 'Sakinleşiyor'
        : 'İzleniyor';

  return {
    title: 'Kalan Baskılar',
    items: [
      {
        id: 'team',
        label: 'Ekip',
        value: teamValue,
        description:
          teamTone === 'warning'
            ? 'Yarın kapasite izlenmeli'
            : 'Ekip temposu kontrollü',
        tone: teamTone,
        iconKey: 'people-outline',
      },
      {
        id: 'resource',
        label: 'Kaynak',
        value: resourceValue,
        description:
          resourceTone === 'warning'
            ? 'Plan maliyeti dengelenmeli'
            : 'Kaynak kullanımı dengede',
        tone: resourceTone,
        iconKey: 'wallet-outline',
      },
      {
        id: 'social',
        label: 'Sosyal Nabız',
        value: socialValue,
        description:
          socialTone === 'warning'
            ? 'Görünür takip güveni korur'
            : 'Mahalle tepkisi izleniyor',
        tone: socialTone,
        iconKey: 'chatbubbles-outline',
      },
    ],
  };
}

function buildAdvisorNote(
  input: BuildEndDayCliffhangerInput,
  tomorrowRisk: EndDayCliffhangerTomorrowRisk,
  existingLines: string[],
): EndDayCliffhangerPresentation['advisor'] {
  const avoidLines = [
    ...existingLines,
    tomorrowRisk.description,
    tomorrowRisk.suggestedFocus,
  ].filter(Boolean);

  let message: string | undefined;
  if (input.eceMemoryContext) {
    const memory = buildEceMemorySnapshot(input.eceMemoryContext);
    message = buildReportEceReflection({
      memory,
      context: input.eceMemoryContext,
      seed: `report-cliffhanger:${input.day}`,
      avoidLines,
    });
  }

  if (!message || isDuplicateLine(message, avoidLines)) {
    const level = tomorrowRisk.tone;
    if (input.day <= 1) {
      message = 'İlk günü tamamladın. Yarın sosyal nabız ve ekip temposunu birlikte izle.';
    } else if (level === 'high' || level === 'critical') {
      message = 'Sonuçlar karışık. Yarın ilk hamle güveni onarmaya odaklanmalı.';
    } else if (resourceFatigueReason(input)) {
      message = 'Hızlı müdahaleler güveni toparladı. Yarın ekip yorgunluğunu dikkate al.';
    } else if (level === 'low') {
      message = 'Bugün riski büyütmeden ilerledin. Yarın kaynak temposunu korumak önemli.';
    } else {
      message = 'Bugün dengeli ilerledin. Yarın sosyal beklentiyi ve kaynak temposunu izle.';
    }
  }

  const toneLabel =
    tomorrowRisk.tone === 'critical' || tomorrowRisk.tone === 'high'
      ? 'Dikkat'
      : tomorrowRisk.tone === 'low'
        ? 'Öneri'
        : 'Stratejik';

  return {
    title: 'Ece’nin Yarın Notu',
    message: clampLine(message, 120),
    toneLabel,
  };
}

function resolveFooterCtaLabel(input: BuildEndDayCliffhangerInput): string {
  if (input.day === 7 && input.hasPilotCompletion) {
    return 'Ana Operasyona Göz At';
  }
  return 'Yarına Hazırlan';
}

export function buildEndDayCliffhangerPresentation(
  input: BuildEndDayCliffhangerInput,
): EndDayCliffhangerPresentation {
  const existingLines = [
    ...(input.existingLines ?? []),
    ...(input.reportSummaryLines ?? []),
    input.carryOverSummary ?? '',
    input.tomorrowRisk?.mainLine ?? '',
    input.tomorrowRisk?.supportLine ?? '',
    input.cityReaction?.shortSummary ?? '',
  ].filter(Boolean);

  const chips = buildClosingChips(input);
  const summary = buildClosingSummary(input, chips);
  const tomorrowRisk = buildTomorrowRiskSection(input, existingLines);
  const districtWatch = buildDistrictWatch(input, [
    ...existingLines,
    tomorrowRisk.description,
  ]);
  const carriedPressures = buildCarriedPressures(input);
  const advisor = buildAdvisorNote(input, tomorrowRisk, [
    ...existingLines,
    tomorrowRisk.description,
  ]);

  const bridgeTone: CliffhangerChipTone =
    tomorrowRisk.tone === 'low'
      ? 'positive'
      : tomorrowRisk.tone === 'critical' || tomorrowRisk.tone === 'high'
        ? 'warning'
        : 'mixed';

  return {
    visible: true,
    closingBridge: {
      title: 'Yarına Kalan İz',
      summary: clampLine(summary),
      tone: bridgeTone,
      chips,
    },
    tomorrowRisk,
    districtWatch,
    carriedPressures,
    advisor,
    primaryCta: {
      label: resolveFooterCtaLabel(input),
      enabled: true,
      actionKey: input.day === 7 && input.hasPilotCompletion ? 'pilot_preview' : 'prepare_tomorrow',
    },
  };
}

export function auditEndDayCliffhangerPresentation(
  model: EndDayCliffhangerPresentation,
): string[] {
  const issues: string[] = [];
  const allText = [
    model.closingBridge.summary,
    model.tomorrowRisk.description,
    model.tomorrowRisk.suggestedFocus,
    model.advisor.message,
    ...model.districtWatch.districts.map((d) => d.description),
    ...model.carriedPressures.items.map((i) => i.description),
  ].join(' ').toLowerCase();

  if (!model.closingBridge.title.trim()) issues.push('closingBridge title empty');
  if (!model.closingBridge.summary.trim()) issues.push('closingBridge summary empty');
  if (model.closingBridge.chips.length < 3) issues.push('closingBridge chips too few');
  if (!model.tomorrowRisk.description.trim()) issues.push('tomorrowRisk description empty');
  if (model.districtWatch.districts.length < 1) issues.push('districtWatch empty');
  if (model.districtWatch.districts.length > 2) issues.push('districtWatch too many');
  if (model.carriedPressures.items.length !== 3) issues.push('carriedPressures count');
  if (!model.advisor.message.trim()) issues.push('advisor message empty');
  if (!model.primaryCta.label.trim()) issues.push('primaryCta empty');

  for (const phrase of FORBIDDEN_CLIFFHANGER_PHRASES) {
    if (allText.includes(phrase)) issues.push(`forbidden phrase: ${phrase}`);
  }

  return issues;
}

export function cliffhangerStringsForAudit(model: EndDayCliffhangerPresentation): string[] {
  return [
    model.closingBridge.title,
    model.closingBridge.summary,
    ...model.closingBridge.chips.map((c) => `${c.label} ${c.value}`),
    model.tomorrowRisk.title,
    model.tomorrowRisk.description,
    model.tomorrowRisk.suggestedFocus,
    ...model.tomorrowRisk.reasons.map((r) => r.label),
    ...model.districtWatch.districts.map((d) => `${d.districtName} ${d.description}`),
    ...model.carriedPressures.items.map((i) => `${i.label} ${i.value} ${i.description}`),
    model.advisor.message,
    model.primaryCta.label,
  ];
}
