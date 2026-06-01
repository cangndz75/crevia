import type { MapPresenceMarkerStatus } from '@/core/mapPresence/mapPresenceTypes';

import type {
  ResourceFatigueVisualInput,
  ResourceFatigueVisualModel,
  ResourceFatigueVisualSummary,
  ResourceVisualDomain,
  ResourceVisualState,
  ResourceVisualSurface,
  ResourceVisualTone,
} from './resourceFatigueVisualTypes';

export const TITLE_LIMIT = 28;
export const SHORT_LABEL_LIMIT = 18;
export const SUMMARY_LIMIT = 130;

type StateCopy = {
  title: string;
  shortLabel: string;
  summary: string;
  iconKey: string;
  tone: ResourceVisualTone;
  priority: number;
};

const VEHICLE_COPY: Partial<Record<ResourceVisualState, StateCopy>> = {
  ready: {
    title: 'Araç Hazır',
    shortLabel: 'Hazır',
    summary: 'Araç hattı bugün dengeli görünüyor.',
    iconKey: 'car-outline',
    tone: 'teal',
    priority: 3,
  },
  busy: {
    title: 'Araç Görevde',
    shortLabel: 'Görevde',
    summary: 'Araç bugün aktif hatta; tempo izlenmeli.',
    iconKey: 'car-outline',
    tone: 'mint',
    priority: 5,
  },
  tired: {
    title: 'Araç Yorgun',
    shortLabel: 'Yorgun',
    summary: 'Aynı hattın tekrar yüklenmesi yarın gecikme riski yaratabilir.',
    iconKey: 'car-outline',
    tone: 'amber',
    priority: 7,
  },
  maintenance_risk: {
    title: 'Bakım Riski',
    shortLabel: 'Bakım',
    summary: 'Araç yükü yükseldi; sonraki rotada daha dengeli seçim güvenli olur.',
    iconKey: 'build-outline',
    tone: 'amber',
    priority: 8,
  },
  critical: {
    title: 'Araç Baskısı',
    shortLabel: 'Baskı',
    summary: 'Araç yükü kritik seviyede; rota dengesi bugün önemli.',
    iconKey: 'warning-outline',
    tone: 'coral',
    priority: 9,
  },
  stable: {
    title: 'Araç Dengeli',
    shortLabel: 'Dengeli',
    summary: 'Araç hattı bugün yönetilebilir tempo ile ilerliyor.',
    iconKey: 'car-outline',
    tone: 'mint',
    priority: 4,
  },
};

const PERSONNEL_COPY: Partial<Record<ResourceVisualState, StateCopy>> = {
  stable: {
    title: 'Ekip Dengeli',
    shortLabel: 'Dengeli',
    summary: 'Saha ekibinin temposu bugün yönetilebilir seviyede.',
    iconKey: 'people-outline',
    tone: 'mint',
    priority: 4,
  },
  ready: {
    title: 'Ekip Hazır',
    shortLabel: 'Hazır',
    summary: 'Ekip rotasyonu bugün dengeli görünüyor.',
    iconKey: 'people-outline',
    tone: 'teal',
    priority: 3,
  },
  busy: {
    title: 'Ekip Görevde',
    shortLabel: 'Görevde',
    summary: 'Ekip aktif görevde; tempo izlenmeli.',
    iconKey: 'people-outline',
    tone: 'mint',
    priority: 5,
  },
  strained: {
    title: 'Ekip Yoğun',
    shortLabel: 'Yoğun',
    summary: 'Üst üste görevler ekip temposunu artırdı; rotasyon yarını koruyabilir.',
    iconKey: 'people-outline',
    tone: 'amber',
    priority: 7,
  },
  tired: {
    title: 'Ekip Yorgun',
    shortLabel: 'Yorgun',
    summary: 'Ekip temposu yükseldi; yarın daha dengeli atama faydalı olur.',
    iconKey: 'people-outline',
    tone: 'amber',
    priority: 8,
  },
  critical: {
    title: 'Ekip Riski',
    shortLabel: 'Dikkat',
    summary: 'Moral ve dikkat sinyali zayıfladı; tempo bugün kritik.',
    iconKey: 'pulse-outline',
    tone: 'coral',
    priority: 9,
  },
};

