import type { EventCard } from '@/core/models/EventCard';
import {
  buildEceMemorySnapshot,
  buildInspectEceLine,
  type EceMemoryContextInput,
} from '@/core/eceTone';

import type {
  EventInspectAdvisorComment,
  EventInspectInteractionState,
} from './eventInspectPhasePresentation';

export type InspectLowerTone = 'positive' | 'neutral' | 'mixed' | 'warning' | 'critical';

export type InspectLowerIconKey =
  | 'pulse-outline'
  | 'walk-outline'
  | 'albums-outline'
  | 'checkmark-circle'
  | 'radio-outline'
  | 'chatbubble-ellipses-outline'
  | 'scan-outline'
  | 'warning-outline'
  | 'map-outline'
  | 'create-outline'
  | 'shield-outline'
  | 'megaphone-outline'
  | 'briefcase-outline'
  | 'sparkles-outline';

export type InspectSignalAnalysisItem = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  tone: InspectLowerTone;
  iconKey: InspectLowerIconKey;
};

export type InspectEvidenceSourceItem = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  tone: InspectLowerTone;
  iconKey: InspectLowerIconKey;
  verified: boolean;
};

export type InspectRiskPreviewItem = {
  id: string;
  title: string;
  valueLabel: string;
  description: string;
  tone: InspectLowerTone;
  indicator: number;
  iconKey: InspectLowerIconKey;
};

export type InspectNeighborhoodVoiceItem = {
  id: string;
  sourceLabel: string;
  quote: string;
  tone: InspectLowerTone;
  iconKey: InspectLowerIconKey;
};

export type InspectLowerActionKey =
  | 'scan_signal'
  | 'view_risk'
  | 'view_map'
  | 'open_note';

export type InspectLowerAction = {
  id: string;
  label: string;
  iconKey: InspectLowerIconKey;
  actionKey: InspectLowerActionKey;
};

export type InspectLowerPrimaryCta = {
  label: string;
  enabled: boolean;
  actionKey: 'go_to_plan' | 'complete_signals' | 'start_scan' | 'disabled';
};

export type EventInspectLowerPresentation = {
  signalAnalysis: {
    title: string;
    countLabel: string;
    items: InspectSignalAnalysisItem[];
  };
  evidenceSources: {
    title: string;
    statusLabel: string;
    items: InspectEvidenceSourceItem[];
  };
  riskPreview: {
    title: string;
    toneLabel: string;
    items: InspectRiskPreviewItem[];
  };
  neighborhoodVoices: {
    title: string;
    items: InspectNeighborhoodVoiceItem[];
  };
  advisor: {
    title: string;
    message: string;
    toneLabel: string;
    tone: InspectLowerTone;
    iconKey: InspectLowerIconKey;
  };
  actions: InspectLowerAction[];
  primaryCta: InspectLowerPrimaryCta;
};

export type BuildEventInspectLowerPresentationInput = {
  event: EventCard;
  day?: number;
  interactionState: EventInspectInteractionState;
  confirmedSignalIds?: readonly string[];
  advisorComment?: EventInspectAdvisorComment;
  signalsComplete?: boolean;
  eceMemoryContext?: EceMemoryContextInput;
};

function riskLevelLabel(risk: EventCard['riskLevel']): string {
  switch (risk) {
    case 'critical':
    case 'high':
      return 'Yüksek';
    case 'medium':
      return 'Orta';
    default:
      return 'Düşük';
  }
}

function riskTone(risk: EventCard['riskLevel']): InspectLowerTone {
  if (risk === 'critical') return 'critical';
  if (risk === 'high') return 'warning';
  if (risk === 'medium') return 'mixed';
  return 'neutral';
}

function hasResourcePressure(event: EventCard): boolean {
  return event.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (
      (costs.budget ?? 0) > 0 ||
      (costs.staffHours ?? 0) > 0 ||
      (costs.vehicleUsage ?? 0) > 0 ||
      (costs.morale ?? 0) > 0
    );
  });
}

