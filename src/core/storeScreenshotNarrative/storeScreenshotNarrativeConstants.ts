import type {
  StoreScreenshotNarrativeCaptionGuideline,
  StoreScreenshotNarrativeCaptureScenario,
  StoreScreenshotNarrativeDeviceMatrixEntry,
  StoreScreenshotNarrativeItem,
} from './storeScreenshotNarrativeTypes';

export const STORE_SCREENSHOT_NARRATIVE_PACK_ID = 'crevia_store_screenshot_narrative_v1';

export const STORE_SCREENSHOT_NARRATIVE_DOCS_PATH =
  'docs/crevia-store-screenshot-narrative-pack.md';

export const STORE_SCREENSHOT_NARRATIVE_MIN_COUNT = 9;

export const STORE_SCREENSHOT_NARRATIVE_OFFICIAL_DOCS = {
  appleScreenshotSpecs:
    'https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications',
  appleAppPrivacy:
    'https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/',
  googlePreviewAssets:
    'https://support.google.com/googleplay/android-developer/answer/9866151?hl=en',
  googleDataSafety:
    'https://support.google.com/googleplay/android-developer/answer/10787469?hl=en',
  lastChecked: '2026-06-07',
} as const;

export const STORE_SCREENSHOT_NARRATIVE_FORBIDDEN_PHRASES = [
  'gerçek zamanlı gps',
  'canlı takip',
  'canlı şehir',
  'yapay zeka ile yönet',
  'online oyuncular',
  'gerçek belediye verisi',
  'resmi belediye uygulaması',
  'gerçek şehir verisi',
  'oyuncularla rekabet et',
  'sınırsız operasyon',
  'kazanmak için satın al',
  'premium kilidi aç',
  'krizi durdur yoksa kaybedersin',
  'garantili başarı',
  'bedava',
  'ücretsiz her şey',
  'real-time gps',
  'live tracking',
  'live city',
  'ai powered',
  'manage with ai',
  'online players',
  'multiplayer',
  'real municipality data',
  'official municipality app',
  'real city data',
  'unlimited operation',
  'buy to win',
  'unlock premium',
  'guaranteed success',
  'free forever',
] as const;

export const STORE_SCREENSHOT_NARRATIVE_TECHNICAL_FORBIDDEN_WORDS = [
  'runtime',
  'metadata',
  'engine',
  'persist',
  'pack',
] as const;

export const STORE_SCREENSHOT_NARRATIVE_CAPTION_GUIDELINES: StoreScreenshotNarrativeCaptionGuideline[] =
  [
    { id: 'headline_short', rule: 'Headlines stay short enough for store overlay.' },
    { id: 'subtitle_single_line', rule: 'Subtitles read as one short line.' },
    { id: 'natural_tr_en', rule: 'EN copy is natural store copy, not a literal translation.' },
    { id: 'no_false_claims', rule: 'No AI, GPS, live tracking, official data, online, or paywall claim.' },
    { id: 'no_fake_evidence', rule: 'Never mark screenshots captured or verified without attached evidence.' },
    { id: 'balanced_themes', rule: 'Distribute city, decision, neighborhood, report, Ece, recovery and main operation themes.' },
    { id: 'onboarding_mapping', rule: 'Five onboarding presentation districts are visual choices, not new gameplay district types.' },
    { id: 'small_preview_readability', rule: 'Headline remains readable in small store preview.' },
  ];

