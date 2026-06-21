import { AUTHORITY_RANKS } from '@/core/authority/authorityConstants';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityDomainScores, AuthorityRankId } from '@/core/authority/authorityTypes';
import type { ProfileAuthoritySummary } from '@/features/profile/utils/profileAuthorityModel';
import type { ProfileViewModel } from '@/features/profile/utils/profileModel';

export const PROFILE_REFERENCE_THEME = {
  screenBg: '#FCF9F2',
  heroBg: '#F4FAF8',
  teal: '#1A8F8A',
  tealDark: '#157A76',
  tealDeep: '#07564F',
  gold: '#F5B731',
  goldDark: '#D4A017',
  textPrimary: '#173D3A',
  textSecondary: '#6D736C',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(26, 143, 138, 0.12)',
  summaryGradient: ['#1A8F8A', '#157A76', '#0D7168'] as const,
} as const;

export type ProfileStrengthItem = {
  id: string;
  label: string;
  filledSegments: number;
  totalSegments: number;
  iconKey: 'calendar-outline' | 'people-outline' | 'bulb-outline';
};

export type ProfileRoleAdvantageItem = {
  id: string;
  title: string;
  imageKey: 'clipboard' | 'map' | 'crate';
};

export type ProfileRoadmapNode = {
  id: AuthorityRankId;
  rankNumber: number;
  label: string;
  status: 'active' | 'upcoming' | 'locked';
  statusLabel: string;
  trustRequired?: number;
};

export type ProfileReferenceViewModel = {
  identity: {
    playerName: string;
    roleLabel: string;
    districtLabel: string;
    dayLabel: string;
    level: number;
    xpLabel: string;
    levelLabel: string;
    xpProgress: number;
    notificationCount: number;
  };
  summary: {
    rankLabel: string;
    subtitle: string;
    authorityTrustValue: string;
    remainingTrustValue: string;
  };
  authorityMini: {
    progressPercent: number;
    nextRankLabel: string;
    remainingTrustLabel: string;
  };
  strengths: ProfileStrengthItem[];
  roleAdvantages: ProfileRoleAdvantageItem[];
  roadmap: ProfileRoadmapNode[];
};

const ROLE_ADVANTAGES_BY_RANK: Record<AuthorityRankId, ProfileRoleAdvantageItem[]> = {
  field_coordinator: [
    { id: 'priority-tasks', title: 'Öncelikli Görev Atamaları', imageKey: 'clipboard' },
    { id: 'region-voice', title: 'Bölge Yönetiminde Söz Sahibi Ol', imageKey: 'map' },
    { id: 'resource-access', title: 'Özel Kaynak Erişimi', imageKey: 'crate' },
  ],
  operations_responsible: [
    { id: 'ops-scope', title: 'Operasyon Kapsamı Genişletme', imageKey: 'clipboard' },
    { id: 'district-preview', title: 'Bölge Genişleme Önizlemesi', imageKey: 'map' },
    { id: 'crisis-layer', title: 'Kriz Katmanı Erişimi', imageKey: 'crate' },
  ],
  unit_chief: [
    { id: 'unit-scope', title: 'Birim Düzeyi Karar Yetkisi', imageKey: 'clipboard' },
    { id: 'team-spec', title: 'Ekip Uzmanlık Önizlemesi', imageKey: 'map' },
    { id: 'maintenance', title: 'Filo Bakım Penceresi', imageKey: 'crate' },
  ],
  district_coordinator: [
    { id: 'map-layers', title: 'Harita Katmanları', imageKey: 'map' },
    { id: 'story-chains', title: 'Olay Zinciri Önizlemesi', imageKey: 'clipboard' },
    { id: 'trust-layer', title: 'Güven Katmanı Erişimi', imageKey: 'crate' },
  ],
  deputy_director: [
    { id: 'operation-era', title: 'Operasyon Dönemi Önizlemesi', imageKey: 'clipboard' },
    { id: 'adaptive-events', title: 'Uyarlanabilir Olay Ağı', imageKey: 'map' },
    { id: 'recovery', title: 'Geri Dönüş Fırsatları', imageKey: 'crate' },
  ],
  department_director: [
    { id: 'city-dev', title: 'Şehir Gelişimi Önizlemesi', imageKey: 'map' },
    { id: 'departments', title: 'Departman Birimleri', imageKey: 'clipboard' },
    { id: 'strategy', title: 'Stratejik Operasyon Zinciri', imageKey: 'crate' },
  ],
};

