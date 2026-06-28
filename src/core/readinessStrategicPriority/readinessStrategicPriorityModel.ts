import type { ReadinessStatus } from '@/core/operationReadiness/operationReadinessTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

import type {
  ReadinessMemoryPresentation,
  ReadinessPriorityCtaActionKey,
  ReadinessPriorityDomain,
  ReadinessRecoveryPresentation,
  ReadinessRiskPresentation,
  ReadinessStrategicDensityBand,
  ReadinessStrategicPriority,
  ReadinessStrategicPriorityInput,
  ReadinessStrategicPriorityResult,
} from './readinessStrategicPriorityTypes';

type PriorityCandidate = {
  domain: ReadinessPriorityDomain;
  severity: number;
  title: string;
  description: string;
  riskLabel: string;
  affectedLabel: string | null;
  actionLabel: string;
  ctaHint: string;
  ctaActionKey: ReadinessPriorityCtaActionKey;
  tone: ReadinessStrategicPriority['tone'];
  recoveryLabel: string | null;
};

const DOMAIN_ORDER: ReadinessPriorityDomain[] = [
  'personnel',
  'vehicle',
  'facility',
  'equipment',
  'budget',
  'ready_positive',
];

function statusSeverity(status: ReadinessStatus): number {
  if (status === 'blocked') return 100;
  if (status === 'strained') return 75;
  if (status === 'limited') return 45;
  if (status === 'unknown') return 20;
  return 0;
}

function resolveDensityBand(day: number): ReadinessStrategicDensityBand {
  return day <= 1 ? 'day1' : 'strategic';
}

