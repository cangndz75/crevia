import { getAnalyticsEventDefinition } from './analyticsSchema';
import type {
  AnalyticsAuditFinding,
  AnalyticsAuditResult,
  AnalyticsEventName,
  AnalyticsFunnelDefinition,
  AnalyticsFunnelId,
} from './analyticsTypes';

export const ANALYTICS_FUNNEL_DEFINITIONS: AnalyticsFunnelDefinition[] = [
  {
    id: 'first_session',
    title: 'İlk Oturum',
    description:
      'Gün 1 ilk 10 dakika: rehber, plan, olay, atama, saha ve rapor dönüşü.',
    orderedEvents: [
      'app_opened',
      'session_started',
      'day_started',
      'first_guide_seen',
      'advisor_hint_requested',
      'daily_plan_confirmed',
      'first_event_opened',
      'decision_selected',
      'assignment_confirmed',
      'field_phase_started',
      'event_completed',
      'report_opened',
      'hub_returned',
    ],
    successEvent: 'hub_returned',
    dropoffRisks: [
      'Plan onayı öncesi çıkış',
      'Atama panelinde tereddüt',
      'Rapor açılmadan hub dönüşü',
    ],
  },
  {
    id: 'pilot_completion',
    title: 'Pilot Kapanışı',
    description: 'Gün 7 rapor ve pilot tamamlanma kartı.',
    orderedEvents: [
      'day7_report_opened',
      'pilot_completion_seen',
      'post_pilot_offer_opened',
    ],
    successEvent: 'post_pilot_offer_opened',
    dropoffRisks: ['Gün 7 raporu atlanması', 'Tamamlanma kartı görülmeden çıkış'],
  },
  {
    id: 'post_pilot_offer',
    title: 'Post-Pilot Teklif',
    description: 'Limited vs full erişim seçimi.',
    orderedEvents: [
      'post_pilot_offer_opened',
      'post_pilot_offer_primary_cta_pressed',
      'limited_continue_selected',
      'main_operation_mock_purchase_started',
      'main_operation_mock_purchase_completed',
    ],
    successEvent: 'main_operation_mock_purchase_completed',
    dropoffRisks: [
      'Teklif ekranında tereddüt',
      'Sınırlı gündem seçimi',
      'Mock satın alma yarım kalması',
    ],
  },
  {
    id: 'limited_operation',
    title: 'Sınırlı Operasyon',
    description: 'Limited gündem kullanımı (hafif operasyon).',
    orderedEvents: [
      'limited_continue_selected',
      'main_operation_day_started',
      'daily_plan_confirmed',
      'report_opened',
    ],
    successEvent: 'report_opened',
    dropoffRisks: ['Limited kapsamın yetersiz hissi', 'Full teklife dönüş'],
  },
  {
    id: 'full_main_operation',
    title: 'Tam Ana Operasyon',
    description: 'Early operation benchmark window içindeki tam operasyon döngüsü.',
    orderedEvents: [
      'main_operation_day_started',
      'season_goal_card_seen',
      'operational_resources_card_seen',
      'micro_decision_seen',
      'crisis_desk_seen',
      'report_main_operation_seen',
      'season_end_seen',
    ],
    successEvent: 'season_end_seen',
    dropoffRisks: [
      'Sezon hedefleri görülmeden çıkış',
      'Kriz masası kullanılmadan gün bitirme',
      'Dönemsel operasyon değerlendirmesi atlanması',
    ],
  },
  {
    id: 'crisis_management',
    title: 'Kriz Yönetimi',
    description: 'Kriz masası ve hamle seçimi.',
    orderedEvents: [
      'crisis_desk_seen',
      'crisis_action_sheet_opened',
      'crisis_action_selected',
      'crisis_action_processed',
      'report_crisis_seen',
    ],
    successEvent: 'crisis_action_processed',
    dropoffRisks: [
      'Kriz masası görülüp hamle seçilmemesi',
      'Hamle seçilip gün sonu işlenmemesi',
    ],
  },
  {
    id: 'operational_resources',
    title: 'Saha Kaynakları',
    description: 'Kaynak kartı, detay sheet ve harita overlay.',
    orderedEvents: [
      'operational_resources_card_seen',
      'operational_resources_detail_opened',
      'map_resource_overlay_seen',
      'report_resources_seen',
    ],
    successEvent: 'report_resources_seen',
    dropoffRisks: [
      'Kart görülüp detay açılmaması',
      'Harita overlay kullanılmaması',
    ],
  },
  {
    id: 'season_end',
    title: 'Dönemsel Operasyon Değerlendirmesi',
    description: 'Operasyon dönemi değerlendirme kartı ve detay.',
    orderedEvents: [
      'report_season_end_seen',
      'season_end_seen',
      'season_end_detail_opened',
    ],
    successEvent: 'season_end_detail_opened',
    dropoffRisks: ['Dönemsel değerlendirme kartı görülüp detay açılmaması'],
  },
  {
    id: 'retention',
    title: 'Gün İçi Tutma',
    description: 'Tekrarlayan günlük döngü metrikleri.',
    orderedEvents: [
      'day_started',
      'daily_plan_confirmed',
      'event_completed',
      'report_opened',
      'hub_returned',
    ],
    successEvent: 'hub_returned',
    dropoffRisks: ['Plan onayı olmadan gün bitirme', 'Rapor atlanması'],
  },
];