function scoreToSegments(score: number, total = 10): number {
  const normalized = Math.max(0, Math.min(100, score));
  return Math.max(0, Math.min(total, Math.round(normalized / 10)));
}

function buildStrengths(domainScores?: AuthorityDomainScores): ProfileStrengthItem[] {
  const scores = domainScores ?? {
    operations: 50,
    publicTrust: 50,
    resources: 50,
    personnel: 50,
    crisis: 50,
  };

  const planningScore = Math.round((scores.operations + scores.resources) / 2);
  const coordinationScore = scores.personnel;
  const problemSolvingScore = Math.round((scores.crisis + scores.operations) / 2);

  return [
    {
      id: 'planning',
      label: 'Planlama',
      filledSegments: scoreToSegments(planningScore),
      totalSegments: 10,
      iconKey: 'calendar-outline',
    },
    {
      id: 'coordination',
      label: 'Koordinasyon',
      filledSegments: scoreToSegments(coordinationScore),
      totalSegments: 10,
      iconKey: 'people-outline',
    },
    {
      id: 'problem-solving',
      label: 'Problem Çözme',
      filledSegments: scoreToSegments(problemSolvingScore),
      totalSegments: 10,
      iconKey: 'bulb-outline',
    },
  ];
}

function buildRoadmap(formalRankId: AuthorityRankId): ProfileRoadmapNode[] {
  const currentIndex = AUTHORITY_RANKS.findIndex((rank) => rank.id === formalRankId);
  const startIndex = Math.max(0, currentIndex);
  const slice = AUTHORITY_RANKS.slice(startIndex, startIndex + 4);

  return slice.map((rank, index) => {
    if (index === 0) {
      return {
        id: rank.id,
        rankNumber: startIndex + index + 1,
        label: rank.label,
        status: 'active' as const,
        statusLabel: 'Aktif',
      };
    }

    const trustRequired = rank.trustThreshold;
    return {
      id: rank.id,
      rankNumber: startIndex + index + 1,
      label: rank.label,
      status: 'locked' as const,
      statusLabel: `${trustRequired} güven gerekli`,
      trustRequired,
    };
  });
}

function parseTrustValue(label: string): string {
  const match = label.match(/(\d+)/);
  return match?.[1] ?? '0';
}

export function buildProfileReferenceViewModel(input: {
  model: ProfileViewModel;
  authoritySummary: ProfileAuthoritySummary;
  authorityState?: unknown;
  pilotDay: number;
}): ProfileReferenceViewModel {
  const { model, authoritySummary, authorityState, pilotDay } = input;
  const normalized = normalizeAuthorityState(authorityState, pilotDay);
  const dayShort = model.dayLabel.split('·')[0]?.trim() || `Gün ${pilotDay}`;

  return {
    identity: {
      playerName: model.playerName,
      roleLabel: authoritySummary.rankLabel,
      districtLabel: model.region,
      dayLabel: dayShort,
      level: model.level,
      xpLabel: `XP ${model.xp} / ${model.xpTarget}`,
      levelLabel: `Seviye ${model.level}`,
      xpProgress: model.xpProgress,
      notificationCount: model.notificationCount,
    },
    summary: {
      rankLabel: authoritySummary.rankLabel,
      subtitle: authoritySummary.progressSubtitle,
      authorityTrustValue: String(Math.max(0, Math.round(normalized.authorityTrust))),
      remainingTrustValue: parseTrustValue(authoritySummary.remainingTrustLabel),
    },
    authorityMini: {
      progressPercent: authoritySummary.progressPercent,
      nextRankLabel: authoritySummary.nextRankLabel,
      remainingTrustLabel: authoritySummary.remainingTrustLabel,
    },
    strengths: buildStrengths(normalized.domainScores),
    roleAdvantages:
      ROLE_ADVANTAGES_BY_RANK[normalized.formalRankId] ??
      ROLE_ADVANTAGES_BY_RANK.field_coordinator,
    roadmap: buildRoadmap(normalized.formalRankId),
  };
}
