import {
  REAL_DEVICE_PLAYTEST_AREA_LABELS,
  REAL_DEVICE_PLAYTEST_DOCS_PATH,
  REAL_DEVICE_PLAYTEST_MIN_AREAS,
  REAL_DEVICE_PLAYTEST_MIN_SCENARIOS,
  REAL_DEVICE_PLAYTEST_RISK_TAXONOMY,
} from './realDevicePlaytestConstants';
import type {
  CreviaRealDevicePlaytestAreaDefinition,
  CreviaRealDevicePlaytestObservation,
  CreviaRealDevicePlaytestPlan,
  CreviaRealDevicePlaytestScenario,
  CreviaRealDevicePlaytestStep,
} from './playtestTypes';

const ALL_DEVICE_PROFILES = [
  'android_small',
  'android_mid',
  'android_low_mid_segment',
  'ios_small',
  'ios_mid_large',
  'ios_real_iphone',
] as const;

function step(
  order: number,
  action: string,
  watchFor: string[],
  surface?: string,
): CreviaRealDevicePlaytestStep {
  return { order, action, surface, watchFor };
}

function buildAreaDefinitions(): CreviaRealDevicePlaytestAreaDefinition[] {
  return [
    {
      id: 'install_launch',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.install_launch,
      questions: [
        'App ilk açılışta crash üretiyor mu?',
        'İlk state normalize oluyor mu?',
        'Offline başlangıç sakin mi?',
      ],
      observationFocus: ['splash/loading', 'fresh state', 'offline graceful'],
    },
    {
      id: 'first_ten_minutes',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.first_ten_minutes,
      questions: [
        'Oyuncu ne yapacağını biliyor mu?',
        'Hub fazla kalabalık mı?',
        'First-ten-minutes guide görünüyor mu?',
      ],
      observationFocus: ['hub density', 'guide strip', 'first event routing'],
    },
    {
      id: 'event_flow',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.event_flow,
      questions: [
        'İncele→Planla→Yönlendir→Sahada→Sonuç doğal mı?',
        'CTA net mi?',
        'Geri dönüş güvenli mi?',
      ],
      observationFocus: ['phase transitions', 'CTA clarity', 'back navigation'],
    },
    {
      id: 'assignment_route',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.assignment_route,
      questions: [
        'Ekip/araç seçimi anlaşılır mı?',
        'Route preview operasyonel mi (GPS vaadi yok)?',
        'Sahada stepper okunabilir mi?',
      ],
      observationFocus: ['assignment editor', 'route strip', 'field stepper'],
    },
    {
      id: 'map',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.map,
      questions: [
        'Harita yaşayan şehir hissi veriyor mu?',
        'District intelligence yoğunluğu kabul edilebilir mi?',
        'Küçük ekranda taşma var mı?',
      ],
      observationFocus: ['district strip', 'overlays', 'bottom panel'],
    },
    {
      id: 'result_screen',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.result_screen,
      questions: [
        'Kararın şehirde iz bıraktığı hissediliyor mu?',
        'Systems echo anlaşılır mı?',
        'Carry-over hint duplicate mi?',
      ],
      observationFocus: ['impact metrics', 'systems echo', 'map before/after'],
    },
    {
      id: 'end_of_day_report',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.end_of_day_report,
      questions: [
        'Gün sonu raporu fazla yoğun mu?',
        'Scroll yorgunluğu var mı?',
        'Systems integration card kalabalık mı?',
      ],
      observationFocus: ['report hero', 'advisor', 'tomorrow preview'],
    },
    {
      id: 'hub_day2_plus',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.hub_day2_plus,
      questions: [
        'Carry-over memory card anlaşılır mı?',
        'Hub open-ended strip zamanında mı?',
        'Kart sırası mantıklı mı?',
      ],
      observationFocus: ['carry-over', 'open-ended card', 'crisis cards'],
    },
    {
      id: 'day7_post_pilot_offer',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.day7_post_pilot_offer,
      questions: [
        'Pilot completion anlaşılır mı?',
        'Ana operasyon değeri net mi?',
        'Paywall baskısı var mı?',
      ],
      observationFocus: ['Day 7 CTA', 'offer screen', 'limited/full copy'],
    },
    {
      id: 'day8_open_ended',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.day8_open_ended,
      questions: [
        'Açık uçlu geçiş anlaşılır mı?',
        'Operation era / story chain fazla mı?',
        'District operation action kontrollü mü?',
      ],
      observationFocus: ['era preview', 'story hint', 'operation action'],
    },
    {
      id: 'profile_career',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.profile_career,
      questions: [
        'Uzun vadeli hedef net mi?',
        'Badge/prestige duplicate var mı?',
        'Permission chips okunabilir mi?',
      ],
      observationFocus: ['rank', 'next unlock', 'career showcase'],
    },
    {
      id: 'performance_device_ux',
      label: REAL_DEVICE_PLAYTEST_AREA_LABELS.performance_device_ux,
      questions: [
        'Scroll jank var mı?',
        'Safe area doğru mu?',
        'Android back davranışı sağlıklı mı?',
      ],
      observationFocus: ['jank', 'safe area', 'small screen', 'large font'],
    },
  ];
}

