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
  forest: '#0E4F47',
  forestDark: '#073B35',
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
  description: string;
  imageKey: 'clipboard' | 'map' | 'crate';
};

export type ProfileIdentityBadge = {
  id: string;
  label: string;
  iconKey: 'star' | 'shield-checkmark' | 'business' | 'ribbon';
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
    badges: ProfileIdentityBadge[];
  };
  summary: {
    rankLabel: string;
    subtitle: string;
    authorityTrustValue: string;
    remainingTrustValue: string;
    advantageTitle: string;
    advantageLabel: string;
  };
  authorityMini: {
    progressPercent: number;
    nextRankLabel: string;
    remainingTrustLabel: string;
  };
  strengths: ProfileStrengthItem[];
  roleAdvantages: ProfileRoleAdvantageItem[];
  roadmap: ProfileRoadmapNode[];
  roadmapSummary: {
    label: string;
    valueLabel: string;
    progress: number;
  };
};

const ROLE_ADVANTAGES_BY_RANK: Record<AuthorityRankId, ProfileRoleAdvantageItem[]> = {
  field_coordinator: [
    {
      id: 'priority-tasks',
      title: 'Öncelikli Görev Atamaları',
      description: 'Başlıca projelerde öncelikli rol alabilir, şehrin gelişimini hızlandırabilirsin.',
      imageKey: 'clipboard',
    },
    {
      id: 'region-voice',
      title: 'Bölge Yönetiminde Söz Sahibi Ol',
      description: 'Bölge planlamalarında söz sahibi olarak stratejik kararlara katkıda bulunursun.',
      imageKey: 'map',
    },
    {
      id: 'resource-access',
      title: 'Özel Kaynak Erişimi',
      description: 'Saha özel kaynak havuzuna erişerek projeleri daha hızlı tamamlayabilirsin.',
      imageKey: 'crate',
    },
  ],
  operations_responsible: [
    {
      id: 'ops-scope',
      title: 'Operasyon Kapsamı Genişletme',
      description: 'Aynı gün içinde daha geniş görev kümelerini planlama hakkı kazanırsın.',
      imageKey: 'clipboard',
    },
    {
      id: 'district-preview',
      title: 'Bölge Genişleme Önizlemesi',
      description: 'Sonraki mahalle açılımlarını erkenden okuyup hazırlık yapabilirsin.',
      imageKey: 'map',
    },
    {
      id: 'crisis-layer',
      title: 'Kriz Katmanı Erişimi',
      description: 'Yükselen risklerde ek denetim ve müdahale akışlarını yönetirsin.',
      imageKey: 'crate',
    },
  ],
  unit_chief: [
    {
      id: 'unit-scope',
      title: 'Birim Düzeyi Karar Yetkisi',
      description: 'Birime bağlı operasyonların öncelik ve kaynak dengesini kurarsın.',
      imageKey: 'clipboard',
    },
    {
      id: 'team-spec',
      title: 'Ekip Uzmanlık Önizlemesi',
      description: 'Ekiplerin güçlü taraflarını takip edip görevlere daha doğru bağlarsın.',
      imageKey: 'map',
    },
    {
      id: 'maintenance',
      title: 'Filo Bakım Penceresi',
      description: 'Araç bakım risklerini erkenden görüp operasyon kesintisini azaltırsın.',
      imageKey: 'crate',
    },
  ],
  district_coordinator: [
    {
      id: 'map-layers',
      title: 'Harita Katmanları',
      description: 'Bölge davranışlarını katmanlı harita üzerinden daha erken okursun.',
      imageKey: 'map',
    },
    {
      id: 'story-chains',
      title: 'Olay Zinciri Önizlemesi',
      description: 'Bir kararın sonraki günlere uzanan etkisini daha net takip edersin.',
      imageKey: 'clipboard',
    },
    {
      id: 'trust-layer',
      title: 'Güven Katmanı Erişimi',
      description: 'Mahalle güveni ve sosyal denge sinyallerini operasyon planına katarsın.',
      imageKey: 'crate',
    },
  ],
  deputy_director: [
    {
      id: 'operation-era',
      title: 'Operasyon Dönemi Önizlemesi',
      description: 'Dönem hedeflerini ve uzun akışları tek merkezden yönetmeye başlarsın.',
      imageKey: 'clipboard',
    },
    {
      id: 'adaptive-events',
      title: 'Uyarlanabilir Olay Ağı',
      description: 'Şehrin tepkisine göre değişen olay zincirlerini daha görünür kılarsın.',
      imageKey: 'map',
    },
    {
      id: 'recovery',
      title: 'Geri Dönüş Fırsatları',
      description: 'Zor günlerden sonra güven ve kaynak toparlama fırsatlarını yakalarsın.',
      imageKey: 'crate',
    },
  ],
  department_director: [
    {
      id: 'city-dev',
      title: 'Şehir Gelişimi Önizlemesi',
      description: 'Şehir ölçeğindeki gelişim rotasını ve yatırım etkilerini izlersin.',
      imageKey: 'map',
    },
    {
      id: 'departments',
      title: 'Departman Birimleri',
      description: 'Departmanlar arası görev paylaşımını daha üst düzeyden yönetirsin.',
      imageKey: 'clipboard',
    },
    {
      id: 'strategy',
      title: 'Stratejik Operasyon Zinciri',
      description: 'Birden fazla sistemi aynı hedefe bağlayan operasyon zincirleri kurarsın.',
      imageKey: 'crate',
    },
  ],
};

