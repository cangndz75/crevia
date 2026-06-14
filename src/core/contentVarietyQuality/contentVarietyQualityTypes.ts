export type ContentVarietySurface =
  | 'hub'
  | 'report'
  | 'ece'
  | 'operation_feed'
  | 'portfolio'
  | 'map'
  | 'city_rhythm'
  | 'dominant_strategy'
  | 'follow_up_execution'
  | 'resource_pressure'
  | 'fallback';

export type SelectDeterministicCopyVariantInput = {
  kind: string;
  surface: ContentVarietySurface;
  day?: number;
  districtId?: string;
  sourceIds?: readonly string[];
  duplicateKey?: string;
  previousLineHashes?: readonly string[];
  variants: readonly string[];
};

export type CopyQualityIssue = {
  line: string;
  reason: string;
  severity: 'warn' | 'fail';
  module?: string;
  kind?: string;
  surface?: ContentVarietySurface;
};

export type CopyPoolSnapshot = {
  module: string;
  kind: string;
  surface: ContentVarietySurface;
  lines: string[];
};
