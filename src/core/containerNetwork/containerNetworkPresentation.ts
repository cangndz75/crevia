import { getDistrictIdentity } from '@/core/districts/districtIdentityPresentation';

import {
  CONTAINER_NETWORK_FORBIDDEN_COPY_TERMS,
  CONTAINER_NETWORK_HEALTH_LABELS,
  CONTAINER_NETWORK_IMPACT_DOMAIN_LABELS,
  CONTAINER_NETWORK_MAX_VISIBLE_CHIPS,
  CONTAINER_NETWORK_PRESSURE_LABELS,
  CONTAINER_NETWORK_STATUS_LABELS,
  CONTAINER_NETWORK_UPGRADE_KIND_LABELS,
} from './containerNetworkConstants';
import type {
  ContainerNetworkChipModel,
  ContainerNetworkContext,
  ContainerNetworkHealthLevel,
  ContainerNetworkPresentationModel,
  ContainerNetworkPressureLevel,
  ContainerNetworkTone,
  ContainerNetworkUpgradeCandidate,
  ContainerNetworkUpgradeKind,
  ContainerNetworkUpgradeStatus,
} from './containerNetworkTypes';

export type ContainerNetworkPresentationOptions = {
  compact?: boolean;
  surface?: 'map' | 'assignment' | 'field' | 'report' | 'hub' | 'district_operation' | 'dev';
  includeCtaHint?: boolean;
};

function districtLabel(districtId: string): string {
  return getDistrictIdentity(districtId).shortLabel;
}

function resolveTone(candidate: ContainerNetworkUpgradeCandidate): ContainerNetworkTone {
  if (candidate.status === 'recommended') return 'positive';
  if (candidate.pressureLevel === 'critical' || candidate.pressureLevel === 'high') return 'urgent';
  if (candidate.healthResult.healthLevel === 'fragile' || candidate.healthResult.healthLevel === 'strained') {
    return 'strained';
  }
  if (candidate.kind === 'recovery_cleanup_focus') return 'recovering';
  if (candidate.status === 'preview') return 'watch';
  return 'neutral';
}

export function buildContainerNetworkHealthLabel(level: ContainerNetworkHealthLevel): string {
  return CONTAINER_NETWORK_HEALTH_LABELS[level];
}

export function buildContainerNetworkPressureLabel(level: ContainerNetworkPressureLevel): string {
  return CONTAINER_NETWORK_PRESSURE_LABELS[level];
}

export function buildContainerNetworkStatusLabel(status: ContainerNetworkUpgradeStatus): string {
  return CONTAINER_NETWORK_STATUS_LABELS[status];
}

export function buildContainerNetworkUpgradeKindLabel(kind: ContainerNetworkUpgradeKind): string {
  return CONTAINER_NETWORK_UPGRADE_KIND_LABELS[kind];
}

export function buildContainerNetworkCompactLine(candidate: ContainerNetworkUpgradeCandidate): string {
  const label = districtLabel(candidate.districtId);
  const kindLabel = buildContainerNetworkUpgradeKindLabel(candidate.kind);
  const healthLabel = buildContainerNetworkHealthLabel(candidate.healthResult.healthLevel);
  const statusLabel = buildContainerNetworkStatusLabel(candidate.status);

  if (candidate.kind === 'recovery_cleanup_focus') {
    return `${label}'te konteyner ağı toparlanma fırsatı veriyor.`;
  }
  if (candidate.kind === 'industrial_heavy_use_point') {
    return `${label}'de ağır kullanım noktası kapasite baskısını azaltabilir.`;
  }
  if (candidate.kind === 'environmental_sensitivity_point') {
    return `${label}'de çevre hassasiyeti için konteyner düzeni öneriliyor.`;
  }
  if (candidate.kind === 'visible_clean_point') {
    return `${label}'de görünür temizlik noktası prestij ve düzeni güçlendirir.`;
  }
  if (candidate.kind === 'school_residential_order') {
    return `${label}'te konut ve okul çevresi konteyner düzeni öneriliyor.`;
  }
  if (candidate.kind === 'transit_flow_support') {
    return `${label}'de geçiş akışı destekli konteyner düzeni gündemde.`;
  }

  return `Konteyner ağı: ${healthLabel} · ${statusLabel === 'Öneriliyor' ? 'geliştirme öneriliyor' : kindLabel.toLocaleLowerCase('tr-TR')}`;
}