const CONTAINER_COPY: Partial<Record<ResourceVisualState, StateCopy>> = {
  stable: {
    title: 'Konteyner Dengeli',
    shortLabel: 'Dengeli',
    summary: 'Konteyner hattı bugün sakin seyrediyor.',
    iconKey: 'trash-outline',
    tone: 'teal',
    priority: 3,
  },
  watch: {
    title: 'Konteyner İzleniyor',
    shortLabel: 'İzleniyor',
    summary: 'Konteyner çevresi baskı üretiyor; kararın yarına etkisi olabilir.',
    iconKey: 'trash-outline',
    tone: 'mint',
    priority: 5,
  },
  strained: {
    title: 'Konteyner Baskısı',
    shortLabel: 'Baskı',
    summary: 'Doluluk baskısı artıyor; aynı hatta hızlı müdahale iz bırakabilir.',
    iconKey: 'trash-outline',
    tone: 'amber',
    priority: 7,
  },
  critical: {
    title: 'Konteyner Kritik',
    shortLabel: 'Kritik',
    summary: 'Konteyner baskısı yüksek; mahalle dengesi bugün önemli.',
    iconKey: 'warning-outline',
    tone: 'coral',
    priority: 9,
  },
  recovering: {
    title: 'Konteyner Toparlanıyor',
    shortLabel: 'Toparlanıyor',
    summary: 'Müdahale sonrası baskı azalıyor; yarın izlenmeli.',
    iconKey: 'refresh-outline',
    tone: 'mint',
    priority: 6,
  },
  resolved: {
    title: 'Konteyner Toparlandı',
    shortLabel: 'Toparlandı',
    summary: 'Müdahale sonrası görünür baskı azaldı.',
    iconKey: 'checkmark-circle-outline',
    tone: 'teal',
    priority: 4,
  },
};

const ROUTE_COPY: Partial<Record<ResourceVisualState, StateCopy>> = {
  stable: {
    title: 'Rota Dengeli',
    shortLabel: 'Dengeli',
    summary: 'Rota planı bugün dengeli görünüyor.',
    iconKey: 'navigate-outline',
    tone: 'teal',
    priority: 3,
  },
  busy: {
    title: 'Rota Yoğun',
    shortLabel: 'Yoğun',
    summary: 'Aktif hat yoğun; gecikme riski izlenmeli.',
    iconKey: 'navigate-outline',
    tone: 'mint',
    priority: 5,
  },
  strained: {
    title: 'Rota Baskısı',
    shortLabel: 'Baskı',
    summary: 'Gecikme riski artıyor; aynı hattı tekrar yüklemek yarına iz bırakabilir.',
    iconKey: 'navigate-outline',
    tone: 'amber',
    priority: 7,
  },
  tired: {
    title: 'Rota Yorgun',
    shortLabel: 'Yorgun hat',
    summary: 'Aynı rota hattı tekrar yüklendi; yarın tempo düşebilir.',
    iconKey: 'navigate-outline',
    tone: 'amber',
    priority: 8,
  },
  maintenance_risk: {
    title: 'Rota Bakım Riski',
    shortLabel: 'Bakım riski',
    summary: 'Araç yükü rota gecikmesine bağlanıyor; dengeli seçim önemli.',
    iconKey: 'build-outline',
    tone: 'amber',
    priority: 8,
  },
};

const MIXED_COPY: Partial<Record<ResourceVisualState, StateCopy>> = {
  watch: {
    title: 'Risk Sinyali',
    shortLabel: 'İzleniyor',
    summary: 'Birleşen kaynak sinyalleri erken müdahale gerektirebilir.',
    iconKey: 'pulse-outline',
    tone: 'amber',
    priority: 6,
  },
  strained: {
    title: 'Kaynak Baskısı',
    shortLabel: 'Baskı',
    summary: 'Birden fazla kaynak hattı aynı günde baskı üretiyor.',
    iconKey: 'pulse-outline',
    tone: 'amber',
    priority: 7,
  },
};

