import type {
  PersonnelRole,
  PersonnelTeam,
  PersonnelTeamCardView,
} from '@/core/personnel/personnelTypes';

export type TeamDispatchCardVariant = 'ready' | 'resting' | 'maintenance';

export type TeamDispatchMetric = {
  label: string;
  value: number;
};

export type TeamDispatchTeamCardModel = {
  id: string;
  name: string;
  role: PersonnelRole;
  specialistLabel: string;
  roleIcon: 'leaf-outline' | 'car-outline' | 'construct-outline' | 'people-outline';
  variant: TeamDispatchCardVariant;
  statusLabel: string;
  avatarBadgeIcon: 'checkmark-circle' | 'time' | 'construct';
  metrics: [TeamDispatchMetric, TeamDispatchMetric];
  statusMessage: string;
  statusIcon: 'search-outline' | 'moon-outline' | 'construct-outline';
  primaryActionLabel: string;
  primaryActionIcon: 'arrow-forward' | 'notifications-outline' | 'analytics-outline';
};

export type TeamDispatchScreenModel = {
  title: string;
  subtitle: string;
  quickAssignTitle: string;
  quickAssignSubtitle: string;
  quickAssignRoute: string;
  teams: TeamDispatchTeamCardModel[];
};

const ROLE_SPECIALIST: Record<
  PersonnelRole,
  { label: string; roleIcon: TeamDispatchTeamCardModel['roleIcon'] }
> = {
  cleaning: { label: 'Temizlik Uzmanı', roleIcon: 'leaf-outline' },
  driver: { label: 'Lojistik Uzmanı', roleIcon: 'car-outline' },
  maintenance: { label: 'Bakım Uzmanı', roleIcon: 'construct-outline' },
  field_supervisor: { label: 'Saha Koordinatörü', roleIcon: 'people-outline' },
};

const DISPLAY_ROLE_ORDER: PersonnelRole[] = ['cleaning', 'driver', 'maintenance'];

function resolveVariant(team: PersonnelTeam, card: PersonnelTeamCardView): TeamDispatchCardVariant {
  if (team.role === 'maintenance') return 'maintenance';
  if (
    team.restMode != null ||
    team.status === 'resting' ||
    card.restModeLabel != null
  ) {
    return 'resting';
  }
  return 'ready';
}

function buildStatusMessage(
  variant: TeamDispatchCardVariant,
  card: PersonnelTeamCardView,
  districtLabel: string,
): string {
  if (variant === 'maintenance') {
    return 'Ekipman bakımda. Tahmini bitiş: Yarın 08:00';
  }
  if (variant === 'resting') {
    if (card.restModeLabel === 'Hafif görevde') {
      return 'Hafif görev planında. Tam kapasite için dinlenme önerilir.';
    }
    return 'Dinlenme süresi devam ediyor. 2s 15dk sonra hazır.';
  }
  if (card.morale >= 70 && card.fatigue <= 30) {
    return `${districtLabel} bölgesinde mükemmel performans gösteriyor.`;
  }
  return card.readinessText;
}

function buildMetrics(
  variant: TeamDispatchCardVariant,
  team: PersonnelTeam,
  card: PersonnelTeamCardView,
): [TeamDispatchMetric, TeamDispatchMetric] {
  if (variant === 'maintenance') {
    return [
      { label: 'Verimlilik', value: team.efficiency },
      { label: 'Ekipman', value: team.competencies.container_maintenance },
    ];
  }
  return [
    { label: 'Yorgunluk', value: card.fatigue },
    { label: 'Moral', value: card.morale },
  ];
}

function buildPrimaryAction(variant: TeamDispatchCardVariant): {
  label: string;
  icon: TeamDispatchTeamCardModel['primaryActionIcon'];
} {
  if (variant === 'maintenance') {
    return { label: 'Bakım Takibi', icon: 'analytics-outline' };
  }
  if (variant === 'resting') {
    return { label: 'Hatırlatıcı Ayarla', icon: 'notifications-outline' };
  }
  return { label: 'Görevlendir', icon: 'arrow-forward' };
}

function toTeamCardModel(
  team: PersonnelTeam,
  card: PersonnelTeamCardView,
  districtLabel: string,
): TeamDispatchTeamCardModel {
  const variant = resolveVariant(team, card);
  const specialist = ROLE_SPECIALIST[team.role];
  const primaryAction = buildPrimaryAction(variant);

  const statusLabel =
    variant === 'maintenance'
      ? 'BAKIMDA'
      : variant === 'resting'
        ? 'DİNLENİYOR'
        : 'HAZIR';

  const avatarBadgeIcon =
    variant === 'maintenance'
      ? 'construct'
      : variant === 'resting'
        ? 'time'
        : 'checkmark-circle';

  const statusIcon =
    variant === 'maintenance'
      ? 'construct-outline'
      : variant === 'resting'
        ? 'moon-outline'
        : 'search-outline';

  return {
    id: team.id,
    name: card.name,
    role: team.role,
    specialistLabel: specialist.label,
    roleIcon: specialist.roleIcon,
    variant,
    statusLabel,
    avatarBadgeIcon,
    metrics: buildMetrics(variant, team, card),
    statusMessage: buildStatusMessage(variant, card, districtLabel),
    statusIcon,
    primaryActionLabel: primaryAction.label,
    primaryActionIcon: primaryAction.icon,
  };
}

type BuildTeamDispatchInput = {
  teams: PersonnelTeam[];
  cardViews: PersonnelTeamCardView[];
  districtLabel: string;
};

export function buildTeamDispatchScreenModel(
  input: BuildTeamDispatchInput,
): TeamDispatchScreenModel {
  const cardById = new Map(input.cardViews.map((card) => [card.id, card]));

  const teams = input.teams
    .filter((team) => DISPLAY_ROLE_ORDER.includes(team.role))
    .sort(
      (a, b) =>
        DISPLAY_ROLE_ORDER.indexOf(a.role) - DISPLAY_ROLE_ORDER.indexOf(b.role),
    )
    .map((team) => {
      const card = cardById.get(team.id);
      if (!card) return null;
      return toTeamCardModel(team, card, input.districtLabel);
    })
    .filter((team): team is TeamDispatchTeamCardModel => team != null);

  return {
    title: 'Ekip Yönlendirme',
    subtitle: 'Ekipleri görevlere yönlendir',
    quickAssignTitle: 'Hızlı Atama',
    quickAssignSubtitle: 'En uygun ekibi seçip göreve ata',
    quickAssignRoute: '/events',
    teams,
  };
}