function clamp(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function buildPersonnelCandidate(
  status: ReadinessStatus,
  input: ReadinessStrategicPriorityInput,
): PriorityCandidate | null {
  const severity = statusSeverity(status);
  if (severity === 0) return null;

  const opsToday = input.operationsToday ?? 1;
  const secondOpRisk = opsToday >= 2 || input.portfolioConflict;

  return {
    domain: 'personnel',
    severity: severity + (secondOpRisk ? 12 : 0) + (input.memoryStreakDays && input.memoryStreakDays >= 2 ? 8 : 0),
    title: secondOpRisk
      ? 'Ekip yorgunluğu ikinci operasyonu riskli hale getiriyor.'
      : 'Ekip temposu bugünkü müdahaleyi sınırlayabilir.',
    description: secondOpRisk
      ? 'Yorgunluk birikimi saha süresini uzatabilir.'
      : 'Ekip hazırlığı plan seçiminde belirleyici olabilir.',
    riskLabel: status === 'blocked' ? 'Ekip riski' : 'Yorgunluk riski',
    affectedLabel: input.operationTitle
      ? clamp(input.operationTitle, 28)
      : secondOpRisk
        ? 'İkinci operasyon'
        : 'Saha müdahalesi',
    actionLabel: secondOpRisk ? 'Ekibi değiştir' : 'Planı yumuşat',
    ctaHint: secondOpRisk ? 'Ekibi Değiştir' : 'Planı Yumuşat',
    ctaActionKey: secondOpRisk ? 'swap_team' : 'soften_plan',
    tone: status === 'blocked' ? 'critical' : 'warning',
    recoveryLabel: 'Doğru ekip eşleşmesi yorgunluğu yavaşlatır.',
  };
}

function buildVehicleCandidate(
  status: ReadinessStatus,
  input: ReadinessStrategicPriorityInput,
): PriorityCandidate | null {
  const severity = statusSeverity(status);
  if (severity === 0) return null;

  const rapidPlan = input.planStrategyId === 'rapid_response';
  return {
    domain: 'vehicle',
    severity: severity + (rapidPlan ? 15 : 0),
    title: 'Araç hazırlığı hızlı müdahaleyi sınırlıyor.',
    description: rapidPlan
      ? 'Seçilen plan rota baskısını artırabilir.'
      : 'Araç bakım eksiği saha süresini uzatabilir.',
    riskLabel: 'Araç riski',
    affectedLabel: rapidPlan ? 'Hızlı müdahale' : 'Rota akışı',
    actionLabel: 'Bakımı kontrol et',
    ctaHint: 'Bakımı Kontrol Et',
    ctaActionKey: 'check_maintenance',
    tone: status === 'blocked' ? 'critical' : 'warning',
    recoveryLabel: 'Bakım tamamlanırsa rota riski düşer.',
  };
}

function buildFacilityCandidate(status: ReadinessStatus): PriorityCandidate | null {
  const severity = statusSeverity(status);
  if (severity === 0) return null;

  return {
    domain: 'facility',
    severity: severity + 5,
    title: 'Konteyner bakım eksiği mahalle şikayetini tekrar büyütebilir.',
    description: 'Altyapı baskısı önleyici planı daha değerli kılar.',
    riskLabel: 'Altyapı riski',
    affectedLabel: 'Mahalle şikayeti',
    actionLabel: 'Bakımı kontrol et',
    ctaHint: 'Bakımı Kontrol Et',
    ctaActionKey: 'check_maintenance',
    tone: status === 'blocked' ? 'critical' : 'warning',
    recoveryLabel: 'Konteyner bakımı sosyal baskıyı yumuşatır.',
  };
}

function buildEquipmentCandidate(status: ReadinessStatus): PriorityCandidate | null {
  const severity = statusSeverity(status);
  if (severity === 0) return null;

  return {
    domain: 'equipment',
    severity,
    title: 'Ekipman yıpranması müdahale süresini uzatabilir.',
    description: 'Saha ekipmanı kontrolü bugünkü planı etkileyebilir.',
    riskLabel: 'Ekipman riski',
    affectedLabel: 'Müdahale süresi',
    actionLabel: 'Bakımı kontrol et',
    ctaHint: 'Bakımı Kontrol Et',
    ctaActionKey: 'check_maintenance',
    tone: 'warning',
    recoveryLabel: 'Ekipman bakımı saha verimini toparlar.',
  };
}

function buildBudgetCandidate(
  status: ReadinessStatus,
  input: ReadinessStrategicPriorityInput,
): PriorityCandidate | null {
  const severity = statusSeverity(status);
  if (severity === 0) return null;

  const costlyPlan = input.planStrategyId === 'long_term_fix';
  return {
    domain: 'budget',
    severity: severity + (costlyPlan ? 10 : 0),
    title: 'Kaynak baskısı plan maliyetini zorlaştırıyor.',
    description: costlyPlan
      ? 'Önleyici plan bugün kaynak tüketimini artırır.'
      : 'Kaynak koruyucu plan daha güvenli olabilir.',
    riskLabel: 'Kaynak riski',
    affectedLabel: costlyPlan ? 'Önleyici plan' : 'Günlük kapasite',
    actionLabel: 'Planı yumuşat',
    ctaHint: 'Planı Yumuşat',
    ctaActionKey: 'soften_plan',
    tone: 'warning',
    recoveryLabel: 'Kaynak dengesi yarın kapasiteyi korur.',
  };
}

function buildReadyPositiveCandidate(input: ReadinessStrategicPriorityInput): PriorityCandidate {
  const socialFocus = input.socialPressure ?? false;
  return {
    domain: 'ready_positive',
    severity: 10,
    title: socialFocus
      ? 'Hazırlık iyi; bugün sosyal baskıya odaklanabilirsin.'
      : 'Hazırlık iyi; operasyon güvenle ilerleyebilir.',
    description: socialFocus
      ? 'Ekip ve araç dengede; mahalle tepkisini yönetmek öncelikli.'
      : 'Kaynak ve ekip dengede; plan seçiminde esneksin.',
    riskLabel: 'Düşük risk',
    affectedLabel: socialFocus ? 'Sosyal baskı' : null,
    actionLabel: 'Operasyona devam',
    ctaHint: 'Operasyona Devam',
    ctaActionKey: 'proceed',
    tone: 'positive',
    recoveryLabel: null,
  };
}

function buildDay1Candidate(): PriorityCandidate {
  return {
    domain: 'ready_positive',
    severity: 50,
    title: 'Hazırlık iyi seçilirse operasyon daha güvenli ilerler.',
    description: 'Ekip ve kaynak dengesini koruyarak başla.',
    riskLabel: 'İlk gün',
    affectedLabel: null,
    actionLabel: 'Planı seç',
    ctaHint: 'Planı Seç',
    ctaActionKey: 'proceed',
    tone: 'neutral',
    recoveryLabel: null,
  };
}

function boostFromMaintenance(
  domain: ReadinessPriorityDomain,
  input: ReadinessStrategicPriorityInput,
): number {
  let boost = 0;
  const backlog = input.maintenanceBacklog;
  const domainKey = domain as string;
  if (backlog?.topItem && String(backlog.topItem.domain) === domainKey) {
    boost += backlog.topItem.severity === 'critical' ? 20 : 10;
  }
  const runtimeItems = input.maintenanceRuntime?.items ?? [];
  for (const item of runtimeItems) {
    if (String(item.domain) === domainKey && item.status !== 'resolved') {
      boost += item.severity === 'critical' ? 15 : item.severity === 'strained' ? 8 : 4;
      if ((item.carryOverDays ?? 0) >= 2) boost += 6;
    }
  }
  return boost;
}

function collectCandidates(input: ReadinessStrategicPriorityInput): PriorityCandidate[] {
  const signals = input.readinessSnapshot.signals;
  const byDomain = new Map(signals.map((s) => [s.domain, s.status]));

  const candidates: PriorityCandidate[] = [];

  const personnel = buildPersonnelCandidate(byDomain.get('personnel') ?? 'ready', input);
  if (personnel) candidates.push({ ...personnel, severity: personnel.severity + boostFromMaintenance('personnel', input) });

  const vehicle = buildVehicleCandidate(byDomain.get('vehicle') ?? 'ready', input);
  if (vehicle) candidates.push({ ...vehicle, severity: vehicle.severity + boostFromMaintenance('vehicle', input) });

  const facility = buildFacilityCandidate(byDomain.get('facility') ?? 'ready');
  if (facility) candidates.push({ ...facility, severity: facility.severity + boostFromMaintenance('facility', input) });

  const equipment = buildEquipmentCandidate(byDomain.get('equipment') ?? 'ready');
  if (equipment) candidates.push({ ...equipment, severity: equipment.severity + boostFromMaintenance('equipment', input) });

  const budget = buildBudgetCandidate(byDomain.get('budget') ?? 'ready', input);
  if (budget) candidates.push({ ...budget, severity: budget.severity + boostFromMaintenance('budget', input) });

  if (candidates.length === 0) {
    candidates.push(buildReadyPositiveCandidate(input));
  }

  return candidates;
}

function pickPrimaryCandidate(candidates: PriorityCandidate[]): PriorityCandidate {
  const sorted = [...candidates].sort((a, b) => {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain);
  });
  return sorted[0]!;
}