function clamp(text: string, limit: number): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  return `${t.slice(0, limit - 1).trimEnd()}…`;
}

function copyFor(
  domain: ResourceVisualDomain,
  state: ResourceVisualState,
): StateCopy {
  const table =
    domain === 'vehicle'
      ? VEHICLE_COPY
      : domain === 'personnel'
        ? PERSONNEL_COPY
        : domain === 'container'
          ? CONTAINER_COPY
          : domain === 'route'
            ? ROUTE_COPY
            : MIXED_COPY;
  return (
    table[state] ?? {
      title: 'Kaynak Durumu',
      shortLabel: 'Durum',
      summary: 'Saha kaynakları izleniyor.',
      iconKey: 'pulse-outline',
      tone: 'neutral',
      priority: 1,
    }
  );
}

function modelFrom(
  domain: ResourceVisualDomain,
  state: ResourceVisualState,
  debugReason: string,
  visible = true,
): ResourceFatigueVisualModel {
  const copy = copyFor(domain, state);
  return {
    id: `fatigue-${domain}-${state}`,
    domain,
    state,
    tone: copy.tone,
    title: clamp(copy.title, TITLE_LIMIT),
    shortLabel: clamp(copy.shortLabel, SHORT_LABEL_LIMIT),
    summary: clamp(copy.summary, SUMMARY_LIMIT),
    iconKey: copy.iconKey,
    priority: copy.priority,
    visible,
    maxLines: 2,
    debugReason,
  };
}

export function inferResourceVisualTone(state: ResourceVisualState): ResourceVisualTone {
  return copyFor('vehicle', state).tone;
}

function inferVehicleState(input: ResourceFatigueVisualInput): ResourceVisualState {
  const truck = input.operationalResources?.vehicleGroups?.standard_truck;
  const signal = input.operationSignals?.vehicles?.status?.toLowerCase();
  if (input.activeEvent?.resolved && input.eventDomainFocus?.focus === 'vehicle_route') {
    return 'stable';
  }
  if (!truck && !signal) return 'unknown';
  if ((truck?.maintenanceRisk ?? 0) >= 70) return 'maintenance_risk';
  if (truck?.status === 'critical' || signal === 'critical') return 'critical';
  if (truck?.status === 'strained' || (truck?.routePressure ?? 0) >= 70) return 'tired';
  if (truck?.status === 'busy' || signal === 'busy') return 'busy';
  if (truck?.status === 'stable' || signal === 'stable') return 'stable';
  return 'ready';
}

function inferPersonnelState(input: ResourceFatigueVisualInput): ResourceVisualState {
  const team = input.operationalResources?.personnelGroups?.field_team;
  const signal = input.operationSignals?.personnel?.status?.toLowerCase();
  if (!team && !signal) return 'unknown';
  if ((team?.fatigueScore ?? 0) >= 75 || (team?.moraleScore ?? 100) <= 35) return 'critical';
  if (team?.status === 'strained' || (team?.fatigueScore ?? 0) >= 60) return 'tired';
  if (team?.status === 'busy' || signal === 'busy') return 'busy';
  if (team?.status === 'strained') return 'strained';
  if (team?.status === 'stable') return 'stable';
  return 'ready';
}

