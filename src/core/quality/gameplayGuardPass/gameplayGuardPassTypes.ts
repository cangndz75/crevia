export type GameplayGuardPassRule = {
  id: string;
  title: string;
  description: string;
};

export type GameplayGuardPassQualityCriterion = {
  id: string;
  title: string;
  description: string;
};

export type GameplayGuardPassPriorityPass = {
  order: number;
  id: string;
  title: string;
  verifyScripts: readonly string[];
  targetDirs: readonly string[];
  primaryFiles: readonly string[];
  status: 'ready' | 'pending';
};

export type GameplayGuardPassReportSection = {
  order: number;
  id: string;
  title: string;
};
