import type {
  OperationSignalDomain,
  OperationSignalsState,
} from '@/core/operations/operationSignalTypes';

export type AdvisorLevel = 1 | 2 | 3;

export type AdvisorInsightType =
  | 'daily_summary'
  | 'event_plan_hint'
  | 'assignment_hint'
  | 'end_day_comment';

export type AdvisorId = 'ece_operations_assistant';

export type AdvisorReliabilityBand =
  | 'early_observation'
  | 'developing'
  | 'reliable'
  | 'expert';

export type AdvisorClarityLabel =
  | 'Ön gözlem'
  | 'Gelişen analiz'
  | 'Güvenilir okuma'
  | 'Uzman değerlendirme';

export type AdvisorDomain =
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts'
  | 'social'
  | 'crisis';

export type AdvisorDomainLearning = {
  personnel: number;
  vehicles: number;
  containers: number;
  districts: number;
  social: number;
  crisis: number;
};

export type AdvisorMissedSignal = {
  id: string;
  day: number;
  acknowledgedDay?: number;
  domain: AdvisorDomain;
  previousStatus: string;
  currentStatus: string;
  message: string;
  acknowledged: boolean;
};

export type AdvisorPredictionConfidence = 'low' | 'medium' | 'high';

export type AdvisorPrediction = {
  id: string;
  day: number;
  domain: AdvisorDomain;
  predictedStatus: string;
  confidence: AdvisorPredictionConfidence;
  sourceSignalScore: number;
  relatedDistrictId?: string;
  resolved?: boolean;
};

export type AdvisorState = {
  advisorId: AdvisorId;
  level: AdvisorLevel;
  experience: number;
  dailyUsesRemaining: number;
  lastRefreshedDay: number;
  totalSuccessfulHints: number;
  lastExperienceGrantDay?: number;
  reliabilityScore: number;
  reliabilityBand: AdvisorReliabilityBand;
  domainLearning: AdvisorDomainLearning;
  lastMissedSignal?: AdvisorMissedSignal;
  pendingPredictions: AdvisorPrediction[];
  acknowledgedMissCount: number;
  /** Aynı günde prediction değerlendirmesi tekrarlanmasın */
  lastPredictionEvaluatedDay?: number;
};

export type AdvisorInsightTone = 'neutral' | 'positive' | 'warning';

export type AdvisorInsight = {
  id: string;
  type: AdvisorInsightType;
  title: string;
  body: string;
  tone: AdvisorInsightTone;
  confidenceLabel: string;
  sourceTags: string[];
};

export type AdvisorPresentationModel = {
  advisorName: string;
  roleLabel: string;
  levelLabel: string;
  clarityLabel: string;
  progressLabel: string;
  progressRatio: number;
  usesLabel: string;
  primaryInsight?: AdvisorInsight;
  secondaryInsights: AdvisorInsight[];
  ctaLabel: string;
  limitedSignalFooter?: string;
};

export type AdvisorMissedSignalPresentation = {
  title: string;
  body: string;
  footer: string;
  showCta: boolean;
  ctaLabel: string;
};

export type AdvisorEngineContext = {
  gameState: import('@/core/models/GameState').GameState;
  advisorState?: AdvisorState;
  personnelState?: import('@/core/personnel/personnelTypes').PersonnelState;
  vehicleState?: import('@/core/vehicles/vehicleTypes').VehicleState;
  containerState?: import('@/core/containers/containerTypes').ContainerState;
  operationSignals?: OperationSignalsState;
  dailyOperationsPlan?: import('@/core/dailyPlanning/dailyPlanningTypes').DailyOperationsPlanState;
  isDay1Tutorial?: boolean;
  postPilotLightPhase?: boolean;
  mainOperationAdvisorNote?: string | null;
};

export type OperationDomainForAdvisor = OperationSignalDomain;
