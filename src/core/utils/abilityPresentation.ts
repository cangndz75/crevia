import Ionicons from '@expo/vector-icons/Ionicons';

import { Ability, AbilityIcon, AbilityStatus } from '@/core/models/Ability';
import { colors } from '@/ui/theme/colors';

const iconMap: Record<AbilityIcon, keyof typeof Ionicons.glyphMap> = {
  cleaning: 'brush-outline',
  route: 'git-branch-outline',
  people: 'person-add-outline',
  vehicle: 'bus-outline',
  megaphone: 'megaphone-outline',
  park: 'leaf-outline',
  works: 'construct-outline',
  shield: 'shield-outline',
  transport: 'subway-outline',
};

export function getAbilityIcon(icon: AbilityIcon) {
  return iconMap[icon];
}

export function getAbilityNodeColors(
  status: AbilityStatus,
  selected: boolean,
) {
  if (status === 'locked') {
    return {
      bg: colors.background,
      border: colors.border,
      icon: colors.textSecondary,
      dashed: true,
    };
  }
  if (selected) {
    return {
      bg: colors.abilityGoldMuted,
      border: colors.abilityGold,
      icon: colors.abilityGold,
      dashed: false,
    };
  }
  if (status === 'maxed') {
    return {
      bg: colors.primaryMuted,
      border: colors.primary,
      icon: colors.primary,
      dashed: false,
    };
  }
  return {
    bg: colors.primaryMuted,
    border: colors.primary,
    icon: colors.primary,
    dashed: false,
  };
}

export function buildAbilityLevels(abilities: Ability[]): Ability[][] {
  const levels: Ability[][] = [];
  let currentParentIds: (string | null)[] = [null];

  while (currentParentIds.length > 0) {
    const levelNodes = abilities.filter((a) =>
      currentParentIds.includes(a.parentId),
    );
    if (levelNodes.length === 0) break;
    levels.push(levelNodes);
    currentParentIds = levelNodes.map((n) => n.id);
  }

  return levels;
}

export function canUpgradeAbility(ability: Ability, authorityPoints: number) {
  return (
    ability.status !== 'locked' &&
    ability.level < ability.maxLevel &&
    authorityPoints >= ability.upgradeCostXp
  );
}