export function buildRealDeviceScenarioMatrix(): CreviaRealDevicePlaytestScenario[] {
  const profiles = [...ALL_DEVICE_PROFILES];

  return [
    {
      id: 'rdp.fresh_day1_first_result',
      title: 'Fresh install → Day 1 first event result',
      area: 'first_ten_minutes',
      day: 1,
      startState: 'Fresh install, no prior save',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Launch app; wait for hub', ['no crash', 'normalized state'], 'hub'),
        step(2, 'Follow first-ten-minutes guide to first event', ['clear CTA', 'low hub density'], 'hub'),
        step(3, 'Complete Inspect→Plan→Dispatch→Field→Result', ['phase order natural', 'no stuck'], 'event'),
      ],
      expectedResult: 'Player reaches first result without confusion or crash.',
      relatedVerifyScripts: ['verify:first-10-minutes', 'verify:full-ux-flow'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.day1_full_report',
      title: 'Day 1 full report',
      area: 'end_of_day_report',
      day: 1,
      startState: 'Day 1 after first event completed',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open end-of-day report', ['compact layout', 'no season-end copy'], 'report'),
        step(2, 'Scroll full report', ['readable', 'no overflow'], 'report'),
        step(3, 'Tap primary CTA back to hub', ['CTA clear'], 'report'),
      ],
      expectedResult: 'Day 1 report compact; CTA returns to hub cleanly.',
      relatedVerifyScripts: ['verify:first-10-minutes', 'verify:full-ux-flow'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.day2_carry_over',
      title: 'Day 2 carry-over memory visibility',
      area: 'hub_day2_plus',
      day: 2,
      startState: 'Day 2 with prior day decisions',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open hub on Day 2', ['carry-over card visible if applicable'], 'hub'),
        step(2, 'Check hub open-ended strip restraint', ['not overloaded'], 'hub'),
      ],
      expectedResult: 'Carry-over hint visible; hub density acceptable.',
      relatedVerifyScripts: ['verify:player-flow-audit', 'verify:full-loop'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.day3_assignment_route',
      title: 'Day 3 assignment + route preview',
      area: 'assignment_route',
      day: 3,
      startState: 'Day 3 event with assignment phase',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open Plan phase assignment', ['team/vehicle choice clear'], 'event'),
        step(2, 'Confirm assignment; check route preview strip', ['no GPS claim', 'operational tone'], 'event'),
        step(3, 'Enter Field phase stepper', ['readable steps'], 'event'),
      ],
      expectedResult: 'Assignment and route preview feel operational, not navigation-app.',
      relatedVerifyScripts: ['verify:full-ux-flow', 'verify:performance-selector-pass-two'],
      screenshotNeeded: true,
      videoNeeded: true,
    },
    {
      id: 'rdp.day4_map_intelligence',
      title: 'Day 4 map district intelligence',
      area: 'map',
      day: 4,
      startState: 'Day 4 with map access',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open map from hub or event', ['no crash'], 'map'),
        step(2, 'Review district intelligence strip', ['line cap respected', 'living city feel'], 'map'),
        step(3, 'Toggle resource/crisis overlay if available', ['readable overlay'], 'map'),
      ],
      expectedResult: 'Map feels alive; intelligence strip not overcrowded on small screen.',
      relatedVerifyScripts: ['verify:performance-selector-pass-two', 'verify:analytics-new-systems'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.day5_district_operation_action',
      title: 'Day 5 district operation action selectable',
      area: 'day8_open_ended',
      day: 5,
      startState: 'Day 5 hub with district operation preview',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open hub; locate district operation action card', ['small controlled CTA'], 'hub'),
        step(2, 'Tap if selectable; observe feedback', ['optional not blocking'], 'hub'),
      ],
      expectedResult: 'District operation action small and optional; no hub trap.',
      relatedVerifyScripts: ['verify:district-operation-actions'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.day6_crisis_calm_language',
      title: 'Day 6 crisis-adjacent calm language',
      area: 'event_flow',
      day: 6,
      startState: 'Day 6 with crisis-adjacent event if spawned',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Play event with elevated tension', ['no panic/felaket copy'], 'event'),
        step(2, 'Read result and advisor lines', ['calm operational tone'], 'result'),
      ],
      expectedResult: 'Crisis-adjacent content stays calm; no forbidden alarmist copy.',
      relatedVerifyScripts: ['verify:content-production', 'verify:full-ux-flow'],
      screenshotNeeded: false,
      videoNeeded: false,
    },
    {
      id: 'rdp.day7_pilot_completion',
      title: 'Day 7 pilot completion',
      area: 'day7_post_pilot_offer',
      day: 7,
      startState: 'Pilot Day 7 final event path',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Complete Day 7 final event', ['pilot completion clear'], 'event'),
        step(2, 'Open Day 7 report', ['Ana Operasyona Göz At or equivalent CTA'], 'report'),
        step(3, 'Route to post-pilot offer if triggered', ['no paywall panic'], 'post_pilot_offer'),
      ],
      expectedResult: 'Pilot completion understood; transition to offer feels natural.',
      relatedVerifyScripts: ['verify:full-loop', 'verify:monetization-gate'],
      screenshotNeeded: true,
      videoNeeded: true,
    },
    {
      id: 'rdp.day8_limited_mode',
      title: 'Day 8 post-pilot limited mode',
      area: 'day8_open_ended',
      day: 8,
      startState: 'Post-pilot limited continue selected',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Choose Sınırlı Gündemle Devam Et on offer', ['limited copy safe'], 'post_pilot_offer'),
        step(2, 'Return to hub Day 8', ['open-ended hints restrained', 'playable'], 'hub'),
        step(3, 'Play one event cycle', ['no trap'], 'event'),
      ],
      expectedResult: 'Limited mode playable; open-ended systems preview without overload.',
      relatedVerifyScripts: ['verify:monetization-gate', 'verify:soft-launch-review'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.day8_full_mock',
      title: 'Day 8 full mode mock/dev path',
      area: 'day8_open_ended',
      day: 8,
      startState: 'Dev/mock full unlock or sandbox purchase (separate IAP phase)',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Unlock full via __DEV__ mock or documented test path', ['full state visible'], 'post_pilot_offer'),
        step(2, 'Hub Day 8 full access cues', ['no premium wording'], 'hub'),
        step(3, 'Check operation era / story chain hints', ['not overwhelming'], 'hub'),
      ],
      expectedResult: 'Full mode cues visible; advanced systems still controlled.',
      relatedVerifyScripts: ['verify:monetization-gate', 'verify:operation-era-runtime-preview'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.profile_career',
      title: 'Profile career showcase review',
      area: 'profile_career',
      day: 8,
      startState: 'Day 8+ with authority/rank progression',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open profile screen', ['no crash on partial state'], 'profile'),
        step(2, 'Review rank, next unlock, permission chips', ['long-term goal clear'], 'profile'),
        step(3, 'Compare with hub badge/prestige', ['no duplicate confusion'], 'profile'),
      ],
      expectedResult: 'Career showcase communicates long-term progression.',
      relatedVerifyScripts: ['verify:performance-selector-pass-two', 'verify:analytics-new-systems'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.social_report_echo',
      title: 'Social Pulse and report echo review',
      area: 'end_of_day_report',
      day: 5,
      startState: 'Day with social pulse and report systems card',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Open Social Pulse if available', ['calm tone'], 'social'),
        step(2, 'End-of-day report systems integration card', ['not duplicate of resource cards'], 'report'),
      ],
      expectedResult: 'Social and report echoes add context without redundant density.',
      relatedVerifyScripts: ['verify:analytics-new-systems', 'verify:content-production'],
      screenshotNeeded: true,
      videoNeeded: false,
    },
    {
      id: 'rdp.offline_open',
      title: 'Offline app open',
      area: 'install_launch',
      day: 1,
      startState: 'Airplane mode before launch',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Enable airplane mode', [], 'device'),
        step(2, 'Launch app', ['no crash', 'graceful offline copy if any'], 'hub'),
        step(3, 'Navigate to offer screen if reachable', ['IAP graceful error not crash'], 'post_pilot_offer'),
      ],
      expectedResult: 'Offline launch and IAP surfaces fail gracefully.',
      relatedVerifyScripts: ['verify:iap-integration', 'verify:real-device-playtest'],
      screenshotNeeded: false,
      videoNeeded: false,
    },
    {
      id: 'rdp.background_foreground',
      title: 'App background/foreground',
      area: 'performance_device_ux',
      day: 3,
      startState: 'Mid-event or mid-report',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Start event workflow mid-phase', [], 'event'),
        step(2, 'Background app 30s; return', ['state preserved', 'no crash'], 'event'),
      ],
      expectedResult: 'Background/foreground preserves state; no layout break.',
      relatedVerifyScripts: ['verify:full-ux-flow'],
      screenshotNeeded: false,
      videoNeeded: true,
    },
    {
      id: 'rdp.restart_after_report',
      title: 'Restart after report',
      area: 'install_launch',
      day: 4,
      startState: 'After completing day report',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Complete day report; kill app', [], 'report'),
        step(2, 'Relaunch', ['day progress intact', 'no corrupt save'], 'hub'),
      ],
      expectedResult: 'Save persists across restart; hub reflects correct day.',
      relatedVerifyScripts: ['verify:full-loop', 'verify:soft-launch-readiness'],
      screenshotNeeded: false,
      videoNeeded: false,
    },
    {
      id: 'rdp.navigation_back_stack',
      title: 'Navigation back-stack sanity',
      area: 'event_flow',
      day: 2,
      startState: 'Day 2 hub',
      deviceProfiles: profiles,
      steps: [
        step(1, 'Hub → event → map → report → profile', ['each back returns expected screen'], 'navigation'),
        step(2, 'Android hardware back through stack', ['no trap', 'no duplicate hub'], 'navigation'),
      ],
      expectedResult: 'Back navigation predictable on iOS and Android.',
      relatedVerifyScripts: ['verify:full-ux-flow', 'verify:interaction-contracts'],
      screenshotNeeded: false,
      videoNeeded: true,
    },
  ];
}