function inferContainerState(input: ResourceFatigueVisualInput): ResourceVisualState {
  if (input.carryOverMemory?.domain === 'container' && input.carryOverMemory.resolved) {
    return 'resolved';
  }
  if (input.activeEvent?.resolved) return 'resolved';
  if (input.activeEvent?.inProgress) return 'recovering';

  const networks = input.operationalResources?.districtNetworks ?? {};
  const pressures = Object.values(networks).map((n) => n.fillPressure ?? 0);
  const maxPressure = pressures.length > 0 ? Math.max(...pressures) : 0;
  const anyCritical = Object.values(networks).some((n) => n.status === 'critical');
  const signal = input.operationSignals?.containers?.status?.toLowerCase();

  if (anyCritical || signal === 'critical') return 'critical';
  if (maxPressure >= 65 || signal === 'strained') return 'strained';
  if (maxPressure >= 45 || signal === 'busy') return 'watch';
  return 'stable';
}

function inferRouteState(input: ResourceFatigueVisualInput): ResourceVisualState {
  const truck = input.operationalResources?.vehicleGroups?.standard_truck;
  if ((truck?.maintenanceRisk ?? 0) >= 65) return 'maintenance_risk';
  if ((truck?.routePressure ?? 0) >= 75) return 'strained';
  if ((truck?.routePressure ?? 0) >= 55) return 'tired';
  if (truck?.status === 'busy') return 'busy';
  return 'stable';
}

function inferMixedState(input: ResourceFatigueVisualInput): ResourceVisualState {
  const focus = input.eventDomainFocus?.focus ?? input.mapPresence?.domain;
  if (focus === 'crisis_adjacent' || focus === 'crisis') return 'watch';
  const states = [
    inferVehicleState(input),
    inferPersonnelState(input),
    inferContainerState(input),
  ];
  if (states.includes('critical')) return 'strained';
  if (states.includes('tired') || states.includes('maintenance_risk')) return 'watch';
  return 'watch';
}

export function inferResourceVisualState(
  domain: ResourceVisualDomain,
  input: ResourceFatigueVisualInput,
): ResourceVisualState {
  switch (domain) {
    case 'vehicle':
      return inferVehicleState(input);
    case 'personnel':
      return inferPersonnelState(input);
    case 'container':
      return inferContainerState(input);
    case 'route':
      return inferRouteState(input);
    case 'mixed':
      return inferMixedState(input);
    default:
      return 'unknown';
  }
}

export function shouldShowResourceFatigueVisual(
  day: number,
  surface: ResourceVisualSurface,
  domain: ResourceVisualDomain,
  input: ResourceFatigueVisualInput,
): boolean {
  if (day <= 1) return false;
  if (
    day > 7 &&
    !input.hasRealPostPilotData &&
    !input.activeEvent &&
    !input.postPilotOperation?.active
  ) {
    return false;
  }

  if (domain === 'container') return day >= 2;
  if (domain === 'vehicle' || domain === 'personnel' || domain === 'route') {
    return day >= 3;
  }
  if (domain === 'mixed') return day >= 6;

  if (surface === 'report' && day === 7) return true;
  return day >= 2;
}

export function buildVehicleFatigueVisual(
  input: ResourceFatigueVisualInput,
): ResourceFatigueVisualModel | null {
  const surface = input.surface ?? 'hub';
  if (!shouldShowResourceFatigueVisual(input.day, surface, 'vehicle', input)) return null;
  const state = inferResourceVisualState('vehicle', input);
  if (state === 'unknown') return null;
  return modelFrom('vehicle', state, 'vehicle_fatigue');
}

export function buildPersonnelFatigueVisual(
  input: ResourceFatigueVisualInput,
): ResourceFatigueVisualModel | null {
  const surface = input.surface ?? 'hub';
  if (!shouldShowResourceFatigueVisual(input.day, surface, 'personnel', input)) return null;
  const state = inferResourceVisualState('personnel', input);
  if (state === 'unknown') return null;
  return modelFrom('personnel', state, 'personnel_fatigue');
}

export function buildContainerPressureVisual(
  input: ResourceFatigueVisualInput,
): ResourceFatigueVisualModel | null {
  const surface = input.surface ?? 'hub';
  if (!shouldShowResourceFatigueVisual(input.day, surface, 'container', input)) return null;
  const state = inferResourceVisualState('container', input);
  if (state === 'unknown' || state === 'stable') {
    if (input.day <= 2 && state === 'stable') return null;
    if (state === 'unknown') return null;
  }
  return modelFrom('container', state, 'container_pressure');
}

