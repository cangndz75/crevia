import type { ImageSourcePropType } from 'react-native';

export type OlaylarFilterKey = 'all' | 'critical' | 'urgent' | 'active' | 'resolved';

export type OlaylarEventStats = {
  critical: number;
  urgent: number;
  active: number;
  resolved: number;
};

export type OlaylarPriorityEventView = {
  id: string;
  title: string;
  district: string;
  description: string;
  timeLeft: string;
  affected: string;
  riskLabel: string;
  riskDelta: string;
  xpDelta: string;
  image?: ImageSourcePropType;
};

export type OlaylarResolvedEventView = {
  id: string;
  title: string;
  location: string;
  resolvedAgo: string;
  riskLabel: string;
  image?: ImageSourcePropType;
};

export type OlaylarHeaderView = {
  level: number;
  xp: number;
  xpTarget: number;
  resourceLabel: string;
};
