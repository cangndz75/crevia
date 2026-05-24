export type AbilityStatus = 'locked' | 'unlocked' | 'maxed';

export type AbilityIcon =
  | 'cleaning'
  | 'route'
  | 'people'
  | 'vehicle'
  | 'megaphone'
  | 'park'
  | 'works'
  | 'shield'
  | 'transport';

export type Ability = {
  id: string;
  title: string;
  description: string;
  parentId: string | null;
  status: AbilityStatus;
  level: number;
  maxLevel: number;
  upgradeCostXp: number;
  icon: AbilityIcon;
};