function buildSignalAnalysisItems(event: EventCard): InspectSignalAnalysisItem[] {
  const socialLevel = riskLevelLabel(
    event.riskLevel === 'critical' || event.riskLevel === 'high'
      ? 'high'
      : event.previewEffects.publicSatisfaction <= -3
        ? 'high'
        : 'medium',
  );
  const fieldLevel = riskLevelLabel(
    event.riskLevel === 'critical' || event.riskLevel === 'high' ? 'high' : 'medium',
  );
  const historyLevel =
    event.riskLevel === 'low' && event.previewEffects.risk <= 0 ? 'Düşük' : 'Orta';

  return [
    {
      id: 'social_pulse',
      title: 'Sosyal Nabız',
      description: 'Vatandaş paylaşımları ve şikayet yoğunluğu',
      statusLabel: socialLevel,
      tone:
        socialLevel === 'Yüksek'
          ? 'warning'
          : socialLevel === 'Orta'
            ? 'mixed'
            : 'neutral',
      iconKey: 'pulse-outline',
    },
    {
      id: 'field_observations',
      title: 'Saha Gözlemleri',
      description: 'Ekip saha taraması ve gözlem notları',
      statusLabel: fieldLevel,
      tone: fieldLevel === 'Yüksek' ? 'mixed' : 'neutral',
      iconKey: 'walk-outline',
    },
    {
      id: 'similar_cases',
      title: 'Benzer Olaylar',
      description: 'Geçmiş vakalar ve çözüm başarıları',
      statusLabel: historyLevel,
      tone: historyLevel === 'Düşük' ? 'neutral' : 'mixed',
      iconKey: 'albums-outline',
    },
  ];
}

function buildEvidenceItems(
  confirmedSignalIds: readonly string[],
): InspectEvidenceSourceItem[] {
  const hasField = confirmedSignalIds.includes('field');
  const hasCitizen = confirmedSignalIds.includes('citizen');
  const hasSocial = confirmedSignalIds.includes('social');

  return [
    {
      id: 'field_finding',
      title: 'Saha Bulgusu',
      description: 'Ekip gözlemi alındı',
      statusLabel: hasField ? 'Doğrulandı' : 'Bekliyor',
      tone: hasField ? 'positive' : 'neutral',
      iconKey: 'walk-outline',
      verified: hasField,
    },
    {
      id: 'citizen_report',
      title: 'Vatandaş Bildirimi',
      description: 'Mahalle geri bildirimi geldi',
      statusLabel: hasCitizen ? 'Doğrulandı' : 'Bekliyor',
      tone: hasCitizen ? 'positive' : 'neutral',
      iconKey: 'chatbubble-ellipses-outline',
      verified: hasCitizen,
    },
    {
      id: 'social_echo',
      title: 'Sosyal Yankı',
      description: 'Sosyal nabız takipte',
      statusLabel: hasSocial ? 'Doğrulandı' : 'İzleniyor',
      tone: hasSocial ? 'positive' : 'mixed',
      iconKey: 'radio-outline',
      verified: hasSocial,
    },
  ];
}

function buildRiskPreviewItems(event: EventCard, day: number): InspectRiskPreviewItem[] {
  const socialValue =
    event.previewEffects.publicSatisfaction <= -5 || event.riskLevel === 'critical'
      ? 72
      : event.previewEffects.publicSatisfaction <= -2
        ? 58
        : 42;
  const socialLabel = socialValue >= 68 ? 'Yüksek' : socialValue >= 48 ? 'Orta' : 'Düşük';

  const operationValue =
    event.riskLevel === 'critical'
      ? 78
      : event.riskLevel === 'high'
        ? 62
        : event.riskLevel === 'medium'
          ? 46
          : 28;
  const operationLabel =
    operationValue >= 68 ? 'Yüksek' : operationValue >= 44 ? 'Orta' : 'Düşük';

  const resourceValue = hasResourcePressure(event) ? 58 : 34;
  const resourceLabel = resourceValue >= 55 ? 'Orta' : 'Düşük';

  const items: InspectRiskPreviewItem[] = [
    {
      id: 'social_reaction',
      title: 'Sosyal Tepki',
      valueLabel: socialLabel,
      description: 'Mahalle beklentisi yükseliyor',
      tone: socialLabel === 'Yüksek' ? 'warning' : 'mixed',
      indicator: socialValue,
      iconKey: 'pulse-outline',
    },
    {
      id: 'operation_risk',
      title: 'Operasyon Riski',
      valueLabel: operationLabel,
      description: 'Müdahale kontrol edilebilir',
      tone: operationLabel === 'Yüksek' ? 'warning' : 'neutral',
      indicator: operationValue,
      iconKey: 'shield-outline',
    },
  ];

  if (day >= 8 && (event.riskLevel === 'high' || event.riskLevel === 'critical')) {
    items.push({
      id: 'press_reflection',
      title: 'Basın Yansıması',
      valueLabel: socialLabel,
      description: 'Medya dikkati artabilir',
      tone: 'warning',
      indicator: Math.min(88, socialValue + 8),
      iconKey: 'megaphone-outline',
    });
  } else {
    items.push({
      id: 'resource_pressure',
      title: 'Kaynak Baskısı',
      valueLabel: resourceLabel,
      description: 'Ekip temposu izlenmeli',
      tone: resourceLabel === 'Orta' ? 'mixed' : 'neutral',
      indicator: resourceValue,
      iconKey: 'briefcase-outline',
    });
  }

  return items;
}

