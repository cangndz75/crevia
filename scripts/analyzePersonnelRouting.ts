/**
 * Geçici analiz — personel rol/competency yönlendirmesi.
 * npx tsx scripts/analyzePersonnelRouting.ts
 */
import { DAY1_EVENT_POOL } from '../src/core/content/day1SeedPool';
import { pilotEvents } from '../src/core/content/pilotEvents';
import {
  inferPersonnelCompetencyForTask,
} from '../src/core/personnel/personnelCompetency';
import {
  buildPersonnelTaskInput,
  calculateTaskSuccessScore,
  getRecommendedPersonnelForTask,
  inferPreferredRole,
  inferTaskDifficulty,
} from '../src/core/personnel/personnelEngine';
import {
  calculatePersonnelMistakeRisk,
  resolveMistakeRiskLevel,
} from '../src/core/personnel/personnelMistakeRisk';
import { selectPersonnelImpactPreviewForDecision } from '../src/core/personnel/personnelPresentation';
import { createInitialPersonnelState } from '../src/core/personnel/personnelSeed';
import type { EventCard, EventDecision } from '../src/core/models/EventCard';

const DEFAULT_RESOURCES = {
  availableStaff: 12,
  availableVehicles: 6,
  overtimeHours: 0,
};

type Row = {
  eventId: string;
  decisionId: string;
  eventTitle: string;
  decisionTitle: string;
  category: string;
  eventType?: string;
  inferredRole: string;
  requiredCompetency: string;
  recommendedTeam: string;
  recommendedRole: string;
  successScore: number;
  mistakeRisk: string;
  previewRisk: string;
  competencyScore: number;
  roleMatch: number;
  suspicious?: string;
};

function allEvents(): EventCard[] {
  const byId = new Map<string, EventCard>();
  for (const e of [...pilotEvents, ...DAY1_EVENT_POOL]) {
    byId.set(e.id, e);
  }
  return [...byId.values()];
}

function expectedTeamForCompetency(c: string): string {
  switch (c) {
    case 'waste_collection':
    case 'market_cleanup':
      return 'Temizlik Ekibi A';
    case 'container_maintenance':
      return 'Bakım Ekibi C';
    case 'route_operation':
      return 'Sürücü Ekibi B';
    case 'complaint_response':
    case 'crisis_coordination':
      return 'Saha Sorumlusu';
    default:
      return '?';
  }
}

function analyzeRow(event: EventCard, decision: EventDecision): Row {
  const state = createInitialPersonnelState();
  const preferredRole = inferPreferredRole(event, decision);
  const districtId = event.neighborhoodId ?? event.district;
  const difficulty = inferTaskDifficulty(event.riskLevel);

  const competencyOnly = inferPersonnelCompetencyForTask({ event, decision });

  const team =
    getRecommendedPersonnelForTask(state, {
      preferredRole,
      districtId,
      difficulty,
    }) ?? null;

  const preview = selectPersonnelImpactPreviewForDecision(
    event,
    decision,
    state,
    1,
    { resources: DEFAULT_RESOURCES },
  );

  let successScore = 0;
  let mistakeRisk = 'n/a';
  let competencyScore = 0;
  let roleMatch = 0;

  if (team) {
    const input = buildPersonnelTaskInput({
      team,
      event,
      decision,
      resources: DEFAULT_RESOURCES,
      equipmentSupportActive: false,
      day: 1,
    });
    successScore = calculateTaskSuccessScore(input);
    const risk = calculatePersonnelMistakeRisk(input, successScore);
    mistakeRisk = resolveMistakeRiskLevel(risk);
    competencyScore = input.competencyScore ?? 0;
    roleMatch = input.roleMatchScore;
  }

  const expected = expectedTeamForCompetency(competencyOnly);
  let suspicious: string | undefined;
  if (team && team.name !== expected && preferredRole !== team.role) {
    suspicious = `competency→${expected}, role→${preferredRole}, got ${team.name}`;
  } else if (team && team.name === 'Saha Sorumlusu' && !['complaint_response', 'crisis_coordination'].includes(competencyOnly)) {
    suspicious = `saha on non-field competency (${competencyOnly})`;
  } else if (competencyOnly === 'crisis_coordination' && !/kriz|sosyal|toplu|gergin|basınç/.test(`${event.title} ${decision.title} ${decision.description}`.toLowerCase())) {
    suspicious = 'crisis via broad keyword (acil/koordinasyon?)';
  } else if (competencyOnly === 'complaint_response' && /temiz|çöp|pazar|topla/.test(`${event.title} ${decision.description}`.toLowerCase()) && !/şikayet|muhtar|vatandaş/.test(`${event.title} ${decision.description}`.toLowerCase())) {
    suspicious = 'complaint on cleaning-like text';
  } else if (competencyOnly === 'container_maintenance' && /taşma|toplam|doluluk/.test(`${event.title} ${decision.description}`.toLowerCase())) {
    suspicious = 'maintenance on overflow/collection text';
  }

  return {
    eventId: event.id,
    decisionId: decision.id,
    eventTitle: event.title.slice(0, 40),
    decisionTitle: decision.title.slice(0, 30),
    category: event.category,
    eventType: event.eventType,
    inferredRole: preferredRole,
    requiredCompetency: competencyOnly,
    recommendedTeam: team?.name ?? '(yok)',
    recommendedRole: team?.role ?? '-',
    successScore,
    mistakeRisk,
    previewRisk: preview.riskLevel,
    competencyScore,
    roleMatch,
    suspicious,
  };
}

