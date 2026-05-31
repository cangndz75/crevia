import type { PilotDistrictId } from '@/core/models/DistrictProfile';

import type { MapDistrictId } from '../data/mapAssets';

export type PilotAreaId = 'merkez' | 'cumhuriyet' | 'sanayiPazar';

export type MapViewMode = 'overview' | 'detail';

export type RiskLevelLabel = 'Düşük' | 'Orta' | 'Yüksek';

export type MapFilterId = 'events' | 'risk' | 'crews' | 'vehicles' | 'containers';

export type MapFilter = {
  id: MapFilterId;
  label: string;
  icon: string;
  activeColor: string;
};

export type LayerId =
  | 'risk'
  | 'routes'
  | 'complaints'
  | 'greenAreas'
  | 'lighting'
  | 'waste';

export type LayerConfig = {
  id: LayerId;
  label: string;
  subtitle: string;
  defaultOn: boolean;
};

export type ActiveLayers = Record<LayerId, boolean>;

export type PinSeverity = 'low' | 'medium' | 'high' | 'critical';

export type MapPinType =
  | 'event'
  | 'risk'
  | 'crew'
  | 'vehicle'
  | 'container'
  | 'social'
  | 'opportunity';

export type MapPin = {
  id: string;
  type: MapPinType;
  label: string;
  x: number;
  y: number;
  color: string;
  icon: string;
  severity?: PinSeverity;
  value?: string;
  /** Pilot bölge (store) — geriye uyumluluk */
  regionId?: PilotDistrictId;
  /** Şehir haritası mahalle kimliği */
  mapDistrictId?: MapDistrictId;
  /** Kriz etkilenen mahalle — seçili teal glow’u ezmez */
  crisisHighlight?: boolean;
};

export type MapRegion = {
  id: PilotDistrictId;
  displayName: string;
  population: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MapFocusTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

export type CrewStatus = 'active' | 'enroute' | 'idle';

export type Crew = {
  id: string;
  name: string;
  status: CrewStatus;
  efficiency: number;
  task: string;
  location: string;
  avatar: string;
};

export type VehicleStatus = 'ready' | 'on_duty' | 'maintenance' | 'broken';

export type Vehicle = {
  id: string;
  name: string;
  type: string;
  status: VehicleStatus;
  capacity: number;
  location: string;
};

export type ContainerStatus = 'empty' | 'normal' | 'full' | 'critical';

export type Container = {
  id: string;
  address: string;
  district: string;
  fillPercentage: number;
  status: ContainerStatus;
};

export type RiskSummary = {
  highRiskPoints: number;
  activeThreatCount: number;
  earlyWarningCount: number;
  featuredRisk: {
    title: string;
    description: string;
    probability: number;
  };
};

export type ActiveOperation = {
  id: string;
  name: string;
  district: string;
  startTime: string;
  crewCount: number;
  vehicleCount: number;
  recommendedAction?: string;
};

export type TaskItem = {
  id: string;
  name: string;
  location: string;
  crew: string;
  progress: number;
  canReassign: boolean;
};

export type ContainerSummary = {
  averageFill: number;
  empty: number;
  normal: number;
  full: number;
  critical: number;
  delayedCollection: number;
};

export type PilotDayTheme =
  | 'Öğrenme'
  | 'Şikayet Baskısı'
  | 'Kaynak Baskısı'
  | 'Sosyal Baskı'
  | 'Fırsat'
  | 'Kelebek Etkisi'
  | 'Final';

export type PilotDayEvent = {
  day: number;
  theme: PilotDayTheme;
  mainEventTitle: string;
  mainEventDescription: string;
  activeOperationTitle: string;
  warningText?: string;
  pinMultiplier: number;
  prominentFilter: MapFilterId;
};

export type PilotAreaPreset = {
  id: PilotAreaId;
  districtId: PilotDistrictId;
  name: string;
  shortName: string;
  description: string;
  character: string;
  population: number;
  socialRisk: RiskLevelLabel;
  staffTempo: RiskLevelLabel;
  operationDifficulty: RiskLevelLabel;
  themeColor: string;
  mapFocusLabel: string;
  activeEventCount: number;
  riskDensity: number;
  activeCrewCount: number;
  activeVehicleCount: number;
  containerCriticalCount: number;
  defaultOperation: string;
  recommendedAction: string;
  filterDescriptions: Record<MapFilterId, string>;
  mapFocus: MapFocusTransform;
  dayEvents: Record<number, PilotDayEvent>;
  pinsByFilter: Record<MapFilterId, MapPin[]>;
  crews: Crew[];
  tasks: TaskItem[];
  vehicles: Vehicle[];
  containers: Container[];
  containerSummary: ContainerSummary;
  riskSummary: RiskSummary;
  routeInfo: {
    title: string;
    distance: string;
    eta: string;
    progress: number;
    avgEta: string;
    completion: string;
  };
};

export type LockedRegionMessage = {
  title: string;
  body: string;
};

export const LOCKED_REGION_MESSAGE: LockedRegionMessage = {
  title: 'Ana operasyonda açılacak',
  body: 'Pilot sürecinde sadece seçili pilot bölgeden sorumlusun.',
};