function resolveRiskPreviewToneLabel(items: InspectRiskPreviewItem[]): string {
  if (items.some((item) => item.valueLabel === 'Yüksek')) return 'Yüksek';
  if (items.some((item) => item.valueLabel === 'Orta')) return 'Orta';
  return 'Düşük';
}

function buildNeighborhoodVoices(event: EventCard): InspectNeighborhoodVoiceItem[] {
  const category = event.category?.toLowerCase() ?? '';

  const fieldQuote = category.includes('light') || category.includes('aydın')
    ? 'Işıklandırma yetersiz kalıyor.'
    : category.includes('waste') || category.includes('temizlik')
      ? 'Atık birikimi hızlandı.'
      : 'Saha baskısı hissediliyor.';

  const citizenQuote =
    event.previewEffects.publicSatisfaction <= -3
      ? 'Güven algısı zayıflıyor.'
      : 'Sosyal alan eksikliği konuşuluyor.';

  const socialQuote =
    event.riskLevel === 'critical' || event.riskLevel === 'high'
      ? 'Olumsuz paylaşımlar artıyor.'
      : 'Mahalle nabzı yükseliyor.';

  return [
    {
      id: 'voice_field',
      sourceLabel: 'Saha',
      quote: fieldQuote,
      tone: 'mixed',
      iconKey: 'walk-outline',
    },
    {
      id: 'voice_citizen',
      sourceLabel: 'Vatandaş',
      quote: citizenQuote,
      tone: event.previewEffects.publicSatisfaction <= -3 ? 'warning' : 'neutral',
      iconKey: 'chatbubble-ellipses-outline',
    },
    {
      id: 'voice_social',
      sourceLabel: 'Sosyal',
      quote: socialQuote,
      tone: riskTone(event.riskLevel),
      iconKey: 'radio-outline',
    },
  ];
}