const FUNNEL_BY_ID = new Map<AnalyticsFunnelId, AnalyticsFunnelDefinition>(
  ANALYTICS_FUNNEL_DEFINITIONS.map((f) => [f.id, f]),
);

export function getAnalyticsFunnelDefinition(
  id: AnalyticsFunnelId,
): AnalyticsFunnelDefinition | undefined {
  return FUNNEL_BY_ID.get(id);
}

export function getEventsForFunnel(id: AnalyticsFunnelId): AnalyticsEventName[] {
  return getAnalyticsFunnelDefinition(id)?.orderedEvents ?? [];
}

export function validateAnalyticsFunnels(): AnalyticsAuditResult {
  const findings: AnalyticsAuditFinding[] = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  const push = (
    id: string,
    severity: AnalyticsAuditFinding['severity'],
    message: string,
    recommendation: string,
  ) => {
    findings.push({ id, severity, message, recommendation });
    if (severity === 'pass') passCount += 1;
    else if (severity === 'warn') warnCount += 1;
    else failCount += 1;
  };

  for (const funnel of ANALYTICS_FUNNEL_DEFINITIONS) {
    if (!funnel.orderedEvents.includes(funnel.successEvent)) {
      push(
        `funnel_success_${funnel.id}`,
        'fail',
        `${funnel.id} successEvent not in orderedEvents`,
        'Add successEvent to orderedEvents',
      );
    } else {
      push(
        `funnel_success_${funnel.id}`,
        'pass',
        `${funnel.id} successEvent in funnel`,
        'Keep funnel order updated',
      );
    }

    if (funnel.dropoffRisks.length === 0) {
      push(
        `funnel_dropoff_${funnel.id}`,
        'warn',
        `${funnel.id} has no dropoff risks`,
        'Document drop-off hypotheses',
      );
    }

    for (const eventName of funnel.orderedEvents) {
      const def = getAnalyticsEventDefinition(eventName);
      if (!def) {
        push(
          `funnel_event_${funnel.id}_${eventName}`,
          'fail',
          `Unknown event ${eventName} in funnel ${funnel.id}`,
          'Register event in schema',
        );
      } else if (!def.funnelIds.includes(funnel.id)) {
        push(
          `funnel_link_${funnel.id}_${eventName}`,
          'warn',
          `${eventName} not linked to funnel ${funnel.id}`,
          'Add funnel id to event definition',
        );
      }
    }
  }

  let health: AnalyticsAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}