export const STORE_SCREENSHOT_NARRATIVE_DEVICE_MATRIX: StoreScreenshotNarrativeDeviceMatrixEntry[] =
  [
    {
      platform: 'ios',
      deviceClass: 'iPhone large display',
      orientation: 'portrait',
      priority: 'must',
      cropRisk: 'Low if headline stays in top safe band and bottom CTA is not required.',
      safeAreaNotes: 'Respect Dynamic Island/notch, home indicator, and app tab bar crop.',
      copyLengthNotes: 'TR headline should be the shortest variant; EN should avoid long compound phrases.',
      officialDimensionNotes:
        'Use App Store Connect screenshot specifications before final export; do not rely on stale hardcoded sizes.',
    },
    {
      platform: 'ios',
      deviceClass: 'iPhone medium/small display',
      orientation: 'portrait',
      priority: 'should',
      cropRisk: 'Medium because TR subtitles can wrap and Hub cards can crowd the phone frame.',
      safeAreaNotes: 'Validate notch crop and top overlay spacing on the smallest supported phone.',
      copyLengthNotes: 'Subtitle can wrap to two lines only if the headline remains dominant.',
      officialDimensionNotes:
        'Confirm accepted iPhone display classes in App Store Connect at capture time.',
    },
    {
      platform: 'ios',
      deviceClass: 'iPad/tablet',
      orientation: 'portrait',
      priority: 'optional',
      cropRisk: 'Optional backlog; tablet composition may need a separate crop.',
      safeAreaNotes: 'Avoid stretching phone UI into a dashboard-like tablet frame.',
      copyLengthNotes: 'Tablet can use the same copy, but must still read like mobile game marketing.',
      officialDimensionNotes:
        'Check current iPad screenshot requirements in App Store Connect before tablet capture.',
    },
    {
      platform: 'android',
      deviceClass: 'Android phone',
      orientation: 'portrait',
      priority: 'must',
      cropRisk: 'Medium because gesture navigation and Play preview crops can hide lower UI.',
      safeAreaNotes: 'Keep app screenshot content above gesture nav and overlay subtitle outside the phone crop.',
      copyLengthNotes: 'TR diacritics and EN apostrophes must be checked in exported Play assets.',
      officialDimensionNotes:
        'Use Play Console preview asset requirements and console validation before final export.',
    },
    {
      platform: 'android',
      deviceClass: 'Low-end/small Android phone',
      orientation: 'portrait',
      priority: 'should',
      cropRisk: 'High for dense Hub, report, and map bottom panels.',
      safeAreaNotes: 'Capture with text scaling guard and bottom navigation visible.',
      copyLengthNotes: 'Favor the shortest caption variants; no third overlay line.',
      officialDimensionNotes:
        'Confirm phone screenshot constraints in Play Console during capture QA.',
    },
    {
      platform: 'android',
      deviceClass: 'Android tablet',
      orientation: 'portrait',
      priority: 'optional',
      cropRisk: 'Optional backlog; may need a separate layout treatment.',
      safeAreaNotes: 'Do not imply tablet support evidence until a real tablet capture exists.',
      copyLengthNotes: 'Same captions are acceptable only after visual QA.',
      officialDimensionNotes:
        'Check Play Console tablet screenshot guidance if tablet listing assets are added.',
    },
  ];

