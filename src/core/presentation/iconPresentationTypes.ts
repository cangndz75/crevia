export type CreviaIconDomain =
  | 'authority'
  | 'badge'
  | 'district'
  | 'social'
  | 'operation'
  | 'vehicle'
  | 'container'
  | 'personnel'
  | 'crisis'
  | 'route'
  | 'resource'
  | 'leaderboard'
  | 'report'
  | 'postPilot'
  | 'map';

export type IconTone =
  | 'teal'
  | 'mint'
  | 'amber'
  | 'green'
  | 'blue'
  | 'coral'
  | 'gold'
  | 'neutral';

export type CreviaIconDefinition = {
  key: string;
  domain: CreviaIconDomain;
  /** Semantik ikon adı — Ionicons eşlemesi presentation katmanında. */
  iconName: string;
  tone: IconTone;
  label: string;
  description?: string;
};

export type IconToneStyle = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};
