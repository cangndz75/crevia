import { mapAssignmentPersonnelToTeamGroup } from './teamSpecializationEngine';
import {
  TEAM_SPECIALIZATION_PLAYER_LABELS,
  TEAM_SPECIALIZATION_VISIBLE_DAY_MIN,
} from './teamSpecializationRuntimeConstants';
import type {
  TeamGroupId,
  TeamSpecializationDayCloseInput,
  TeamSpecializationStateV1,
} from './teamSpecializationRuntimeTypes';

function districtLabel(districtId?: string): string {
  if (!districtId) return 'saha';
  const labels: Record<string, string> = {
    merkez: 'Merkez',
    cumhuriyet: 'Cumhuriyet',
    sanayi: 'Sanayi',
    istasyon: 'İstasyon',
    yesilvadi: 'Yeşilvadi',
  };
  return labels[districtId] ?? districtId;
}

function pickFocusGroup(state: TeamSpecializationStateV1): TeamGroupId {
  return (
    state.fatigueSummary.strainedGroupIds[0] ??
    state.specializationSummary.highestExperienceGroupId ??
    'field_coordination'
  );
}

function isStrainBand(
  fatigueBand: TeamSpecializationStateV1['teamGroups'][TeamGroupId]['fatigueBand'],
): boolean {
  return fatigueBand === 'watched' || fatigueBand === 'elevated' || fatigueBand === 'strained';
}

export function hasMeaningfulTeamSpecializationSurfaceData(
  state: TeamSpecializationStateV1,
): boolean {
  const focus = pickFocusGroup(state);
  const group = state.teamGroups[focus];
  if (state.fatigueSummary.strainedGroupIds.length > 0) return true;
  if (isStrainBand(group.fatigueBand)) return true;
  if (group.specializationBand !== 'none') return true;
  if (group.moraleBand === 'motivated') return true;
  if (group.experienceScore >= 20) return true;
  if (group.cautionLine?.trim()) return true;
  if (group.specializationBand !== 'none' && group.suggestedUseLine?.trim()) return true;
  return false;
}

export function isTeamSpecializationStrainPresentationLine(line?: string): boolean {
  if (!line) return false;
  const normalized = line.toLocaleLowerCase('tr-TR');
  return (
    normalized.includes('yorgunluk') ||
    normalized.includes('yorgun') ||
    normalized.includes('üst üste') ||
    normalized.includes('dengeli kullan') ||
    normalized.includes('dikkatli kullan') ||
    normalized.includes('dinlen')
  );
}

export function isTeamSpecializationPositivePresentationLine(line?: string): boolean {
  if (!line) return false;
  const normalized = line.toLocaleLowerCase('tr-TR');
  return (
    normalized.includes('deneyim kazan') ||
    normalized.includes('güvenilir') ||
    normalized.includes('güçlen') ||
    normalized.includes('iz bırak') ||
    normalized.includes('moral')
  );
}

export function buildCombinedVehicleTeamStrainLine(
  vehicleLine?: string,
  teamLine?: string,
): string | undefined {
  if (!vehicleLine || !teamLine) return undefined;
  const vehicleStrain =
    vehicleLine.toLocaleLowerCase('tr-TR').includes('yorgunluk') ||
    vehicleLine.toLocaleLowerCase('tr-TR').includes('baskı') ||
    vehicleLine.toLocaleLowerCase('tr-TR').includes('bakım');
  const teamStrain = isTeamSpecializationStrainPresentationLine(teamLine);
  if (!vehicleStrain || !teamStrain) return undefined;
  if (vehicleLine.includes('rota') || teamLine.includes('rota')) {
    return 'Rota hattında hem araç hem ekip yükü izleniyor. Yarın dengeli görev dağılımı iyi olur.';
  }
  return 'Sahada hem araç hem ekip yükü izleniyor. Yarın dengeli plan iyi olur.';
}

export function buildTeamSpecializationHubLine(
  state: TeamSpecializationStateV1,
  input: Pick<TeamSpecializationDayCloseInput, 'day' | 'districtId'>,
): string | undefined {
  if (input.day < TEAM_SPECIALIZATION_VISIBLE_DAY_MIN) return undefined;

  const groupId = pickFocusGroup(state);
  const group = state.teamGroups[groupId];
  const label = TEAM_SPECIALIZATION_PLAYER_LABELS[groupId];
  const district = districtLabel(input.districtId);

  if (isStrainBand(group.fatigueBand)) {
    return `Ekip izi: ${label} yorgunluk izleniyor; yarın dengeli kullanım iyi olur.`;
  }
  if (group.specializationBand === 'emerging' || group.specializationBand === 'reliable') {
    return `Ekip izi: ${label} ${district} hattında deneyim kazanıyor.`;
  }
  if (group.specializationBand === 'specialized' || group.specializationBand === 'expert_preview') {
    return `Ekip izi: ${label} ${district} hattında daha güvenilir hale geliyor.`;
  }
  return group.suggestedUseLine ? `Ekip izi: ${group.suggestedUseLine}` : undefined;
}