export function buildRealDevicePlaytestPlan(): CreviaRealDevicePlaytestPlan {
  const areas = buildAreaDefinitions();
  const scenarios = buildRealDeviceScenarioMatrix();

  return {
    version: '1',
    round: 1,
    docsPath: REAL_DEVICE_PLAYTEST_DOCS_PATH,
    areas,
    scenarios,
    deviceProfiles: [
      { id: 'android_small', label: 'Android küçük ekran', notes: '≤5.8" phone', required: true },
      { id: 'android_mid', label: 'Android orta ekran', notes: '6.1–6.5" phone', required: true },
      { id: 'android_low_mid_segment', label: 'Düşük/orta segment Android', notes: 'Real mid-range device', required: true },
      { id: 'ios_small', label: 'iOS küçük ekran', notes: 'SE / mini class', required: true },
      { id: 'ios_mid_large', label: 'iOS orta/büyük ekran', notes: 'Standard iPhone', required: true },
      { id: 'ios_real_iphone', label: 'Gerçek iPhone', notes: 'Physical device required', required: true },
    ],
    riskTaxonomy: [...REAL_DEVICE_PLAYTEST_RISK_TAXONOMY],
    minimumScenarioCount: REAL_DEVICE_PLAYTEST_MIN_SCENARIOS,
    minimumAreaCount: REAL_DEVICE_PLAYTEST_MIN_AREAS,
    manualCompletionRequired: true,
    iapPurchaseSmokeSeparatePhase: true,
  };
}

export function buildRealDeviceObservationTemplate(
  scenario: CreviaRealDevicePlaytestScenario,
): CreviaRealDevicePlaytestObservation {
  return {
    scenarioId: scenario.id,
    deviceProfile: 'any',
    startState: scenario.startState,
    steps: scenario.steps,
    expectedResult: scenario.expectedResult,
    observedResult: '',
    severity: 'low',
    screenshotNeeded: scenario.screenshotNeeded,
    videoNeeded: scenario.videoNeeded,
    owner: 'qa',
    fixRecommendation: '',
    relatedVerifyScript: scenario.relatedVerifyScripts[0] ?? 'verify:real-device-playtest',
    completed: false,
  };
}

export function buildAllObservationTemplates(): CreviaRealDevicePlaytestObservation[] {
  return buildRealDeviceScenarioMatrix().map(buildRealDeviceObservationTemplate);
}