export function buildContainerNetworkSummaryLine(candidate: ContainerNetworkUpgradeCandidate): string {
  const label = districtLabel(candidate.districtId);
  const kindLabel = buildContainerNetworkUpgradeKindLabel(candidate.kind);
  const pressureLabel = buildContainerNetworkPressureLabel(candidate.pressureLevel);

  if (candidate.status === 'recommended') {
    return `${label} için ${kindLabel.toLocaleLowerCase('tr-TR')} geliştirmesi öneriliyor; baskı ${pressureLabel.toLocaleLowerCase('tr-TR')}.`;
  }
  return `${label} konteyner ağında ${kindLabel.toLocaleLowerCase('tr-TR')} fırsatı izleniyor.`;
}

export function buildContainerNetworkTradeoffLine(
  candidate: Pick<ContainerNetworkUpgradeCandidate, 'kind' | 'pressureLevel' | 'districtId'>,
): string {
  if (candidate.kind === 'visible_clean_point') {
    return 'Görünür temizlik noktası sosyal güveni güçlendirir, ekip odağı ister.';
  }
  if (candidate.kind === 'capacity_rebalance') {
    return 'Kapasite dengeleme araç rotasını rahatlatır ama kısa vadede plan ister.';
  }
  if (candidate.kind === 'recovery_cleanup_focus') {
    return 'Toparlanma temizliği baskıyı düşürür; bugün saha hızı kısmen geri planda kalır.';
  }
  if (candidate.kind === 'environmental_sensitivity_point') {
    return 'Çevre hassasiyeti noktası sakin görünüm sağlar, rota disiplini ister.';
  }
  return 'Bugün ağ düzenlemek saha hızını azaltır ama yarın baskıyı düşürür.';
}

export function buildContainerNetworkRecommendationLine(
  candidate: Pick<ContainerNetworkUpgradeCandidate, 'suggestedTeamSpecializationId'>,
): string | undefined {
  if (candidate.suggestedTeamSpecializationId === 'container_network_unit') {
    return 'Konteyner Ağı Ekibi çevre hassasiyeti olan bölgede öneriliyor.';
  }
  if (candidate.suggestedTeamSpecializationId === 'technical_team_preventive_maintenance') {
    return 'Teknik Ekip bu konteyner ağı geliştirmesi için uygun.';
  }
  return undefined;
}

export function buildContainerNetworkChips(
  candidate: ContainerNetworkUpgradeCandidate,
): ContainerNetworkChipModel[] {
  const chips: ContainerNetworkChipModel[] = [
    {
      id: 'health',
      label: buildContainerNetworkHealthLabel(candidate.healthResult.healthLevel),
      tone: resolveTone(candidate),
      iconKey: 'leaf-outline',
    },
    {
      id: 'pressure',
      label: buildContainerNetworkPressureLabel(candidate.pressureLevel),
      tone:
        candidate.pressureLevel === 'high' || candidate.pressureLevel === 'critical'
          ? 'urgent'
          : 'watch',
      iconKey: 'speedometer-outline',
    },
    {
      id: 'kind',
      label: buildContainerNetworkUpgradeKindLabel(candidate.kind),
      tone: candidate.status === 'recommended' ? 'positive' : 'neutral',
      iconKey: 'construct-outline',
    },
  ];

  return chips.slice(0, CONTAINER_NETWORK_MAX_VISIBLE_CHIPS);
}

export function buildContainerNetworkEmptyState(
  surface: ContainerNetworkPresentationOptions['surface'] = 'map',
): string {
  switch (surface) {
    case 'report':
      return 'Bugün belirgin konteyner ağı geliştirme penceresi oluşmadı.';
    case 'hub':
      return 'Konteyner ağı geliştirmeleri operasyon gündemi netleşince görünür olur.';
    case 'assignment':
    case 'field':
      return 'Saha planı netleşince konteyner ağı önerileri burada görünür.';
    case 'district_operation':
      return 'Mahalle operasyonu ile konteyner ağı geliştirmesi eşleşince öneri çıkar.';
    case 'dev':
      return 'Container network foundation — henüz yüzeye bağlanmadı.';
    case 'map':
    default:
      return 'Konteyner ağı geliştirmeleri, mahalle güveni ve kaynak baskısı netleşince görünür.';
  }
}