function buildMemory(
  candidate: PriorityCandidate,
  input: ReadinessStrategicPriorityInput,
  densityBand: ReadinessStrategicDensityBand,
): ReadinessMemoryPresentation {
  if (densityBand === 'day1') return null;

  const streak = input.memoryStreakDays ?? 0;
  if (candidate.domain === 'personnel' && streak >= 2) {
    return { label: 'Ekip yorgunluğu iki gündür birikiyor.' };
  }
  if (candidate.domain === 'vehicle' || candidate.domain === 'facility') {
    const runtimeItems = input.maintenanceRuntime?.items ?? [];
    const carried = runtimeItems.some((i) => (i.carryOverDays ?? 0) >= 2 && i.status !== 'resolved');
    if (carried) {
      return { label: 'Bakım gecikmesi şehir hafızasına risk olarak işlendi.' };
    }
  }
  if (candidate.domain === 'ready_positive' && input.readinessSnapshot.overallStatus === 'ready') {
    return { label: 'Hazırlık toparlandı, yarın saha riski düşüyor.' };
  }
  return null;
}

function toPriority(candidate: PriorityCandidate, day: number): ReadinessStrategicPriority {
  const id = `readiness_priority_${candidate.domain}_d${day}`;
  return {
    id,
    domain: candidate.domain,
    title: clamp(candidate.title, 88),
    description: clamp(candidate.description, 96),
    riskChip: { id: `${id}_risk`, label: candidate.riskLabel, tone: candidate.tone === 'positive' ? 'teal' : candidate.tone === 'critical' ? 'critical' : 'warning' },
    affectedOperationChip: candidate.affectedLabel
      ? { id: `${id}_op`, label: candidate.affectedLabel, tone: 'neutral' }
      : null,
    recommendedActionChip: {
      id: `${id}_action`,
      label: candidate.actionLabel,
      tone: candidate.tone === 'positive' ? 'positive' : 'teal',
    },
    ctaHint: candidate.ctaHint,
    ctaActionKey: candidate.ctaActionKey,
    tone: candidate.tone,
    severity: candidate.severity,
  };
}