export function buildRouteLoadVisual(
  input: ResourceFatigueVisualInput,
): ResourceFatigueVisualModel | null {
  const surface = input.surface ?? 'hub';
  if (!shouldShowResourceFatigueVisual(input.day, surface, 'route', input)) return null;
  const state = inferResourceVisualState('route', input);
  if (state === 'stable' || state === 'ready') return null;
  return modelFrom('route', state, 'route_load');
}

export function buildResourceFatigueVisualSummary(
  input: ResourceFatigueVisualInput,
): ResourceFatigueVisualSummary {
  const surface = input.surface ?? 'hub';
  const warnings: string[] = [];
  const candidates: ResourceFatigueVisualModel[] = [];

  const focusDomain = input.domain;
  const push = (model: ResourceFatigueVisualModel | null) => {
    if (model?.visible) candidates.push(model);
  };

  if (!focusDomain || focusDomain === 'mixed') {
    push(buildContainerPressureVisual(input));
    push(buildVehicleFatigueVisual(input));
    push(buildPersonnelFatigueVisual(input));
    push(buildRouteLoadVisual(input));
    if (
      input.day >= 6 &&
      shouldShowResourceFatigueVisual(input.day, surface, 'mixed', input)
    ) {
      push(modelFrom('mixed', inferMixedState(input), 'mixed_warning'));
    }
  } else if (focusDomain === 'vehicle') {
    push(buildVehicleFatigueVisual(input));
    push(buildRouteLoadVisual(input));
  } else if (focusDomain === 'personnel') {
    push(buildPersonnelFatigueVisual(input));
  } else if (focusDomain === 'container') {
    push(buildContainerPressureVisual(input));
    push(buildVehicleFatigueVisual(input));
  } else if (focusDomain === 'route') {
    push(buildRouteLoadVisual(input));
    push(buildVehicleFatigueVisual(input));
  }

  const maxItems = input.day === 7 ? 2 : input.day <= 2 ? 1 : 3;
  const visibleStates = candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxItems);

  return {
    visibleStates,
    primaryState: visibleStates[0],
    warnings,
  };
}

export function buildResourceFatiguePanelLine(model: ResourceFatigueVisualModel): string {
  return clamp(`${model.title}: ${model.summary}`, SUMMARY_LIMIT);
}

export function buildResourceFatigueMapMarkerStatus(
  model: ResourceFatigueVisualModel | null | undefined,
): MapPresenceMarkerStatus | null {
  if (!model) return null;
  switch (model.state) {
    case 'resolved':
      return 'resolved';
    case 'recovering':
      return 'in_progress';
    case 'watch':
    case 'strained':
      return 'pressure';
    case 'tired':
      return 'tired';
    case 'maintenance_risk':
      return 'maintenance_risk';
    case 'critical':
      return 'critical';
    case 'busy':
    case 'ready':
      return 'working';
    case 'stable':
      return 'normal';
    default:
      return 'normal';
  }
}

export function formatResourceFatigueForDebug(model: ResourceFatigueVisualModel): string {
  return `${model.domain}/${model.state} (${model.debugReason ?? 'n/a'})`;
}

export function inferResourceDomainFromEventFocus(
  focus?: string,
): ResourceVisualDomain | undefined {
  switch (focus) {
    case 'container':
      return 'container';
    case 'vehicle_route':
    case 'vehicle':
      return 'vehicle';
    case 'personnel':
      return 'personnel';
    case 'crisis_adjacent':
    case 'crisis':
      return 'mixed';
    default:
      return undefined;
  }
}

export function buildResourceFatigueInputForMapPresence(
  mapInput: ResourceFatigueVisualInput,
): ResourceFatigueVisualInput {
  return { ...mapInput, surface: 'map' };
}
