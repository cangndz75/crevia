import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { isContainerRelevantEvent } from '@/core/containers/containerDecisionEffects';
import type { EventCard } from '@/core/models/EventCard';
import { getRiskLevelLabel } from '@/core/content/mockGameData';

import type {
  PlanDetail,
  PlanOptionId,
} from '@/features/events/utils/eventWorkflowPlanPresentation';

export type PlanningDetailSectionId =
  | 'resources'
  | 'cost'
  | 'personnel'
  | 'vehicle'
  | 'citizen';

export type PlanningDetailAccentTone = 'mint' | 'teal' | 'purple' | 'green' | 'citizen';

export type PlanningDetailStat = {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'accent';
};

export type PlanningDetailRoutePreview = {
  startLabel: string;
  endLabel: string;
  zoneLabel: string;
  vehicleCount: number;
  distanceKm: string;
  durationLabel: string;
  savingsLabel?: string;
  footnote?: string;
};

export type PlanningDetailExpandedContent =
  | { kind: 'stats'; stats: PlanningDetailStat[]; footnote?: string }
  | {
      kind: 'statsWithBadge';
      stats: PlanningDetailStat[];
      badge: { label: string; value: string; tone: 'positive' | 'neutral' | 'warning' };
      footnote?: string;
    }
  | {
      kind: 'route';
      route: PlanningDetailRoutePreview;
      stats: PlanningDetailStat[];
      footnote?: string;
    };

export type PlanningDetailSectionModel = {
  id: PlanningDetailSectionId;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accentTone: PlanningDetailAccentTone;
  summaryChips?: string[];
  expanded: PlanningDetailExpandedContent;
};

export type PlanningDetailsSummary = {
  categoryCount: number;
  chipLabel: string;
};

type PlanMetrics = {
  successPct: number;
  costAmount: number;
  costLevel: 'düşük' | 'orta' | 'yüksek';
  fatiguePct: number;
  moraleImpact: string;
  teamFit: string;
  opsRisk: string;
  vehicleCount: number;
  supportCrew: number;
  coverage: string;
  distanceKm: string;
  routeSavings?: string;
  timeEfficiency: string;
  budgetImpact: string;
  satisfaction: string;
  complaintPressure: string;
  perception: string;
  sensitivity: string;
};

function parseCostAmount(costLabel: string): number {
  const digits = costLabel.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 16800;
}