export function buildContainerNetworkUnlockLine(context: ContainerNetworkContext): string {
  const hasUpgradePermission = (context.unlockedPermissionIds ?? []).includes(
    'container_network_upgrade_preview',
  );
  const hasTrust = !!context.districtTrustResult;

  if (hasUpgradePermission && hasTrust) {
    return 'Operasyon Sorumlusu yetkisiyle konteyner ağı geliştirmeleri gündeme gelir.';
  }
  if (hasTrust) {
    return 'Mahalle güveni görünür oldukça konteyner ağı önerileri netleşir.';
  }
  if (hasUpgradePermission) {
    return 'Yetkiyle açılan konteyner ağı geliştirmeleri kaynak baskısı netleşince önerilir.';
  }
  return 'Konteyner ağı geliştirmeleri gündeme gelir; mahalle ve kaynak sinyalleri netleştikçe öneriler güçlenir.';
}

export function buildContainerNetworkPresentationModel(
  candidate: ContainerNetworkUpgradeCandidate,
  options: ContainerNetworkPresentationOptions = {},
): ContainerNetworkPresentationModel {
  const district = districtLabel(candidate.districtId);
  const tone = resolveTone(candidate);
  const compactLine = buildContainerNetworkCompactLine(candidate);
  const summaryLine = candidate.summaryLine || buildContainerNetworkSummaryLine(candidate);
  const tradeoffLine = candidate.tradeoffLine ?? buildContainerNetworkTradeoffLine(candidate);
  const recommendationLine =
    candidate.recommendationLine ?? buildContainerNetworkRecommendationLine(candidate);

  let ctaHint: string | undefined;
  if (options.includeCtaHint) {
    if (candidate.status === 'recommended') {
      ctaHint = 'Mahalle detayında geliştirme önerisini inceleyin.';
    } else if (candidate.status === 'preview') {
      ctaHint = 'Konteyner ağı geliştirmesi sırada; sinyaller netleşince açılır.';
    }
  }

  return {
    id: candidate.id,
    title: candidate.title,
    subtitle: buildContainerNetworkUpgradeKindLabel(candidate.kind),
    districtLabel: district,
    statusLabel: buildContainerNetworkStatusLabel(candidate.status),
    healthLabel: buildContainerNetworkHealthLabel(candidate.healthResult.healthLevel),
    pressureLabel: buildContainerNetworkPressureLabel(candidate.pressureLevel),
    tone,
    compactLine: options.compact ? compactLine : summaryLine,
    summaryLine,
    tradeoffLine,
    recommendationLine,
    memoryLine: candidate.healthResult.memoryLine,
    chips: buildContainerNetworkChips(candidate),
    ctaHint,
    emptyStateLine: candidate.isVisibleToPlayer
      ? undefined
      : buildContainerNetworkEmptyState(options.surface),
  };
}

export function containerNetworkCopyContainsForbiddenTerms(copy: string): boolean {
  const normalized = copy.toLocaleLowerCase('tr-TR');
  return CONTAINER_NETWORK_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term));
}

export function collectContainerNetworkPlayerFacingCopy(
  candidate: ContainerNetworkUpgradeCandidate,
  context: ContainerNetworkContext = {},
): string[] {
  const presentation = buildContainerNetworkPresentationModel(candidate, {
    compact: true,
    surface: 'map',
    includeCtaHint: true,
  });
  return [
    presentation.compactLine,
    presentation.summaryLine,
    presentation.tradeoffLine ?? '',
    presentation.recommendationLine ?? '',
    presentation.memoryLine ?? '',
    presentation.emptyStateLine ?? '',
    buildContainerNetworkUnlockLine(context),
    ...presentation.chips.map((chip) => chip.label),
    candidate.summaryLine,
    candidate.tradeoffLine ?? '',
    candidate.recommendationLine ?? '',
    candidate.unlockLine ?? '',
    ...candidate.healthResult.reasonLines,
    ...candidate.impactDomains.map((domain) => CONTAINER_NETWORK_IMPACT_DOMAIN_LABELS[domain]),
  ].filter(Boolean);
}