function buildAdvisorBlock(
  event: EventCard,
  advisorComment?: EventInspectAdvisorComment,
  day = 1,
  eceMemoryContext?: EceMemoryContextInput,
): EventInspectLowerPresentation['advisor'] {
  if (advisorComment?.text?.trim()) {
    const tone: InspectLowerTone =
      advisorComment.tone === 'urgent' || advisorComment.tone === 'warning'
        ? 'warning'
        : advisorComment.tone === 'positive'
          ? 'positive'
          : 'mixed';

    return {
      title: 'Ece Değerlendirmesi',
      message: advisorComment.text.trim(),
      toneLabel: tone === 'warning' ? 'Dikkat' : 'Önerilir',
      tone,
      iconKey: 'sparkles-outline',
    };
  }

  const memoryContext: EceMemoryContextInput = {
    day,
    event,
    districtName: event.district,
    socialPressure: (event.previewEffects?.publicSatisfaction ?? 0) <= -3,
    resourcePressure: event.riskLevel === 'high' || event.riskLevel === 'critical',
    ...eceMemoryContext,
  };
  const memory = buildEceMemorySnapshot(memoryContext);
  const line = buildInspectEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:inspect-lower:${day}`,
    avoidLines: eceMemoryContext?.avoidLines,
  });

  const tone: InspectLowerTone =
    line.tone === 'cautionary' || line.tone === 'direct' || line.tone === 'skeptical'
      ? 'warning'
      : line.tone === 'supportive'
        ? 'positive'
        : 'mixed';

  return {
    title: 'Ece Değerlendirmesi',
    message: line.message,
    toneLabel: tone === 'warning' ? 'Dikkat' : 'Önerilir',
    tone,
    iconKey: 'sparkles-outline',
  };
}

function buildPrimaryCta(
  interactionState: EventInspectInteractionState,
  signalsComplete: boolean,
): InspectLowerPrimaryCta {
  if (interactionState === 'analyzing') {
    return {
      label: 'Sinyaller taranıyor…',
      enabled: false,
      actionKey: 'disabled',
    };
  }
  if (signalsComplete || interactionState === 'revealed') {
    return {
      label: 'Planlamaya Geç',
      enabled: true,
      actionKey: 'go_to_plan',
    };
  }
  return {
    label: 'Sinyalleri Tamamla',
    enabled: true,
    actionKey: 'complete_signals',
  };
}

export function buildEventInspectLowerPresentation(
  input: BuildEventInspectLowerPresentationInput,
): EventInspectLowerPresentation {
  const day = input.day ?? eventDayFallback(input.event);
  const confirmedSignalIds = input.confirmedSignalIds ?? [];
  const signalsComplete =
    input.signalsComplete === true ||
    confirmedSignalIds.length >= 3 ||
    input.interactionState === 'revealed';

  const evidenceItems = buildEvidenceItems(confirmedSignalIds);
  const verifiedCount = evidenceItems.filter((item) => item.verified).length;
  const riskItems = buildRiskPreviewItems(input.event, day);

  return {
    signalAnalysis: {
      title: 'Sinyal Çözümleme',
      countLabel: '3 iz',
      items: buildSignalAnalysisItems(input.event),
    },
    evidenceSources: {
      title: 'Kanıt Kaynakları',
      statusLabel:
        verifiedCount > 0 ? `${verifiedCount}/3 doğrulandı` : '3 kaynak',
      items: evidenceItems,
    },
    riskPreview: {
      title: 'Risk Ön Okuması',
      toneLabel: resolveRiskPreviewToneLabel(riskItems),
      items: riskItems,
    },
    neighborhoodVoices: {
      title: 'Mahalle Kaynak Sesleri',
      items: buildNeighborhoodVoices(input.event),
    },
    advisor: buildAdvisorBlock(
      input.event,
      input.advisorComment,
      day,
      input.eceMemoryContext,
    ),
    actions: [
      { id: 'scan', label: 'Sinyali Tara', iconKey: 'scan-outline', actionKey: 'scan_signal' },
      { id: 'risk', label: 'Riski Gör', iconKey: 'warning-outline', actionKey: 'view_risk' },
      { id: 'map', label: 'Haritada Gör', iconKey: 'map-outline', actionKey: 'view_map' },
      { id: 'note', label: 'Not Aç', iconKey: 'create-outline', actionKey: 'open_note' },
    ],
    primaryCta: buildPrimaryCta(input.interactionState, signalsComplete),
  };
}

function eventDayFallback(event: EventCard): number {
  return event.day ?? 2;
}

export function auditEventInspectLowerPresentation(
  model: EventInspectLowerPresentation,
): string[] {
  const issues: string[] = [];
  const forbiddenPhrases = ['dinleme kayıtları', 'dinleme kaydı', 'açık kaynak verisi', 'arşivle'];

  const allText = [
    ...model.signalAnalysis.items.flatMap((item) => [item.title, item.description]),
    ...model.evidenceSources.items.flatMap((item) => [item.title, item.description]),
    ...model.neighborhoodVoices.items.map((item) => item.quote),
    model.advisor.message,
    model.primaryCta.label,
    ...model.actions.map((action) => action.label),
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR');

  for (const phrase of forbiddenPhrases) {
    if (allText.includes(phrase)) {
      issues.push(`forbidden copy: ${phrase}`);
    }
  }

  const forbiddenActionLabels = ['Paylaş', 'Arşivle'];
  for (const action of model.actions) {
    if (forbiddenActionLabels.includes(action.label)) {
      issues.push(`forbidden action: ${action.label}`);
    }
  }

  if (model.signalAnalysis.items.length !== 3) {
    issues.push('signalAnalysis must have 3 items');
  }
  if (model.evidenceSources.items.length !== 3) {
    issues.push('evidenceSources must have 3 items');
  }
  if (model.riskPreview.items.length !== 3) {
    issues.push('riskPreview must have 3 items');
  }
  if (model.neighborhoodVoices.items.length !== 3) {
    issues.push('neighborhoodVoices must have 3 items');
  }
  if (model.actions.length !== 4) {
    issues.push('actions must have 4 items');
  }

  return issues;
}