export function buildReadinessStrategicPriority(
  input: ReadinessStrategicPriorityInput,
): ReadinessStrategicPriorityResult {
  const densityBand = resolveDensityBand(input.day);

  if (densityBand === 'day1') {
    const day1Candidate = buildDay1Candidate();
    const priority = toPriority(day1Candidate, input.day);
    return {
      densityBand,
      priority,
      risk: { label: day1Candidate.riskLabel, tone: 'neutral' },
      recovery: null,
      memory: null,
    };
  }

  const candidates = collectCandidates(input);
  const primary = pickPrimaryCandidate(candidates);
  const priority = toPriority(primary, input.day);

  const risk: ReadinessRiskPresentation = {
    label: primary.riskLabel,
    tone: priority.tone === 'positive' ? 'teal' : priority.tone === 'critical' ? 'critical' : 'warning',
  };

  const recovery: ReadinessRecoveryPresentation = primary.recoveryLabel
    ? { label: clamp(primary.recoveryLabel, 72), tone: 'teal' }
    : null;

  const memory = buildMemory(primary, input, densityBand);

  return { densityBand, priority, risk, recovery, memory };
}

export function scorePlanStrategyReadinessFit(
  strategyId: EventPlanStrategyId,
  input: ReadinessStrategicPriorityInput,
): { score: number; risky: boolean } {
  const result = buildReadinessStrategicPriority(input);
  const domain = result.priority.domain;
  let score = 55;
  let risky = false;

  switch (strategyId) {
    case 'rapid_response':
      if (domain === 'vehicle' || domain === 'personnel') {
        score -= 22;
        risky = true;
      } else if (domain === 'ready_positive') {
        score += 18;
      }
      break;
    case 'balanced_plan':
      if (domain === 'budget') score += 12;
      if (domain === 'ready_positive') score += 10;
      break;
    case 'long_term_fix':
      if (domain === 'facility' || domain === 'equipment') {
        score += 20;
      } else if (domain === 'budget') {
        score -= 14;
        risky = true;
      }
      break;
    default:
      break;
  }

  if (input.readinessSnapshot.overallStatus === 'blocked') {
    score -= 30;
    risky = true;
  } else if (input.readinessSnapshot.overallStatus === 'strained') {
    score -= 12;
    if (strategyId === 'rapid_response') risky = true;
  }

  return { score: Math.max(0, Math.min(100, score)), risky };
}