export const STORE_SCREENSHOT_NARRATIVE_CAPTURE_SCENARIOS: StoreScreenshotNarrativeCaptureScenario[] =
  [
    {
      scenarioId: 'state_day1_onboarding',
      label: 'Day 1 onboarding and first decision',
      targetDay: 1,
      requiredStateSummary:
        'Onboarding continuation is incomplete or newly completed; Hub remains simple; first decision/result/report flow is available.',
      surfaces: [
        'CreviaOnboardingScreen',
        'HubReferenceHome',
        'Event detail plan phase',
        'DecisionResultScreen',
      ],
      seedNotes:
        'Use a fresh install or cleared local save. Five onboarding presentation districts may be visible, but gameplay mapping is never shown.',
      fakeDataPolicy:
        'No fabricated captures. Do not claim screenshots exist until exported evidence is attached.',
      devtoolsNotes: 'No new route or production devtools. Existing internal state helpers stay out of store assets.',
      evidenceNotes:
        'Required screenshots stay pending until iOS and Android capture files are reviewed.',
    },
    {
      scenarioId: 'state_day5_pilot',
      label: 'Day 5 pilot depth',
      targetDay: 5,
      requiredStateSummary:
        'Pilot has social and trust signals; Social Pulse is active; reward or recovery can appear in a small, truthful way.',
      surfaces: ['MapScreen', 'Social Pulse surface', 'EndOfDayReportView', 'HubAdvisorCard'],
      seedNotes:
        'Reach Day 5 through normal play or a non-shipped internal save used only for capture planning.',
      fakeDataPolicy:
        'No fake social counts, no real names, no live data claim, no capture status change.',
      devtoolsNotes: 'If an internal save is used, keep it outside production runtime and document it as capture-only.',
      evidenceNotes: 'Attach screenshots and review notes before changing any launch blocker.',
    },
    {
      scenarioId: 'state_day8_main_operation',
      label: 'Day 8 main operation',
      targetDay: 8,
      requiredStateSummary:
        'Main operation feel is active; map reactions, district report, resources, city journal and advisor relationship can be visible.',
      surfaces: [
        'HubMainOperationFeelCard',
        'MapOperationBottomPanel',
        'EndOfDayReportView',
        'OperationalResourcesDetailSheet',
      ],
      seedNotes:
        'Complete pilot naturally or use a capture-only Day 8 save with no production route change.',
      fakeDataPolicy:
        'Do not describe content activation as new public gameplay in store copy; do not fake capture evidence.',
      devtoolsNotes: 'No new navigation route is introduced for this narrative pass.',
      evidenceNotes: 'Main-operation screenshots are required for story clarity but still pending.',
    },
    {
      scenarioId: 'state_profile_career',
      label: 'Profile career evidence',
      targetDay: 'profile',
      requiredStateSummary:
        'Authority and badge state must come from actual progression; insufficient progression keeps the profile screenshot optional.',
      surfaces: ['ProfileScreen', 'ProfileAuthorityCard', 'ProfileBadgeShowcaseCard'],
      seedNotes: 'Use a real progression save. Do not unlock fake achievements for the store image.',
      fakeDataPolicy: 'No fake badge, certification, official rank, or real-world authority claim.',
      devtoolsNotes: 'Profile remains optional until real evidence exists.',
      evidenceNotes: 'Optional screenshot can be skipped without closing the required screenshot blocker.',
    },
    {
      scenarioId: 'state_custom_store_console',
      label: 'Store console and privacy metadata check',
      targetDay: 'custom',
      requiredStateSummary:
        'Official App Store Connect and Play Console requirements are checked manually before final export.',
      surfaces: ['App Store Connect', 'Play Console'],
      seedNotes: 'No app runtime state. This is a manual compliance checkpoint.',
      fakeDataPolicy: 'Console entry, privacy URL and Data safety remain manual blockers until completed.',
      evidenceNotes: 'Attach console screenshots or notes only after the real console check.',
    },
  ];

function item(
  partial: Omit<StoreScreenshotNarrativeItem, 'captureStatus' | 'blocksStoreSubmission'> & {
    optional?: boolean;
  },
): Omit<StoreScreenshotNarrativeItem, 'captureStatus'> {
  return {
    ...partial,
    blocksStoreSubmission: !partial.optional,
  };
}

export const STORE_SCREENSHOT_NARRATIVE_ITEMS_TEMPLATE: Omit<
  StoreScreenshotNarrativeItem,
  'captureStatus'
