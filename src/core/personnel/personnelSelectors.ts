import {
  FATIGUE_BAND_LABELS_TR,
  ROLE_LABELS_TR,
  STATUS_LABELS_TR,
} from './personnelConstants';
import { getPersonnelWarnings } from './personnelEngine';
import type {
  PersonnelState,
  PersonnelTeam,
  PersonnelTeamCardView,
  PersonnelWarningTag,
} from './personnelTypes';

const WARNING_LABELS_TR: Record<PersonnelWarningTag, string> = {
  overtime_yesterday: 'Dün fazla mesai yaptı',
  risky_fatigue: 'Riskli yorgunluk seviyesinde',
  low_morale: 'Moral düşük, hata riski artıyor',
  exhausted_warning: 'Tükenmiş seviyede — ağır uyarı',
  district_expert: 'Mahallede deneyimli',
  light_task_recommended: 'Bugün hafif görev önerilir',
  rest_recommended: 'Dinlendirilirse yarın tam verime yaklaşır',
  routine_burnout: 'Aynı mahallede rutin yük oluştu',
  role_mismatch: 'Rol uyumsuzluğu riski',
  consecutive_heavy: 'Üst üste yoğun günler',
};

function fatigueBandLabel(fatigue: number): string {
  for (const band of FATIGUE_BAND_LABELS_TR) {
    if (fatigue <= band.max) return band.label;
  }
  return FATIGUE_BAND_LABELS_TR[FATIGUE_BAND_LABELS_TR.length - 1].label;
}

function buildRestModeLabel(team: PersonnelTeam): string | null {
  if (team.restMode === 'full_rest') return 'Bugün tam dinlenmede';
  if (team.restMode === 'light_duty') return 'Hafif görevde';
  return null;
}

function buildReadinessText(team: PersonnelTeam): string {
  if (team.restMode === 'full_rest') {
    return 'Bugün tam dinlenmede — saha görevi alamaz.';
  }
  if (team.restMode === 'light_duty') {
    return 'Hafif görevde — yalnızca hafif/normal operasyonlara uygun.';
  }
  if (team.fatigue >= 86) {
    return 'Tükenmiş ama görev alabilir; başarı riski yüksek, dinlendirme önerilir.';
  }
  if (team.fatigue >= 71) {
    return 'Bugün zorlarsan işi çözebilirsin ama yarın elin zayıflar.';
  }
  if (team.fatigue >= 51) {
    return 'Orta tempoda görev için uygun; ağır kriz görevlerinde dikkatli ol.';
  }
  if (team.morale >= 75) {
    return 'Moral yüksek — verimli bir gün için hazır.';
  }
  return 'Dengeli tempo ile günü yönetebilir.';
}

export function toPersonnelTeamCardView(
  team: PersonnelTeam,
  districtName?: string,
  equipmentSupportActive?: boolean,
): PersonnelTeamCardView {
  const warnings = getPersonnelWarnings(team, districtName);
  const restModeLabel = buildRestModeLabel(team);
  return {
    id: team.id,
    name: team.name,
    role: team.role,
    roleLabel: ROLE_LABELS_TR[team.role],
    fatigue: team.fatigue,
    morale: team.morale,
    status: team.status,
    statusLabel: restModeLabel ?? STATUS_LABELS_TR[team.status] ?? team.status,
    todayWorkedHours: team.todayWorkedHours,
    readinessText: buildReadinessText(team),
    warningLabels: warnings.map((w) => WARNING_LABELS_TR[w]),
    fatigueBandLabel: fatigueBandLabel(team.fatigue),
    restModeLabel,
    supportTag: equipmentSupportActive ? 'Ekipman desteği aktif' : null,
  };
}

export function selectPersonnelTeamCards(
  state: PersonnelState,
  districtNames?: Record<string, string>,
  currentDay?: number,
): PersonnelTeamCardView[] {
  const equipmentActive =
    currentDay != null &&
    state.equipmentSupportUntilDay != null &&
    currentDay <= state.equipmentSupportUntilDay;

  return state.teams.map((team) => {
    const districtId = team.currentDistrictId ?? team.lastDistrictId;
    const districtName = districtId ? districtNames?.[districtId] : undefined;
    return toPersonnelTeamCardView(team, districtName, equipmentActive);
  });
}

export function selectAverageTeamMorale(state: PersonnelState): number {
  if (state.teams.length === 0) return 0;
  const sum = state.teams.reduce((acc, t) => acc + t.morale, 0);
  return Math.round(sum / state.teams.length);
}

export function selectAverageTeamFatigue(state: PersonnelState): number {
  if (state.teams.length === 0) return 0;
  const sum = state.teams.reduce((acc, t) => acc + t.fatigue, 0);
  return Math.round(sum / state.teams.length);
}