function main() {
  const rows: Row[] = [];
  for (const event of allEvents()) {
    for (const decision of event.decisions) {
      rows.push(analyzeRow(event, decision));
    }
  }

  const teamCounts: Record<string, number> = {};
  const roleCounts: Record<string, number> = {};
  const competencyCounts: Record<string, number> = {};
  const inferredRoleCounts: Record<string, number> = {};
  const sahaRows = rows.filter((r) => r.recommendedTeam === 'Saha Sorumlusu');
  const suspicious = rows.filter((r) => r.suspicious);

  for (const r of rows) {
    teamCounts[r.recommendedTeam] = (teamCounts[r.recommendedTeam] ?? 0) + 1;
    roleCounts[r.recommendedRole] = (roleCounts[r.recommendedRole] ?? 0) + 1;
    competencyCounts[r.requiredCompetency] =
      (competencyCounts[r.requiredCompetency] ?? 0) + 1;
    inferredRoleCounts[r.inferredRole] =
      (inferredRoleCounts[r.inferredRole] ?? 0) + 1;
  }

  console.log('=== ÖZET ===');
  console.log('Toplam event/decision:', rows.length);
  console.log('Önerilen ekip:', JSON.stringify(teamCounts, null, 2));
  console.log('Çıkarılan competency:', JSON.stringify(competencyCounts, null, 2));
  console.log('inferPreferredRole:', JSON.stringify(inferredRoleCounts, null, 2));
  console.log('Saha Sorumlusu seçim:', sahaRows.length, `(${((sahaRows.length / rows.length) * 100).toFixed(1)}%)`);
  console.log('Şüpheli:', suspicious.length);

  console.log('\n=== SAHA SORUMLUSU SEÇİMLERİ (competency) ===');
  const sahaByComp = new Map<string, number>();
  for (const r of sahaRows) {
    sahaByComp.set(r.requiredCompetency, (sahaByComp.get(r.requiredCompetency) ?? 0) + 1);
  }
  console.log([...sahaByComp.entries()].map(([k, v]) => `${k}: ${v}`).join(', '));

  console.log('\n=== inferPreferredRole=field_supervisor ===');
  const fsRole = rows.filter((r) => r.inferredRole === 'field_supervisor');
  console.log('count:', fsRole.length);
  for (const r of fsRole.slice(0, 15)) {
    console.log(`  ${r.eventId}/${r.decisionId} → team:${r.recommendedTeam} comp:${r.requiredCompetency}`);
  }

  console.log('\n=== ŞÜPHELİ EŞLEŞMELER ===');
  for (const r of suspicious) {
    console.log(`${r.eventId}\t${r.decisionId}\t${r.requiredCompetency}\t→\t${r.recommendedTeam}\t${r.suspicious}`);
  }

  console.log('\n=== ÖRNEK TABLO (ilk 25) ===');
  console.log(
    ['eventId', 'decisionId', 'inferredRole', 'competency', 'team', 'score', 'risk'].join('\t'),
  );
  for (const r of rows.slice(0, 25)) {
    console.log(
      [
        r.eventId,
        r.decisionId,
        r.inferredRole,
        r.requiredCompetency,
        r.recommendedTeam,
        r.successScore,
        r.previewRisk,
      ].join('\t'),
    );
  }

  // Competency category samples
  const samples: Record<string, Row[]> = {};
  for (const key of [
    'waste_collection',
    'market_cleanup',
    'container_maintenance',
    'route_operation',
    'complaint_response',
    'crisis_coordination',
  ]) {
    samples[key] = rows.filter((r) => r.requiredCompetency === key).slice(0, 5);
  }

  console.log('\n=== COMPETENCY ÖRNEKLERİ (her biri max 5) ===');
  for (const [key, list] of Object.entries(samples)) {
    console.log(`\n-- ${key} --`);
    for (const r of list) {
      console.log(
        `  ${r.eventId}/${r.decisionId} | role:${r.inferredRole} | team:${r.recommendedTeam} | ${r.eventTitle}`,
      );
    }
  }

  // Keyword collision: temizlik -> market_cleanup
  const temizlik = rows.filter((r) => {
    const h = `${r.eventTitle} ${r.decisionTitle}`.toLowerCase();
    return h.includes('temiz') && r.requiredCompetency !== 'market_cleanup' && r.requiredCompetency !== 'waste_collection';
  });
  console.log('\n=== "temiz" geçen ama cleaning competency değil ===', temizlik.length);
  for (const r of temizlik.slice(0, 10)) {
    console.log(`  ${r.eventId} → ${r.requiredCompetency} (${r.recommendedTeam})`);
  }

  // konteyner
  const konteyner = rows.filter((r) => {
    const h = `${r.eventTitle} ${r.decisionTitle}`.toLowerCase();
    return h.includes('konteyner');
  });
  console.log('\n=== "konteyner" geçen ===');
  for (const r of konteyner) {
    console.log(`  ${r.eventId}/${r.decisionId} → comp:${r.requiredCompetency} team:${r.recommendedTeam}`);
  }
}

main();