function scoreToSegments(score: number, total = 10): number {
  const normalized = Math.max(0, Math.min(100, score));
  return Math.max(0, Math.min(total, Math.round(normalized / 10)));
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
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

function truncateBadgeLabel(label: string): string {
  return label.length > 18 ? `${label.slice(0, 16)}...` : label;
}

function buildIdentityBadges(
  model: ProfileViewModel,
  authoritySummary: ProfileAuthoritySummary,
  pilotDay: number,
): ProfileIdentityBadge[] {
  const dayBadge =
    pilotDay <= 2
      ? { id: 'first-duty', label: 'İlk Görev', iconKey: 'star' as const }
      : { id: 'field-series', label: `${pilotDay}. Gün`, iconKey: 'business' as const };

  const pressureBadge =
    model.risk >= 50
      ? { id: 'critical-duty', label: 'Kritik Görev', iconKey: 'shield-checkmark' as const }
      : model.solvedEvents > 0
        ? { id: 'field-success', label: 'Saha Başarısı', iconKey: 'ribbon' as const }
        : {
            id: 'role-ready',
            label: authoritySummary.nextRankLabel,
            iconKey: 'shield-checkmark' as const,
          };

  return [dayBadge, pressureBadge].map((badge) => ({
    ...badge,
    label: truncateBadgeLabel(badge.label),
  }));
}

function buildRoadmapSummary(
  authorityTrust: number,
  authoritySummary: ProfileAuthoritySummary,
): ProfileReferenceViewModel['roadmapSummary'] {
  const trustValue = Math.max(0, Math.round(authorityTrust));
  const remaining = parseInt(parseTrustValue(authoritySummary.remainingTrustLabel), 10);
  const targetValue = Math.max(
    trustValue,
    trustValue + (Number.isFinite(remaining) ? remaining : 0),
  );
  const safeTarget = targetValue > 0 ? targetValue : 1;

  return {
    label: 'GÜVEN PUANI',
    valueLabel: `${trustValue} / ${safeTarget}`,
    progress: clampRatio(trustValue / safeTarget),
  };
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
  const roleAdvantages =
    ROLE_ADVANTAGES_BY_RANK[normalized.formalRankId] ??
    ROLE_ADVANTAGES_BY_RANK.field_coordinator;

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
      badges: buildIdentityBadges(model, authoritySummary, pilotDay),
    },
    summary: {
      rankLabel: authoritySummary.rankLabel,
      subtitle: authoritySummary.progressSubtitle,
      authorityTrustValue: String(Math.max(0, Math.round(normalized.authorityTrust))),
      remainingTrustValue: parseTrustValue(authoritySummary.remainingTrustLabel),
      advantageTitle: roleAdvantages[0]?.title ?? 'Rol Avantajı',
      advantageLabel: 'AVANTAJIM',
    },
    authorityMini: {
      progressPercent: authoritySummary.progressPercent,
      nextRankLabel: authoritySummary.nextRankLabel,
      remainingTrustLabel: authoritySummary.remainingTrustLabel,
    },
    strengths: buildStrengths(normalized.domainScores),
    roleAdvantages,
    roadmap: buildRoadmap(normalized.formalRankId),
    roadmapSummary: buildRoadmapSummary(
      normalized.authorityTrust,
      authoritySummary,
    ),
  };
}
