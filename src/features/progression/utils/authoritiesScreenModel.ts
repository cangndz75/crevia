import {
  AUTHORITY_GRID_DEFINITIONS,
  BADGE_COLLECTION_TOTAL,
  STATUS_LABELS,
  WEEKLY_UNLOCK_DEFINITIONS,
  type AuthorityDisplayStatus,
  type AuthorityTheme,
} from '@/features/progression/content/authoritiesDisplay';
import {
  deriveProgressionState,
  type DerivedProgressionNode,
} from '@/features/progression/utils/progressionDerived';
import type { ProgressionIconName } from '@/core/content/progressionRoadmap';

export type AuthorityGridItem = {
  id: string;
  title: string;
  status: AuthorityDisplayStatus;
  statusLabel: string;
  theme: AuthorityTheme;
  icon: ProgressionIconName;
  progressPercent: number;
};

export type WeeklyUnlockItem = {
  id: string;
  title: string;
  description: string;
  theme: AuthorityTheme;
  icon: ProgressionIconName;
  percentLabel: string;
  progress: number;
};

export type AuthoritiesScreenModel = {
  collectionCollected: number;
  collectionTotal: number;
  collectionProgress: number;
  daysLeftThisWeek: number;
  gridItems: AuthorityGridItem[];
  weeklyItems: WeeklyUnlockItem[];
  badgeTabItems: AuthorityGridItem[];
};

function findNode(
  nodes: DerivedProgressionNode[],
  nodeId: string,
): DerivedProgressionNode | undefined {
  return nodes.find((n) => n.id === nodeId);
}

function mapNodeToAuthorityStatus(
  node: DerivedProgressionNode | undefined,
): AuthorityDisplayStatus {
  if (!node) return 'locked';
  if (node.status === 'unlocked') return 'active';
  if (node.status === 'comingSoon' || node.status === 'next') return 'soon';
  return 'locked';
}

function mapNodeToGridItem(
  def: (typeof AUTHORITY_GRID_DEFINITIONS)[number],
  node: DerivedProgressionNode | undefined,
): AuthorityGridItem {
  const status = mapNodeToAuthorityStatus(node);
  const progressPercent = node
    ? Math.round(node.progressToUnlock * 100)
    : 0;

  return {
    id: def.id,
    title: def.title,
    status,
    statusLabel: STATUS_LABELS[status],
    theme: def.theme,
    icon: def.icon,
    progressPercent,
  };
}

export function deriveAuthoritiesScreenModel(
  xp: number,
  pilotDay = 1,
): AuthoritiesScreenModel {
  const derived = deriveProgressionState(xp);
  const allNodes = derived.branches.flatMap((b) => b.nodes);

  const gridItems = AUTHORITY_GRID_DEFINITIONS.map((def) =>
    mapNodeToGridItem(def, findNode(allNodes, def.nodeId)),
  );

  const weeklyItems: WeeklyUnlockItem[] = WEEKLY_UNLOCK_DEFINITIONS.map(
    (def) => {
      const node = findNode(allNodes, def.nodeId);
      const progress = node?.progressToUnlock ?? 0;
      const percent = Math.max(5, Math.round(progress * 100));
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        theme: def.theme,
        icon: def.icon,
        percentLabel: `%${Math.min(99, percent)}`,
        progress,
      };
    },
  );

  const activeCount = gridItems.filter((i) => i.status === 'active').length;
  const soonCount = gridItems.filter((i) => i.status === 'soon').length;
  const collectionCollected = Math.min(
    BADGE_COLLECTION_TOTAL,
    activeCount * 2 + soonCount + derived.milestoneUnlockedCount,
  );

  const daysLeftThisWeek = Math.max(1, 7 - pilotDay);

  return {
    collectionCollected,
    collectionTotal: BADGE_COLLECTION_TOTAL,
    collectionProgress: collectionCollected / BADGE_COLLECTION_TOTAL,
    daysLeftThisWeek,
    gridItems,
    weeklyItems,
    badgeTabItems: gridItems,
  };
}
