import type {
  OperationBenchmarkWindow,
  OperationCareerPhase,
  ProgressionUnlockAxis,
} from './openEndedProgressionTypes';

export const PILOT_TRAINING_DAYS = 7;
export const EARLY_OPERATION_BENCHMARK_DAYS = 14;
export const LONG_RUN_BENCHMARK_DAYS = [30, 60, 100] as const;
export const OPEN_ENDED_OPERATION_IS_TERMINAL = false;

export const OPEN_ENDED_PROGRESSION_UNLOCK_AXES: readonly ProgressionUnlockAxis[] = [
  'xp',
  'authority',
  'rank',
  'resource_stability',
  'district_trust',
  'crisis_control',
  'operation_era',
] as const;

export const OPEN_ENDED_OPERATION_PHASES: readonly OperationCareerPhase[] = [
  'pilot_training',
  'light_main_operation',
  'district_responsibility',
  'crisis_recovery_management',
  'citywide_operations',
  'long_term_career',
] as const;

export const PERIODIC_REVIEW_COPY_TERMS = [
  'Açık Uçlu Ana Operasyon',
  'Operasyon Kariyeri',
  'Dönemsel Operasyon Değerlendirmesi',
  'Operasyon Dönemi Özeti',
  'Performans Değerlendirmesi',
  'Ünvan İlerlemesi',
  'Yetki Açılımı',
  'Authority Progression',
  'Milestone Hedefleri',
  'Operation Era',
  'Operasyona Devam Et',
  'Sonraki Güne Hazırlan',
] as const;

export const FORBIDDEN_PLAYER_FACING_SEASON_END_TERMS = [
  '14 günlük sezon',
  'sezon finali',
  'sezon sonu',
  'ana operasyon tamamlandı',
  'Day 14 final',
  'season completed',
  'final season',
  'yeni sezona başla',
  'sezon bitti',
  'oyun bitti',
] as const;

export const TECHNICAL_ALLOWED_BENCHMARK_TERMS = [
  'early operation benchmark window',
  'benchmark',
  'technical',
  'legacy',
  'season_end',
  'seasonEnd',
] as const;

export const OPERATION_BENCHMARK_WINDOWS: readonly OperationBenchmarkWindow[] = [
  {
    id: 'pilot_training',
    label: 'Pilot Eğitim',
    days: PILOT_TRAINING_DAYS,
    isPlayerFacingFinal: false,
    purpose: 'Pilot eğitim akışının tamamlandığını doğrulamak.',
  },
  {
    id: 'early_operation_benchmark',
    label: 'Early operation benchmark window',
    days: EARLY_OPERATION_BENCHMARK_DAYS,
    isPlayerFacingFinal: false,
    purpose: 'Teknik balance ve regresyon testi için erken ana operasyon penceresi.',
  },
] as const;