function parseSuccessPct(successLabel: string): number {
  const n = parseInt(successLabel.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 90;
}

function derivePlanMetrics(plan: PlanDetail, planId: PlanOptionId): PlanMetrics {
  const successPct = parseSuccessPct(plan.successLabel);
  const costAmount = parseCostAmount(plan.costLabel);
  const costLevel: PlanMetrics['costLevel'] =
    planId === 'economy' ? 'düşük' : planId === 'fast' ? 'yüksek' : 'orta';

  const fatiguePct = planId === 'fast' ? 94 : planId === 'economy' ? 72 : 78;
  const vehicleCount = plan.vehicle.toLowerCase().includes('yaya')
    ? 0
    : planId === 'fast'
      ? 2
      : 1;

  return {
    successPct,
    costAmount,
    costLevel,
    fatiguePct,
    moraleImpact:
      planId === 'fast'
        ? 'düşük negatif'
        : planId === 'economy'
          ? 'dengeli'
          : 'hafif pozitif',
    teamFit: planId === 'economy' ? 'orta' : 'yüksek',
    opsRisk: planId === 'fast' ? 'orta-yüksek' : planId === 'economy' ? 'orta' : 'düşük',
    vehicleCount,
    supportCrew: planId === 'fast' ? 3 : planId === 'economy' ? 1 : 2,
    coverage:
      planId === 'economy' ? '2 bölge / düşük yoğunluk' : '3 bölge / orta yoğunluk',
    distanceKm: planId === 'fast' ? '22.4' : planId === 'economy' ? '14.2' : '18.6',
    routeSavings: planId === 'economy' ? '%8 tasarruf' : '%18 tasarruf',
    timeEfficiency: planId === 'fast' ? 'çok iyi' : planId === 'economy' ? 'orta' : 'iyi',
    budgetImpact: costLevel,
    satisfaction:
      successPct >= 90 ? 'yüksek' : successPct >= 82 ? 'orta-yüksek' : 'orta',
    complaintPressure:
      planId === 'fast' ? 'hızla azalır' : planId === 'economy' ? 'yavaş azalır' : 'azalır',
    perception: planId === 'economy' ? 'nötr' : 'olumlu',
    sensitivity:
      planId === 'fast' ? 'orta' : planId === 'economy' ? 'düşük' : 'düşük',
  };
}

function eventTextBlob(event: EventCard): string {
  return [
    event.title,
    event.category,
    event.description,
    event.contextTag,
    ...(event.filterTags ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

function isLogisticsWeightedEvent(event: EventCard): boolean {
  const blob = eventTextBlob(event);
  if (
    event.eventType === 'waste' ||
    event.eventType === 'market' ||
    event.eventType === 'vehicle'
  ) {
    return true;
  }
  if (
    blob.includes('konteyner') ||
    blob.includes('temizlik') ||
    blob.includes('topla') ||
    blob.includes('rota') ||
    blob.includes('lojistik') ||
    blob.includes('araç')
  ) {
    return true;
  }
  return isContainerRelevantEvent({
    id: event.id,
    title: event.title,
    category: event.category,
    eventType: event.eventType,
    neighborhoodId: event.neighborhoodId,
    tags: event.filterTags,
  });
}

function isPersonnelWeightedEvent(event: EventCard, planId: PlanOptionId): boolean {
  if (planId === 'fast') return true;
  const blob = eventTextBlob(event);
  return (
    event.eventType === 'staff' ||
    blob.includes('personel') ||
    blob.includes('ekip') ||
    blob.includes('morale') ||
    blob.includes('yorgun') ||
    blob.includes('vardiya')
  );
}

function isCitizenWeightedEvent(event: EventCard): boolean {
  const blob = eventTextBlob(event);
  return (
    event.eventType === 'citizen_complaint' ||
    event.eventType === 'social_media' ||
    event.eventType === 'noise' ||
    blob.includes('şikayet') ||
    blob.includes('sikayet') ||
    blob.includes('memnuniyet') ||
    blob.includes('vatandaş') ||
    blob.includes('vatandas') ||
    blob.includes('güven') ||
    blob.includes('guven') ||
    (event.filterTags?.includes('crisis') ?? false)
  );
}

function isBudgetTimeWeightedEvent(event: EventCard, planId: PlanOptionId): boolean {
  if (planId === 'economy') return true;
  if (event.riskLevel === 'critical') return true;
  const budget = event.previewEffects.budget;
  if (budget !== undefined && budget < -8) return true;
  const blob = eventTextBlob(event);
  return (
    blob.includes('bütçe') ||
    blob.includes('butce') ||
    blob.includes('maliyet') ||
    blob.includes('zaman baskı')
  );
}

/** İlk açılış veya event değişiminde kullanılır */
export function getDefaultPlanningDetailSection(
  event: EventCard,
  selectedPlanId: PlanOptionId,
): PlanningDetailSectionId {
  if (isLogisticsWeightedEvent(event)) return 'vehicle';
  if (isPersonnelWeightedEvent(event, selectedPlanId)) return 'personnel';
  if (isCitizenWeightedEvent(event)) return 'citizen';
  if (isBudgetTimeWeightedEvent(event, selectedPlanId)) return 'cost';
  return 'resources';
}

export function resolvePlanningDetailSummary(
  sections: PlanningDetailSectionModel[],
): PlanningDetailsSummary {
  return {
    categoryCount: sections.length,
    chipLabel: `${sections.length}/${sections.length} kategori`,
  };
}

export function buildPlanningDetailSections(
  event: EventCard,
  plan: PlanDetail,
  planId: PlanOptionId,
): PlanningDetailSectionModel[] {
  const m = derivePlanMetrics(plan, planId);
  const priority = getRiskLevelLabel(event.riskLevel);
  const costFormatted = plan.costLabel;

  const resources: PlanningDetailSectionModel = {
    id: 'resources',
    title: 'Kaynak Detayları',
    subtitle: 'Ekip, ekipman ve malzeme kaynakları',
    icon: 'cube-outline',
    accentTone: 'mint',
    summaryChips: [plan.team, `${m.vehicleCount || 1} araç`],
    expanded: {
      kind: 'stats',
      stats: [
        { label: 'Ekip', value: plan.team, tone: 'accent' },
        {
          label: 'Araç',
          value: m.vehicleCount > 0 ? plan.vehicle : 'Yaya ekip',
          tone: 'neutral',
        },
        { label: 'Destek', value: `${m.supportCrew} saha desteği`, tone: 'neutral' },
        { label: 'Kapsama', value: m.coverage, tone: 'positive' },
      ],
      footnote: 'Yedek ekip 1 saat içinde devreye alınabilir.',
    },
  };

  const cost: PlanningDetailSectionModel = {
    id: 'cost',
    title: 'Maliyet ve Süre',
    subtitle: 'Bütçe kalemleri ve zaman planı',
    icon: 'wallet-outline',
    accentTone: 'teal',
    summaryChips: [plan.durationLabel, `maliyet ${m.costLevel}`],
    expanded: {
      kind: 'statsWithBadge',
      stats: [
        { label: 'Toplam maliyet', value: costFormatted, tone: 'accent' },
        { label: 'Tahmini süre', value: plan.durationLabel, tone: 'neutral' },
        { label: 'Zaman verimi', value: m.timeEfficiency, tone: 'positive' },
        { label: 'Bütçe etkisi', value: m.budgetImpact, tone: 'neutral' },
      ],
      badge: {
        label: 'Başarı-maliyet dengesi',
        value: `%${m.successPct} başarı · ${m.costLevel} maliyet`,
        tone: m.successPct >= 88 ? 'positive' : 'warning',
      },
      footnote: 'Gece vardiyası ve lojistik ön bütçeye dahil.',
    },
  };

  const personnel: PlanningDetailSectionModel = {
    id: 'personnel',
    title: 'Personel Etkisi',
    subtitle: 'Görev dağılımı ve çalışma yükü',
    icon: 'people-outline',
    accentTone: 'purple',
    summaryChips: [`Yorgunluk %${m.fatiguePct}`, m.opsRisk],
    expanded: {
      kind: 'stats',
      stats: [
        { label: 'Yorgunluk', value: `%${m.fatiguePct}`, tone: m.fatiguePct >= 90 ? 'warning' : 'neutral' },
        { label: 'Moral etkisi', value: m.moraleImpact, tone: 'neutral' },
        { label: 'Ekip uygunluğu', value: m.teamFit, tone: 'positive' },
        { label: 'Operasyon riski', value: m.opsRisk, tone: 'warning' },
      ],
      footnote:
        planId === 'fast'
          ? 'Ekstra vardiya personel yükünü artırır.'
          : 'İzinli personel yok; yedek liste aktif.',
    },
  };

  const vehicle: PlanningDetailSectionModel = {
    id: 'vehicle',
    title: 'Araç ve Rota',
    subtitle: 'Kullanılacak araçlar ve güzergâh planı',
    icon: 'navigate-outline',
    accentTone: 'green',
    summaryChips: [`${m.vehicleCount || 1} araç`, `${m.distanceKm} km`],
    expanded: {
      kind: 'route',
      route: {
        startLabel: 'Operasyon Merkezi',
        endLabel: event.district,
        zoneLabel: `${event.district} · merkez durak`,
        vehicleCount: m.vehicleCount || 1,
        distanceKm: m.distanceKm,
        durationLabel: plan.durationLabel,
        savingsLabel: m.routeSavings,
        footnote: 'Trafik yoğunluğuna göre alternatif güzergâh hazır.',
      },
      stats: [
        { label: 'Araç sayısı', value: String(m.vehicleCount || 1), tone: 'accent' },
        { label: 'Toplam mesafe', value: `${m.distanceKm} km`, tone: 'neutral' },
        { label: 'Tahmini süre', value: plan.durationLabel, tone: 'neutral' },
        {
          label: 'Rota verimi',
          value: m.routeSavings ?? 'dengeli',
          tone: 'positive',
        },
      ],
      footnote: 'Yakıt optimizasyonu ve çevresel etki düşük tutuldu.',
    },
  };

  const citizen: PlanningDetailSectionModel = {
    id: 'citizen',
    title: 'Vatandaş Etkisi',
    subtitle: 'Hizmet kapsamı ve memnuniyet',
    icon: 'heart-outline',
    accentTone: 'citizen',
    summaryChips: [m.satisfaction, m.perception],
    expanded: {
      kind: 'stats',
      stats: [
        { label: 'Beklenen memnuniyet', value: m.satisfaction, tone: 'positive' },
        { label: 'Şikayet baskısı', value: m.complaintPressure, tone: 'accent' },
        { label: 'Algı etkisi', value: m.perception, tone: 'positive' },
        { label: 'Hassasiyet', value: m.sensitivity, tone: 'neutral' },
      ],
      footnote: `Öncelik ${priority}; şikayet hattı bilgilendirilecek.`,
    },
  };

  return [resources, cost, personnel, vehicle, citizen];
}

export const PLANNING_DETAIL_ACCENT: Record<
  PlanningDetailAccentTone,
  { iconBg: string; iconColor: string; openBorder: string; openGlow: string }
> = {
  mint: {
    iconBg: '#E8F7EF',
    iconColor: '#0B6B61',
    openBorder: 'rgba(11, 107, 97, 0.35)',
    openGlow: 'rgba(221, 244, 232, 0.9)',
  },
  teal: {
    iconBg: '#DDF4E8',
    iconColor: '#063F3B',
    openBorder: 'rgba(6, 63, 59, 0.3)',
    openGlow: 'rgba(221, 244, 232, 0.85)',
  },
  purple: {
    iconBg: '#F0ECF8',
    iconColor: '#5C4D8A',
    openBorder: 'rgba(92, 77, 138, 0.28)',
    openGlow: 'rgba(240, 236, 248, 0.95)',
  },
  green: {
    iconBg: '#E4F3EA',
    iconColor: '#1A7A5C',
    openBorder: 'rgba(26, 122, 92, 0.32)',
    openGlow: 'rgba(228, 243, 234, 0.95)',
  },
  citizen: {
    iconBg: '#E8F2F8',
    iconColor: '#2D6A8F',
    openBorder: 'rgba(45, 106, 143, 0.28)',
    openGlow: 'rgba(232, 242, 248, 0.95)',
  },
};
