import type { ImageSourcePropType } from 'react-native';

export type OlaylarFilterKey = 'all' | 'critical' | 'urgent' | 'active' | 'resolved';

export type OlaylarEventStats = {
  critical: number;
  urgent: number;
  active: number;
  resolved: number;
};

export type OlaylarEventStatItem = {
  key: keyof OlaylarEventStats;
  label: string;
  count: number;
  percent: number;
  color: string;
  bgColor: string;
  icon: string;
};

export type OlaylarOperationStatusView = {
  statusLabel: string;
  teamsLabel: string;
  vehiclesLabel: string;
  speedLabel: string;
  tone: 'active' | 'critical' | 'ready';
};

export type OlaylarTimelineTone = 'critical' | 'urgent' | 'active' | 'resolved';

export type OlaylarTimelineItem = {
  id: string;
  time: string;
  label: string;
  tone: OlaylarTimelineTone;
};

export type OlaylarLiveMapPin = {
  id: string;
  tone: OlaylarTimelineTone;
  left: `${number}%`;
  top: `${number}%`;
  pulse?: boolean;
};

export type OlaylarLiveIncidentMapView = {
  title: string;
  layerButtonLabel: string;
  liveLabel: string;
  pins: OlaylarLiveMapPin[];
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

export type OlaylarActiveEventView = {
  id: string;
  title: string;
  location: string;
  timeLeft: string;
  progress: number;
  statusLabel: string;
  tone: OlaylarTimelineTone;
};

export type OlaylarResolvedEventView = {
  id: string;
  title: string;
  location: string;
  resolvedAgo: string;
  riskLabel: string;
  rewardLabel?: string;
  image?: ImageSourcePropType;
};

export type OlaylarFieldStatusView = {
  orderPercent: number;
  affectedDistricts: number;
  activeTasks: number;
  teamsOnDutyLabel: string;
  ctaLabel: string;
};

export type OlaylarHeaderView = {
  level: number;
  xp: number;
  xpTarget: number;
  resourceLabel: string;
};

export type OlaylarScreenPresentation = {
  operationStatus: OlaylarOperationStatusView;
  eventStats: OlaylarEventStatItem[];
  liveIncidentMap: OlaylarLiveIncidentMapView;
  incidentTimeline: OlaylarTimelineItem[];
  fieldStatus: OlaylarFieldStatusView;
};
