import {
  getAllRoadmapNodes,
  PROGRESSION_BRANCHES,
  type ProgressionBranch,
  type ProgressionNode,
} from '@/core/content/progressionRoadmap';

export type NodeDisplayStatus = 'unlocked' | 'next' | 'locked' | 'comingSoon';

export type DerivedProgressionNode = ProgressionNode & {
  status: NodeDisplayStatus;
  remainingXp: number;
  progressToUnlock: number;
};

export type DerivedProgressionBranch = Omit<ProgressionBranch, 'nodes'> & {
  nodes: DerivedProgressionNode[];
};

export type ProgressionDerivedState = {
  branches: DerivedProgressionBranch[];
  nextNode: DerivedProgressionNode | null;
  unlockedFeatureNodes: DerivedProgressionNode[];
  milestoneUnlockedCount: number;
  milestoneTotal: number;
};

function findNextNodeId(xp: number, nodes: ProgressionNode[]): string | null {
  const next = nodes
    .filter((n) => n.statusHint !== 'comingSoon' && xp < n.requiredXp)
    .sort((a, b) => a.requiredXp - b.requiredXp)[0];
  return next?.id ?? null;
}

function resolveNodeStatus(
  node: ProgressionNode,
  xp: number,
  nextNodeId: string | null,
): NodeDisplayStatus {
  if (node.statusHint === 'comingSoon') {
    return 'comingSoon';
  }
  if (xp >= node.requiredXp) {
    return 'unlocked';
  }
  if (node.id === nextNodeId) {
    return 'next';
  }
  return 'locked';
}

function deriveNode(
  node: ProgressionNode,
  xp: number,
  nextNodeId: string | null,
): DerivedProgressionNode {
  const status = resolveNodeStatus(node, xp, nextNodeId);
  const remainingXp = Math.max(0, node.requiredXp - xp);
  const progressToUnlock =
    node.requiredXp <= 0 ? 1 : Math.min(1, xp / node.requiredXp);

  return {
    ...node,
    status,
    remainingXp,
    progressToUnlock,
  };
}

export function deriveProgressionState(xp: number): ProgressionDerivedState {
  const allNodes = getAllRoadmapNodes();
  const nextNodeId = findNextNodeId(xp, allNodes);

  const branches: DerivedProgressionBranch[] = PROGRESSION_BRANCHES.map(
    (branch) => ({
      ...branch,
      nodes: branch.nodes.map((node) => deriveNode(node, xp, nextNodeId)),
    }),
  );

  const allDerived = branches.flatMap((b) => b.nodes);

  const nextNode =
    allDerived.find((n) => n.status === 'next') ??
    allDerived.find((n) => n.id === nextNodeId) ??
    null;

  const milestoneNodes = allDerived.filter((n) => n.featureKey);
  const milestoneUnlockedCount = milestoneNodes.filter(
    (n) => n.status === 'unlocked',
  ).length;

  const unlockedFeatureNodes = allDerived.filter(
    (n) =>
      n.status === 'unlocked' &&
      n.featureKey != null &&
      n.requiredXp > 0,
  );

  return {
    branches,
    nextNode,
    unlockedFeatureNodes,
    milestoneUnlockedCount,
    milestoneTotal: milestoneNodes.length,
  };
}

export const NODE_STATUS_LABELS: Record<NodeDisplayStatus, string> = {
  unlocked: 'Açık',
  next: 'Sıradaki',
  locked: 'Kilitli',
  comingSoon: 'Yakında',
};