export function buildTeamSpecializationReportLine(
  state: TeamSpecializationStateV1,
  input: Pick<TeamSpecializationDayCloseInput, 'day'>,
): string | undefined {
  if (input.day < TEAM_SPECIALIZATION_VISIBLE_DAY_MIN) return undefined;

  const strained = state.fatigueSummary.strainedGroupIds[0];
  if (strained) {
    const label = TEAM_SPECIALIZATION_PLAYER_LABELS[strained];
    return `Ekip yorgunluğu: ${label} yarın daha dengeli kullanılmalı.`;
  }

  const focus = pickFocusGroup(state);
  const group = state.teamGroups[focus];
  if (isStrainBand(group.fatigueBand)) {
    return `Ekip yorgunluğu: ${TEAM_SPECIALIZATION_PLAYER_LABELS[focus]} üst üste yoğun güne çıktı; yarın dikkatli plan iyi olur.`;
  }
  if (group.specializationBand === 'emerging' || group.specializationBand === 'reliable') {
    return `Ekip izi: ${TEAM_SPECIALIZATION_PLAYER_LABELS[focus]} sahada deneyim kazanıyor.`;
  }
  if (group.specializationBand === 'specialized' || group.specializationBand === 'expert_preview') {
    return `Ekip izi: ${TEAM_SPECIALIZATION_PLAYER_LABELS[focus]} bu alanda daha güvenilir hale geliyor.`;
  }
  if (group.moraleBand === 'motivated') {
    return `Ekip moral izi: ${TEAM_SPECIALIZATION_PLAYER_LABELS[focus]} bugün daha dengeli çalıştı.`;
  }
  return undefined;
}

export function buildTeamSpecializationMapLine(
  state: TeamSpecializationStateV1,
  input: Pick<TeamSpecializationDayCloseInput, 'day' | 'districtId'>,
): string | undefined {
  if (input.day < TEAM_SPECIALIZATION_VISIBLE_DAY_MIN) return undefined;

  const groupId = pickFocusGroup(state);
  const label = TEAM_SPECIALIZATION_PLAYER_LABELS[groupId];
  const district = districtLabel(input.districtId);

  const group = state.teamGroups[groupId];
  if (isStrainBand(group.fatigueBand)) {
    return `Ekip desteği: ${label} ${district} hattında yük izleniyor; dengeli plan iyi olur.`;
  }
  if (groupId === 'container_service') {
    return `Ekip desteği: ${district} konteyner ekibi sahada daha net iz bırakıyor.`;
  }
  if (group.specializationBand === 'reliable' || group.specializationBand === 'specialized') {
    return `Ekip izi: ${label} bu bölgede daha tutarlı çalışıyor.`;
  }
  if (group.cautionLine) {
    return `Ekip desteği: ${label} dikkatli kullanım istiyor.`;
  }
  return `Ekip desteği: ${label} ${district} hattında saha koordinasyonu güçleniyor.`;
}

export function buildTeamSpecializationAssignmentHint(
  state: TeamSpecializationStateV1,
  input: Pick<TeamSpecializationDayCloseInput, 'assignmentPersonnelGroup' | 'assignmentDomain'>,
): string | undefined {
  const focusGroup =
    mapAssignmentPersonnelToTeamGroup(input.assignmentPersonnelGroup) ?? pickFocusGroup(state);
  const group = state.teamGroups[focusGroup];

  const label = TEAM_SPECIALIZATION_PLAYER_LABELS[focusGroup];
  const districtHint =
    input.assignmentDomain?.includes('route') || input.assignmentDomain?.includes('vehicle')
      ? 'rota'
      : 'bu bölgede';

  if (group.fatigueBand === 'strained' || group.fatigueBand === 'elevated') {
    return `${label} üst üste kullanıldığı için yarın dengeli plan iyi olur.`;
  }
  if (group.experienceScore >= 40) {
    return 'Bu seçim rota ekibinin deneyimini artırabilir.';
  }
  if (input.assignmentDomain && group.dominantDomain.includes(input.assignmentDomain.slice(0, 6))) {
    return `${label} ${districtHint} deneyim kazanıyor.`;
  }
  if (group.specializationBand === 'emerging' || group.specializationBand === 'reliable') {
    return 'Bu seçim ekibin saha deneyimini güçlendirebilir.';
  }
  return undefined;
}

export function buildTeamSpecializationCityJournalEntry(
  state: TeamSpecializationStateV1,
  input: Pick<TeamSpecializationDayCloseInput, 'day'>,
): string | undefined {
  if (input.day < TEAM_SPECIALIZATION_VISIBLE_DAY_MIN) return undefined;

  const focus = pickFocusGroup(state);
  const group = state.teamGroups[focus];
  const label = TEAM_SPECIALIZATION_PLAYER_LABELS[focus];

  if (group.moraleBand === 'motivated') {
    return `Ekip toparlandı: ${label} bugünkü güven çizgisini güçlendirdi.`;
  }
  if (group.specializationBand === 'specialized' || group.specializationBand === 'expert_preview') {
    return `Ekip uzmanlığı: ${label} bu alanda belirgin iz bıraktı.`;
  }
  if (group.fatigueBand === 'strained') {
    return `Ekip yorgunluğu: ${label} yoğun günün ardından dinlenmeye ihtiyaç duyuyor.`;
  }
  return undefined;
}