>[] = [
  item({
    id: 'ssn_onboarding_entry',
    order: 1,
    screenKey: 'onboarding_city_entry',
    titleTR: 'Şehre İlk Adımını At',
    titleEN: 'Step Into City Operations',
    subtitleTR: 'Ece seni pilot operasyona hazırlar.',
    subtitleEN: 'Ece prepares you for the pilot operation.',
    playerPromise: 'Oyuncu şehir operasyonuna rehberli bir başlangıçla girer.',
    screenshotGoal: 'Onboarding continuation: Ece briefing or district selection with clear step flow.',
    requiredGameState:
      'state_day1_onboarding; onboarding continuation visible before or just after the two key choices.',
    requiredSurface: 'CreviaOnboardingScreen',
    captureNotes:
      'Show Ece briefing or district selection. Five presentation districts may appear; gameplay mapping stays invisible.',
    safeAreaNotes: 'Compact stepper and CTA visible; no swipe gesture hint needed.',
    forbiddenElements: ['gameplay_district_type_claim', 'devtools_panel', 'technical_mapping_text'],
    storeComplianceNotes: 'Onboarding is a guided game setup, not real municipal onboarding.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_hub_operations',
    order: 2,
    screenKey: 'hub_operations_desk',
    titleTR: 'Şehri Bugün Sen Yönet',
    titleEN: "Run Today's City Operations",
    subtitleTR: 'Ece, riskler ve saha kaynakları aynı merkezde.',
    subtitleEN: 'Advisor notes, risks and field resources in one place.',
    playerPromise: 'Belediye operasyon simülasyonu merkezden yönetim hissi verir.',
    screenshotGoal:
      'Hub with advisor note, tomorrow risk, compact resources and a city memory or recovery line.',
    requiredGameState: 'state_day5_pilot or state_day8_main_operation; Hub is readable and not crowded.',
    requiredSurface: 'HubReferenceHome / HubScreen',
    captureNotes: 'Prefer Day 8 if main operation context is legible; avoid too many stacked cards.',
    safeAreaNotes: 'Top app header and bottom tab bar must not collide with the store crop.',
    forbiddenElements: ['placeholder_price', 'crisis_overload', 'dashboard_clutter'],
    storeComplianceNotes: 'No official municipality branding or console-like dashboard promise.',
    evidenceRequired: ['screenshot', 'store_console'],
  }),
  item({
    id: 'ssn_decision_plan',
    order: 3,
    screenKey: 'event_decision_plan',
    titleTR: 'Karar Ver, Etkisini Gör',
    titleEN: 'Make Decisions That Matter',
    subtitleTR: 'Kısa vadeli etki ile yarına kalan riski dengele.',
    subtitleEN: "Balance short-term impact and tomorrow's risk.",
    playerPromise: 'Kararlar açık seçenekler ve tradeoff hissiyle sunulur.',
    screenshotGoal: 'Decision or plan screen with clear CTA and readable tradeoff copy.',
    requiredGameState: 'state_day1_onboarding; first event plan flow is available.',
    requiredSurface: 'Event detail workflow - Planla phase',
    captureNotes: 'Decision options fit without tiny text; no raw stat dump.',
    safeAreaNotes: 'CTA stays above gesture area and store crop.',
    forbiddenElements: ['guaranteed_outcome', 'paywall_overlay', 'raw_debug_state'],
    storeComplianceNotes: 'Store promise is strategic choice, not guaranteed success.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_decision_impact',
    order: 4,
    screenKey: 'decision_impact_result',
    titleTR: 'Neden Böyle Oldu?',
    titleEN: 'See Why It Happened',
    subtitleTR: 'Kararın güven, kaynak ve mahalle etkisini açıkça gör.',
    subtitleEN: 'Understand trust, resource and neighborhood impact.',
    playerPromise: 'Sonuç ekranı kararın neden ve etkisini anlaşılır yapar.',
    screenshotGoal: 'Decision Impact Explanation with reward or recovery chip and advisor result line.',
    requiredGameState: 'state_day1_onboarding or state_day5_pilot after a meaningful decision.',
    requiredSurface: 'DecisionResultScreen / EventResultImpactExplanationCard',
    captureNotes: 'Show impact lines and visible CTA; avoid duplicate echo spam.',
    safeAreaNotes: 'Impact card text stays inside line guards.',
    forbiddenElements: ['technical_ids', 'raw_formula', 'fake_precision_claim'],
    storeComplianceNotes: 'No exact real-world operational guarantee.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_map_neighborhood',
    order: 5,
    screenKey: 'map_neighborhood_reactions',
    titleTR: 'Mahalleler Tepki Verir',
    titleEN: 'Neighborhoods React',
    subtitleTR: 'Risk, toparlanma ve saha kapasitesi haritada görünür.',
    subtitleEN: 'Risks, recovery and field capacity appear on the map.',
    playerPromise: 'Harita mahalle tepkisini ve saha kapasitesini oyun diliyle gösterir.',
    screenshotGoal: 'Selected district map with reaction indicator, district report card and resource line.',
    requiredGameState: 'state_day5_pilot or state_day8_main_operation; district selected.',
    requiredSurface: 'MapScreen / MapOperationBottomPanel',
    captureNotes: 'No GPS or real map data implication. Keep district panel readable.',
    safeAreaNotes: 'Bottom panel should not hide the map reaction or store headline.',
    forbiddenElements: ['live_gps', 'real_map_data_badge', 'tracking_claim'],
    storeComplianceNotes: 'Simulation map only; not real city data or live tracking.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_social_pulse',
    order: 6,
    screenKey: 'social_pulse',
    titleTR: 'Sosyal Nabzı Oku',
    titleEN: "Read the City's Pulse",
    subtitleTR: 'Mahalleler kararlarının etkisini konuşur.',
    subtitleEN: 'Neighborhoods respond to your decisions.',
    playerPromise: 'Sosyal Nabız kararların şehirde nasıl yankılandığını gösterir.',
    screenshotGoal: 'Social Pulse with city echo or recovery mention and reasonable mention count.',
    requiredGameState: 'state_day5_pilot; social pulse active.',
    requiredSurface: 'Social Pulse surface',
    captureNotes: 'No real names, no online-player implication, no spammy mention count.',
    safeAreaNotes: 'Mention cards use two-line body guard.',
    forbiddenElements: ['online_multiplayer', 'real_names', 'chat_claim'],
    storeComplianceNotes: 'Fictional civic social layer only.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_end_of_day_report',
    order: 7,
    screenKey: 'end_of_day_report',
    titleTR: 'Günün Etkisini Gör',
    titleEN: "Review the Day's Impact",
    subtitleTR: 'Raporlar kararlarını, riskleri ve toparlanmayı hatırlar.',
    subtitleEN: 'Reports remember decisions, risks and recovery.',
    playerPromise: 'Gün sonu raporu karar hafızasını ve yarın riskini toparlar.',
    screenshotGoal: 'Report hero with tomorrow risk, city journal line, neighborhood note and recovery trace.',
    requiredGameState: 'state_day5_pilot or state_day8_main_operation after end-of-day report.',
    requiredSurface: 'EndOfDayReportView',
    captureNotes: 'Capture top fold; keep CTA visible if possible.',
    safeAreaNotes: 'Report header and first cards fit the phone crop.',
    forbiddenElements: ['game_over', 'season_final_claim', 'fake_journal_entry'],
    storeComplianceNotes: 'Reports remember in-game decisions only.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_main_operation',
    order: 8,
    screenKey: 'main_operation_day8',
    titleTR: 'Ana Operasyon Başladı',
    titleEN: 'The Main Operation Begins',
    subtitleTR: 'Pilot biter, şehir daha geniş sorumluluk ister.',
    subtitleEN: 'The pilot ends and the city opens wider.',
    playerPromise: 'Pilot sonrası oyun daha geniş bir operasyon sorumluluğuna açılır.',
    screenshotGoal: 'Day 8+ Hub with main operation feel and strategic Ece tone.',
    requiredGameState: 'state_day8_main_operation; post-pilot main operation is active.',
    requiredSurface: 'HubMainOperationFeelCard / Day 8+ Hub',
    captureNotes: 'Use player-facing event labels only; no internal content source names.',
    safeAreaNotes: 'Main operation card should sit above the fold.',
    forbiddenElements: ['paywall_pressure', 'technical_source_name', 'placeholder_price'],
    storeComplianceNotes: 'Do not imply all post-pilot systems are final submitted store features.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_ece_advisor',
    order: 9,
    screenKey: 'advisor_relationship',
    titleTR: 'Ece Karar Tarzını Tanır',
    titleEN: 'Ece Learns Your Style',
    subtitleTR: 'Önceki kararlarını ve mahalle sinyallerini birlikte yorumlar.',
    subtitleEN: 'She connects your decisions with neighborhood signals.',
    playerPromise: 'Ece önceki kararları oyun içi bağlamla hatırlatan danışman gibi çalışır.',
    screenshotGoal: 'Advisor card or report line that references style, previous decisions and signals.',
    requiredGameState: 'state_day8_main_operation; advisor relationship line is visible.',
    requiredSurface: 'HubAdvisorCard / EcePlayerStyleInsightCard / ReportAdvisorCommentCard',
    captureNotes: 'No romantic tone, no chatbot claim, no real AI claim.',
    safeAreaNotes: 'Advisor line should stay within two lines.',
    forbiddenElements: ['ai_badge', 'chatbot_claim', 'dating_tone'],
    storeComplianceNotes: 'Ece is an in-game advisor character, not a real AI assistant.',
    evidenceRequired: ['screenshot'],
  }),
  item({
    id: 'ssn_profile_career',
    order: 10,
    screenKey: 'profile_career',
    titleTR: 'Kariyerini Büyüt',
    titleEN: 'Grow Your Civic Career',
    subtitleTR: 'Yetki, rozet ve şehirde bıraktığın iz gelişir.',
    subtitleEN: 'Build authority, badges and your city legacy.',
    playerPromise: 'Profil gerçek ilerlemeyi kariyer ve yetki hissine bağlar.',
    screenshotGoal: 'Profile authority and badge showcase using real progression state.',
    requiredGameState: 'state_profile_career; Day 4+ natural progression.',
    requiredSurface: 'ProfileScreen',
    captureNotes: 'Optional unless real progression evidence is strong enough.',
    safeAreaNotes: 'Badge grid must be readable on small phone.',
    forbiddenElements: ['fake_badge', 'certification_claim', 'official_rank_claim'],
    storeComplianceNotes: 'In-game progression only.',
    evidenceRequired: ['screenshot'],
    optional: true,
  }),
  item({
    id: 'ssn_operational_resources',
    order: 11,
    screenKey: 'operational_resources',
    titleTR: 'Ekip ve Araçları Dengele',
    titleEN: 'Balance Teams and Vehicles',
    subtitleTR: 'Saha kapasitesi kararlarının gerçek ağırlığını gösterir.',
    subtitleEN: 'Field capacity gives weight to every decision.',
    playerPromise: 'Ekip ve araç kapasitesi kararların oyun içi ağırlığını artırır.',
    screenshotGoal: 'Operational resources card or detail sheet with teams and vehicles.',
    requiredGameState: 'state_day8_main_operation; resources visible.',
    requiredSurface: 'OperationalResourcesDetailSheet / HubOperationalResourcesCard',
    captureNotes: 'Optional. No individual staff names, plates, GPS or live route copy.',
    safeAreaNotes: 'Sheet tabs and first row must remain readable.',
    forbiddenElements: ['gps_plate', 'named_roster', 'live_route_claim'],
    storeComplianceNotes: 'Abstract team and vehicle groups only.',
    evidenceRequired: ['screenshot'],
    optional: true,
  }),
];

export const STORE_SCREENSHOT_NARRATIVE_VISUAL_DIRECTION = {
  theme: 'Cream and mint soft gradient with dark teal contrast and restrained gold accents.',
  overlay:
    'Short headline at the top, one subtitle below, phone screenshot centered or lower in a rounded frame.',
  avoid:
    'Crowded chips, public dashboard feel, panic language, tiny text, fake console evidence, and dark store mood.',
} as const;
