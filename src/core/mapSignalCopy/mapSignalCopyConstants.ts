import type { MapSignalCopyLineKind } from './mapSignalCopyTypes';

export const MAP_SIGNAL_COPY_MIN_TEMPLATE_LENGTH = 32;
export const MAP_SIGNAL_COPY_MAX_TEMPLATE_LENGTH = 110;
export const MAP_SIGNAL_COPY_MIN_PRIORITY = 0;
export const MAP_SIGNAL_COPY_MAX_PRIORITY = 100;
export const MAP_SIGNAL_COPY_ACCESSIBILITY_MAX_LENGTH = 140;

export const MAP_SIGNAL_COPY_IDEAL_LENGTH_BY_KIND: Record<MapSignalCopyLineKind, { min: number; max: number }> = {
  map_line: { min: 42, max: 76 },
  decision_line: { min: 45, max: 90 },
  district_line: { min: 40, max: 85 },
  pressure_line: { min: 40, max: 85 },
  route_line: { min: 40, max: 80 },
  next_action_line: { min: 32, max: 70 },
  locked_teaser: { min: 32, max: 80 },
  accessibility_label: { min: 40, max: 140 },
};

export const MAP_SIGNAL_COPY_PROHIBITED_TERMS = [
  'fakir',
  'zengin',
  'suclu',
  'suçlu',
  'tehlikeli',
  'azınlık',
  'azinlik',
  'dinsel',
  'etnik',
  'ırk',
  'irk',
];

export const MAP_SIGNAL_COPY_PANIC_TERMS = [
  'kriz',
  'acil',
  'patlama',
  'cokus',
  'çöküş',
  'felaket',
];

export const MAP_SIGNAL_COPY_TECHNICAL_ENUM_PATTERNS = [
  /\bactive_operation\b/i,
  /\bbefore_inspect\b/i,
  /\bdispatch_ready\b/i,
  /\bfield_active\b/i,
  /\bmap_line\b/i,
  /\brequires_\w+\b/i,
  /\bday_8_plus\b/i,
  /\bsocial_sensitivity\b/i,
  /\btrust_fragility\b/i,
];

export const ACTIVE_OPERATION_PHASE_LABELS: Record<string, string> = {
  before_inspect: 'İnceleme öncesi',
  inspecting: 'İnceleniyor',
  planning: 'Plan hazırlanıyor',
  dispatch_ready: 'Sevke hazır',
  dispatching: 'Sevkte',
  field_active: 'Sahada aktif',
  field_paused: 'Saha izleme',
  completed: 'Tamamlandı',
  result_trace_available: 'Sonuç izi var',
  unknown: 'Operasyon yok',
};
