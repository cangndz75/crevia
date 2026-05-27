/** XP kazanım kategorileri — tek ana ilerleme puanının şeffaf dökümü için. */
export type XpCategory =
  | 'event'
  | 'daily_goal'
  | 'risk'
  | 'efficiency'
  | 'district'
  | 'butterfly'
  | 'tutorial';

export type XpSourceType = 'event' | 'goal' | 'decision' | 'butterfly' | 'tutorial';

/** Olay zorluğu / severity — EventCard.riskLevel ile uyumlu. */
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Mahalle özel bonusu için XP bölge tipi (çarpan değil, şart bazlı bonus). */
export type XpDistrictType =
  | 'merkez'
  | 'pazar'
  | 'sanayi'
  | 'yesilpark'
  | 'istasyon'
  | 'cumhuriyet';

export type XpTransaction = {
  id: string;
  day: number;
  amount: number;
  category: XpCategory;
  sourceId?: string;
  sourceType?: XpSourceType;
  title: string;
  description?: string;
  createdAt: string;
};

export type CreateXpTransactionInput = Omit<XpTransaction, 'id' | 'createdAt'>;

export type PlayerProgress = {
  totalXp: number;
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  unlockedAuthorities: string[];
  xpHistory: XpTransaction[];
};

export type XpBreakdownItem = {
  category: XpCategory;
  amount: number;
  title: string;
  description?: string;
};

export type XpBreakdown = {
  total: number;
  items: XpBreakdownItem[];
};

export type LevelThreshold = {
  level: number;
  requiredTotalXp: number;
};

export type LevelProgress = {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  progressRatio: number;
};

export type ApplyXpTransactionsResult = {
  progress: PlayerProgress;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
};

export type DistrictBonusFlags = {
  resolvedQuickly?: boolean;
  socialRiskPrevented?: boolean;
  trafficReduced?: boolean;
  vehicleBreakdownPrevented?: boolean;
  publicTrustProtected?: boolean;
  crowdControlled?: boolean;
  parkOrderProtected?: boolean;
};

export type DistrictBonusResult = {
  total: number;
  items: XpBreakdownItem[];
};

export type EfficiencyBonusInput = {
  budgetSpent: number;
  expectedBudget: number;
  staffFatigueDelta: number;
  vehicleConditionDelta?: number;
};

export type QualityBonusInput = {
  satisfactionDelta: number;
  riskDelta: number;
};

export type DistrictBonusInput = {
  districtId?: string;
  districtType?: XpDistrictType;
  flags: DistrictBonusFlags;
};

export type EventXpBreakdownInput = {
  day: number;
  eventId: string;
  eventTitle: string;
  severity: EventSeverity;
  districtId?: string;
  districtType?: XpDistrictType;
  satisfactionDelta: number;
  riskDelta: number;
  budgetSpent: number;
  expectedBudget: number;
  staffFatigueDelta: number;
  vehicleConditionDelta?: number;
  districtBonusFlags: DistrictBonusFlags;
  dailyGoalCompleted?: boolean;
  butterflyPositive?: boolean;
  tutorialBonus?: boolean;
};
