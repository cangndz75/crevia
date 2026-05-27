import Ionicons from '@expo/vector-icons/Ionicons';

import { PILOT_COORDINATOR_ROLE } from '@/core/content/day1Seed';
import type { PlayerState } from '@/core/models/PlayerState';
import type { GameStatusSnapshot } from '@/store/gameSelectors';

export type ProfileViewModel = {
  playerName: string;
  role: string;
  unit: string;
  region: string;
  dayLabel: string;
  level: number;
  xp: number;
  xpTarget: number;
  xpProgress: number;
  xpToNextLevel: number;
  totalXp: number;
  budgetFormatted: string;
  satisfaction: number;
  morale: number;
  risk: number;
  solvedEvents: number;
  notificationCount: number;
};

export type ProfileBadge = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  locked: boolean;
};

export type TodayStatusLine = {
  id: string;
  text: string;
  tone: 'positive' | 'neutral' | 'caution';
};

const FALLBACK: ProfileViewModel = {
  playerName: 'Can',
  role: PILOT_COORDINATOR_ROLE,
  unit: 'Mahalle Hizmetleri',
  region: 'Merkez Pilot Bölge',
  dayLabel: 'Gün 1 · Çarşamba',
  level: 1,
  xp: 0,
  xpTarget: 120,
  xpProgress: 0,
  xpToNextLevel: 120,
  totalXp: 0,
  budgetFormatted: '75K Kaynak',
  satisfaction: 55,
  morale: 65,
  risk: 35,
  solvedEvents: 0,
  notificationCount: 0,
};

function num(value: number | undefined | null, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return value;
}

export function buildProfileViewModel(
  status: GameStatusSnapshot,
  player: PlayerState,
): ProfileViewModel {
  return {
    playerName: status.playerName?.trim() || FALLBACK.playerName,
    role: player.role?.trim() || status.role?.trim() || FALLBACK.role,
    unit: player.title?.trim() || FALLBACK.unit,
    region: status.selectedDistrictName?.trim() || FALLBACK.region,
    dayLabel: status.dayLabel?.trim() || FALLBACK.dayLabel,
    level: num(status.level, FALLBACK.level),
    xp: num(status.xp, FALLBACK.xp),
    xpTarget: num(status.xpTarget, FALLBACK.xpTarget),
    xpProgress: num(status.xpProgress, FALLBACK.xpProgress),
    xpToNextLevel: num(status.xpToNextLevel, FALLBACK.xpToNextLevel),
    totalXp: num(status.totalXp, FALLBACK.totalXp),
    budgetFormatted: status.budgetFormatted?.trim() || FALLBACK.budgetFormatted,
    satisfaction: num(status.publicSatisfaction, FALLBACK.satisfaction),
    morale: num(status.staffMorale, FALLBACK.morale),
    risk: num(status.operationRisk, FALLBACK.risk),
    solvedEvents: num(status.solvedEventsCount, FALLBACK.solvedEvents),
    notificationCount: num(
      player.notificationCount ?? status.notificationCount,
      FALLBACK.notificationCount,
    ),
  };
}

export function buildProfileBadges(model: ProfileViewModel): ProfileBadge[] {
  const dayChip = model.dayLabel.split('·')[0]?.trim() ?? `Gün ${model.level}`;

  return [
    { id: 'pilot', label: 'Pilot Dönem', icon: 'flag-outline', locked: false },
    { id: 'day', label: dayChip, icon: 'calendar-outline', locked: false },
    {
      id: 'unit',
      label: model.unit,
      icon: 'business-outline',
      locked: false,
    },
    {
      id: 'new',
      label: 'Yeni Koordinatör',
      icon: 'ribbon-outline',
      locked: false,
    },
    {
      id: 'expert',
      label: 'Bölge Uzmanı',
      icon: 'map-outline',
      locked: true,
    },
    {
      id: 'crisis',
      label: 'Kriz Yönetimi',
      icon: 'shield-outline',
      locked: true,
    },
  ];
}

export function buildTodayStatusLines(model: ProfileViewModel): TodayStatusLine[] {
  const satisfactionLine = (() => {
    if (model.satisfaction >= 60) {
      return { text: 'Halk memnuniyeti iyi seviyede', tone: 'positive' as const };
    }
    if (model.satisfaction >= 40) {
      return { text: 'Halk memnuniyeti dengede', tone: 'neutral' as const };
    }
    return { text: 'Halk memnuniyeti risk altında', tone: 'caution' as const };
  })();

  const moraleLine = (() => {
    if (model.morale >= 60) {
      return { text: 'Personel morali iyi', tone: 'positive' as const };
    }
    if (model.morale >= 40) {
      return { text: 'Personel morali dengede', tone: 'neutral' as const };
    }
    return { text: 'Personel morali düşük', tone: 'caution' as const };
  })();

  const riskLine = (() => {
    if (model.risk >= 50) {
      return { text: 'Operasyon riski takip edilmeli', tone: 'caution' as const };
    }
    if (model.risk >= 30) {
      return { text: 'Operasyon riski kontrollü', tone: 'neutral' as const };
    }
    return { text: 'Operasyon riski düşük', tone: 'positive' as const };
  })();

  return [
    { id: 'satisfaction', ...satisfactionLine },
    { id: 'morale', ...moraleLine },
    { id: 'risk', ...riskLine },
  ];
}
