import type { ImageSource } from 'expo-image';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { OperationPreviewAuthoritySummary } from '@/core/authority/authorityPresentation';
import type { ProgressionBridgeSummary } from '@/core/progression';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { OperationPreviewChipView } from '@/features/pilot/hooks/useOperationPreviewState';
import type { RoadmapStep, SystemCardItem } from '@/features/pilot/components/operation-preview/operationPreviewData';
import {
  getMainOperationScopeRowThumb,
  getMainOperationStatusImage,
  getMainOperationSystemImage,
  mainOperationPreviewAssets,
} from '@/features/pilot/utils/mainOperationPreviewAssets';

export type MainOperationPreviewUiInput = {
  chips: OperationPreviewChipView[];
  authoritySummary: OperationPreviewAuthoritySummary;
  progressionBridgeSummary: ProgressionBridgeSummary;
  systemCards: SystemCardItem[];
  roadmapSteps: RoadmapStep[];
};

export type MainOpPreviewStatusCard = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  active: boolean;
  imageSource: ImageSource;
};

export type MainOpPreviewScopeRow = {
  id: string;
  title: string;
  progressPercent: number;
  pillLabel: string;
  thumbSource?: ImageSource;
};

export type MainOpPreviewSystemCard = SystemCardItem & {
  imageSource: ImageSource;
  showLock: boolean;
};

export type MainOperationPreviewUiModel = {
  headerSubtitle: string;
  statusCards: MainOpPreviewStatusCard[];
  authoritySummary: OperationPreviewAuthoritySummary;
  authorityDecorImage: ImageSource;
  scopeRows: MainOpPreviewScopeRow[];
  scopeDecorImage: ImageSource;
  heroCityImage: ImageSource;
  heroBadgeImage: ImageSource;
  systemCards: MainOpPreviewSystemCard[];
  roadmapSteps: RoadmapStep[];
};

const STATUS_CARD_STYLES: Record<
  string,
  Pick<MainOpPreviewStatusCard, 'iconBg' | 'iconColor' | 'borderColor'>
> = {
  'pilot-done': {
    iconBg: '#E4F6EC',
    iconColor: '#239B68',
    borderColor: '#D6EEDD',
  },
  'report-ready': {
    iconBg: '#EAF2FF',
    iconColor: '#3B73D9',
    borderColor: '#D9E5FA',
  },
  'authority-tracking': {
    iconBg: '#FFF3D6',
    iconColor: '#B88A16',
    borderColor: '#EAD7A3',
  },
};

const STATUS_COPY: Record<string, { title: string; description: string }> = {
  'pilot-done': {
    title: 'Pilot Tamamlandı',
    description: 'Pilot bölge başarıyla tamamlandı.',
  },
  'report-ready': {
    title: '7 Günlük Rapor Hazır',
    description: 'Günlük operasyon raporu hazır.',
  },
  'authority-tracking': {
    title: 'Yetki İzleniyor',
    description: 'Üst yönetim değerlendirmesi bekleniyor.',
  },
};

const SCOPE_FALLBACK_PROGRESS: Record<string, number> = {
  neighborhood_istasyon: 52,
  neighborhood_yesilvadi: 18,
  operation_scope_main: 6,
  system_crisis_desk: 4,
};

const SYSTEM_ID_TO_ASSET_KEY: Record<string, string> = {
  'city-map': 'cityMap',
  neighborhoods: 'neighborhoods',
  butterfly: 'butterfly',
  vehicles: 'vehicles',
};

export function buildMainOperationPreviewUiModel(
  preview: MainOperationPreviewUiInput,
  districtId: PilotDistrictId | null | undefined,
): MainOperationPreviewUiModel {
  const heroCityImage = getPilotDistrictHeroImage(districtId);

  const statusCards: MainOpPreviewStatusCard[] = preview.chips
    .filter((chip) => chip.id in STATUS_COPY)
    .map((chip) => {
      const copy = STATUS_COPY[chip.id]!;
      const palette = STATUS_CARD_STYLES[chip.id]!;
      return {
        id: chip.id,
        title: copy.title,
        description: copy.description,
        icon: chip.icon,
        imageSource: getMainOperationStatusImage(chip.id),
        ...palette,
        active: chip.active,
      };
    });

  const scopeRows: MainOpPreviewScopeRow[] =
    preview.progressionBridgeSummary.previewItems.length > 0
      ? preview.progressionBridgeSummary.previewItems.map((item) => ({
          id: item.id,
          title: item.title,
          progressPercent:
            item.progressPercent > 0
              ? item.progressPercent
              : (SCOPE_FALLBACK_PROGRESS[item.id] ?? 8),
          pillLabel: 'Önizleme',
          thumbSource: getMainOperationScopeRowThumb(item.id),
        }))
      : Object.entries(SCOPE_FALLBACK_PROGRESS).map(([id, progressPercent]) => ({
          id,
          title:
            id === 'neighborhood_istasyon'
              ? 'İstasyon Mahallesi Önizlemesi'
              : id === 'neighborhood_yesilvadi'
                ? 'Yeşilvadi Operasyon Önizlemesi'
                : id === 'operation_scope_main'
                  ? 'Ana Operasyon Kapsamı'
                  : 'Kriz Masası Önizlemesi',
          progressPercent,
          pillLabel: 'Önizleme',
          thumbSource: getMainOperationScopeRowThumb(id),
        }));

  const systemCards: MainOpPreviewSystemCard[] = preview.systemCards
    .slice(0, 4)
    .map((card) => {
      const assetKey = SYSTEM_ID_TO_ASSET_KEY[card.id] ?? 'cityMap';
      return {
        ...card,
        imageSource: getMainOperationSystemImage(assetKey),
        showLock: card.locked,
      };
    });

  return {
    headerSubtitle: 'Pilot bölge tamamlandı, Şehir ölçeği yakında açılıyor.',
    statusCards,
    authoritySummary: preview.authoritySummary,
    authorityDecorImage: mainOperationPreviewAssets.authorityDecor,
    scopeRows,
    scopeDecorImage: mainOperationPreviewAssets.scopeDecor,
    heroCityImage,
    heroBadgeImage: mainOperationPreviewAssets.heroBadge,
    systemCards,
    roadmapSteps: preview.roadmapSteps,
  };
}

export type { OperationPreviewChipView };
