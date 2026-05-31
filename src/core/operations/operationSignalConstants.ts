import { CANONICAL_NEIGHBORHOOD_IDS } from '@/core/neighborhoodIdentity/neighborhoodIdentityConstants';

import type {
  OperationDailyFocus,
  OperationSignalDomain,
  OperationSignalStatus,
} from './operationSignalTypes';

export const KNOWN_DISTRICT_IDS = [...CANONICAL_NEIGHBORHOOD_IDS] as const;

export const DEFAULT_OPERATION_SIGNAL_SCORES = {
  personnel: 28,
  vehicles: 26,
  containers: 30,
  districts: 32,
  overall: 30,
} as const;

export const STATUS_THRESHOLDS = {
  stableMax: 34,
  watchMax: 59,
  strainedMax: 79,
} as const;

export const SIGNAL_STATUS_LABELS: Record<OperationSignalStatus, string> = {
  stable: 'Dengeli',
  watch: 'İzlemede',
  strained: 'Baskı artıyor',
  critical: 'Kritik eşik',
};

export const DOMAIN_LABELS: Record<OperationSignalDomain, string> = {
  personnel: 'Personel',
  vehicles: 'Araç',
  containers: 'Konteyner',
  districts: 'Mahalle',
  overall: 'Genel',
};

export const DAILY_FOCUS_LABELS: Record<OperationDailyFocus, string> = {
  balanced: 'Dengeli operasyon',
  personnel: 'Personel odağı',
  vehicles: 'Araç odağı',
  containers: 'Konteyner odağı',
  districts: 'Mahalle odağı',
};

export const SIGNAL_COPY = {
  hubTitle: 'Operasyon Sinyalleri',
  hubSubtitle: 'Bugünkü saha dengesi',
  hubSubtitleLong: 'Personel, araç, konteyner ve mahalle baskısı',
  hubFooter: 'Ece bu sinyalleri analiz eder.',
  reportTitle: 'Operasyon Dengesi',
  reportFooter: 'Yarınki plan bu sinyallerle şekillenir.',
  impactTitle: 'Operasyon etkisi',
  day1HubFooter: 'Temel akış izleniyor; detaylı sinyaller sonraki günlerde belirginleşir.',
  day1ReportLine:
    'Bugün temel operasyon akışı izlendi. Detaylı saha sinyalleri sonraki günlerde belirginleşir.',
  postPilotReportLine:
    'Pilot sonrası gündem sınırlı, ancak mahalle sinyalleri büyümeye başladı.',
} as const;

export const END_OF_DAY_SIGNAL_DELTAS = {
  resolvedContainer: -6,
  unresolvedContainerPressure: 8,
  resolvedHighSeverity: -4,
  unresolvedHighSeverity: 8,
  day1Multiplier: 0.5,
} as const;

export const OPERATION_SIGNAL_UI_FORBIDDEN = [
  'xp',
  'premium',
  'kilitli',
  'satın al',
  'paywall',
] as const;
