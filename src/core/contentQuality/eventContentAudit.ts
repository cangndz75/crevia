import {
  EVENT_WRITING_FORBIDDEN_WORDS,
  EVENT_WRITING_LAYER_ORDER,
  EVENT_WRITING_LAYER_WEIGHTS,
} from './eventWritingStandards';
import type {
  EventWritingAuditInput,
  EventWritingAuditResult,
  EventWritingAuditWarning,
  EventWritingDomain,
  EventWritingQualityLayer,
  EventWritingQualityStatus,
  EventWritingSummary,
} from './contentQualityTypes';

const DISTRICT_MARKERS = [
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yeşilvadi',
  'yesilvadi',
  'merkez',
  'central',
  'industrial',
  'hattında',
  'çevresinde',
  'cevresinde',
  'mahalles',
  'bölgede',
  'sokağ',
  'sokag',
];

const GENERIC_PHRASES = [
  'temizlik sorunu var',
  'şehirde sorun var',
  'şehirde temizlik',
  'bazı bölgelerde',
  'bir mahallede',
  'operasyon zor',
  'sorun büyüdü',
  'durum kötü',
];

const SCENE_MARKERS = [
  'gece',
  'sabah',
  'kapatt',
  'bırakılan',
  'tıkad',
  'dar',
  'yoğun',
  'iri atık',
  'konteyner çevres',
  'rota',
  'şikayet',
  'yük',
  'sıkış',
  'bekleme',
  'görünür',
];

const ACTOR_MARKERS = [
  'esnaf',
  'apartman',
  'sürücü',
  'surucu',
  'ekip',
  'vatandaş',
  'vatandas',
  'atölye',
  'görevli',
  'gorevli',
  'şoför',
  'sofor',
  'saha ekibi',
  'mahalle sakin',
];

const DOMAIN_MARKERS: Record<EventWritingDomain, string[]> = {
  container: ['konteyner', 'atık', 'atik', 'temizlik nokta', 'waste'],
  vehicle: ['araç', 'arac', 'rota', 'filo', 'sürücü', 'surucu'],
  personnel: ['ekip', 'personel', 'moral', 'tempo', 'yorgun'],
  social: ['sosyal', 'nabız', 'nabiz', 'şikayet', 'takdir', 'görünürlük', 'gorunurluk'],
  crisis: ['kriz', 'risk birleş', 'önlem', 'onlem', 'eşik', 'esik'],
  route: ['rota', 'güzergah', 'guzergah', 'hat '],
  budget: ['bütçe', 'butce', 'kaynak', 'maliyet'],
  district_balance: ['mahalle deng', 'öncelik çatış', 'oncelik catis', 'bölgesel adalet'],
  pilot_learning: ['öğren', 'ogren', 'akış', 'akis', 'temel'],
  pilot_final: ['pilot final', 'ana operasyon', 'değerlendir', 'degerlendir'],
  post_pilot: ['hafif operasyon', 'post pilot', 'sınırlı gündem', 'sinirli gundem'],
};

const SHORT_TERM_MARKERS = [
  'bugün',
  'bugun',
  'sabah',
  'bu gün',
  'hemen',
  'düşer',
  'duser',
  'azalır',
  'azalir',
  'rahatlar',
  'açılır',
  'acilir',
  'görünür sonuç',
];

const TRADE_OFF_MARKERS = [
  'ama ',
  'fakat ',
  'ancak ',
  'buna karşılık',
  'buna karsilik',
  'bedeli',
  'karşılığında',
  'karsiliginda',
  'yorgunluk artar',
  'yorgunlugu artar',
  'geç toparlan',
  'gec toparlan',
  'daha az görünür',
  'daha az gorunur',
];

const CARRY_OVER_MARKERS = [
  'yarın',
  'yarin',
  'ertesi gün',
  'ertesi gun',
  'sonraki gün',
  'sonraki gun',
  'yarına',
  'yarina',
];

const ECHO_MARKERS = ['sosyal nabız', 'sosyal nabiz', 'rapor', 'ece', 'raporda', 'yankı'];

const PANIC_PHRASES = ['kriz başladı', 'kriz başlıyor', 'tam kriz', 'felaket'];

function normalizeText(parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function detectTooGenericEventText(text: string): boolean {
  const lower = text.toLowerCase();
  if (GENERIC_PHRASES.some((p) => lower.includes(p))) {
    return true;
  }
  if (lower.length < 40 && !DISTRICT_MARKERS.some((m) => lower.includes(m))) {
    return true;
  }
  return false;
}

export function detectConcreteScene(text: string): boolean {
  const lower = text.toLowerCase();
  if (detectTooGenericEventText(text)) {
    return false;
  }
  const hits = SCENE_MARKERS.filter((m) => lower.includes(m)).length;
  return hits >= 2 || (hits >= 1 && lower.length > 80);
}

export function detectDistrictContext(text: string): boolean {
  const lower = text.toLowerCase();
  return DISTRICT_MARKERS.some((m) => lower.includes(m));
}

export function detectAffectedActor(text: string): boolean {
  const lower = text.toLowerCase();
  return ACTOR_MARKERS.some((m) => lower.includes(m));
}

export function detectOperationalDomain(text: string): boolean {
  const lower = text.toLowerCase();
  for (const markers of Object.values(DOMAIN_MARKERS)) {
    if (markers.some((m) => lower.includes(m))) {
      return true;
    }
  }
  return false;
}

export function detectShortTermGain(text: string): boolean {
  const lower = text.toLowerCase();
  return SHORT_TERM_MARKERS.some((m) => lower.includes(m));
}

export function detectTradeOffLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return TRADE_OFF_MARKERS.some((m) => lower.includes(m));
}

export function detectCarryOverLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CARRY_OVER_MARKERS.some((m) => lower.includes(m));
}

export function detectEchoLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return ECHO_MARKERS.some((m) => lower.includes(m));
}

export function inferEventWritingDomain(input: EventWritingAuditInput): EventWritingDomain {
  if (input.domain) {
    return input.domain;
  }
  if (input.source === 'post_pilot') {
    return 'post_pilot';
  }
  if (input.source === 'crisis') {
    return 'crisis';
  }
  if (input.source === 'main_operation') {
    return 'district_balance';
  }
  if (input.day === 1) {
    return 'pilot_learning';
  }
  if (input.day === 7) {
    return 'pilot_final';
  }

  const text = normalizeText([
    input.title,
    input.description,
    input.districtId,
    ...(input.options ?? []),
  ]);

  let best: EventWritingDomain = 'container';
  let bestScore = 0;
  for (const [domain, markers] of Object.entries(DOMAIN_MARKERS) as [
    EventWritingDomain,
    string[],
  ][]) {
    const score = markers.filter((m) => text.includes(m)).length;
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }

  if (input.day === 2 && bestScore === 0) return 'container';
  if (input.day === 3 && bestScore === 0) return 'vehicle';
  if (input.day === 4 && bestScore === 0) return 'social';
  if (input.day === 6 && bestScore === 0) return 'crisis';

  return best;
}

type LayerEval = {
  layer: EventWritingQualityLayer;
  passed: boolean;
  partial: boolean;
};

function evaluateLayers(
  text: string,
  input: EventWritingAuditInput,
): LayerEval[] {
  const isDay1 = input.day === 1;

  const district = detectDistrictContext(text);
  const scene = detectConcreteScene(text);
  const actor = detectAffectedActor(text);
  const domain = detectOperationalDomain(text) || input.domain != null;
  const shortTerm = detectShortTermGain(text);
  const tradeOff = detectTradeOffLanguage(text);
  const carry = detectCarryOverLanguage(text);
  const echo = detectEchoLanguage(text);

  return [
    { layer: 'district_context', passed: district, partial: !district && text.length > 60 },
    { layer: 'concrete_scene', passed: scene, partial: !scene && !detectTooGenericEventText(text) },
    { layer: 'affected_actor', passed: actor, partial: false },
    { layer: 'operational_domain', passed: domain, partial: false },
    { layer: 'short_term_gain', passed: shortTerm, partial: isDay1 && scene },
    {
      layer: 'trade_off',
      passed: tradeOff,
      partial: isDay1 && scene && !tradeOff,
    },
    {
      layer: 'carry_over',
      passed: carry,
      partial: isDay1 && shortTerm && !carry,
    },
    {
      layer: 'echo',
      passed: echo,
      partial: isDay1 && !echo,
    },
  ];
}

export function getEventWritingScoreFromLayers(
  layers: LayerEval[],
  isDay1: boolean,
): number {
  let score = 0;
  for (const evalLayer of layers) {
    const weight = EVENT_WRITING_LAYER_WEIGHTS[evalLayer.layer];
    if (evalLayer.passed) {
      score += weight;
    } else if (evalLayer.partial && isDay1) {
      score += Math.round(weight * 0.5);
    }
  }
  return Math.min(100, Math.max(0, score));
}

export function scoreToStatus(score: number): EventWritingQualityStatus {
  if (score >= 80) return 'pass';
  if (score >= 60) return 'warn';
  return 'fail';
}

export function buildEventWritingSuggestedFixes(result: EventWritingAuditResult): string[] {
  const fixes: string[] = [];
  if (result.missingLayers.includes('district_context')) {
    fixes.push('Mahalle veya hat adını açık yaz (Cumhuriyet, Sanayi, İstasyon vb.).');
  }
  if (result.missingLayers.includes('concrete_scene')) {
    fixes.push('Somut saha görüntüsü ekle (zaman, nesne, fiziksel etki).');
  }
  if (result.missingLayers.includes('trade_off') || !result.hasTradeOffLanguage) {
    fixes.push('Trade-off ekle: “ama araç yorgunluğu artar” gibi bedel dili.');
  }
  if (result.missingLayers.includes('carry_over')) {
    fixes.push('Yarına taşan etki ekle: “yarın konteyner baskısı azalır”.');
  }
  if (result.missingLayers.includes('echo')) {
    fixes.push('Sosyal Nabız, Ece veya rapor echo cümlesi bağla.');
  }
  if (result.isTooGeneric) {
    fixes.push('“Sorun var” yerine sahayı canlandıran cümle yaz.');
  }
  return fixes;
}

export function auditEventWriting(input: EventWritingAuditInput): EventWritingAuditResult {
  const text = normalizeText([
    input.title,
    input.description,
    input.districtId,
    ...(input.options ?? []),
    ...(input.tags ?? []),
  ]);

  const isDay1 = input.day === 1;
  const isTooGeneric = detectTooGenericEventText(text);
  const layerEvals = evaluateLayers(text, input);
  const score = getEventWritingScoreFromLayers(layerEvals, isDay1);
  let status = scoreToStatus(score);
  if (isTooGeneric && !isDay1) {
    status = 'fail';
  }
  if (isDay1 && isTooGeneric) {
    status = 'fail';
  }

  const missingLayers = layerEvals
    .filter((l) => !l.passed && !(l.partial && isDay1))
    .map((l) => l.layer);

  const strengths: string[] = [];
  for (const l of layerEvals) {
    if (l.passed) {
      strengths.push(l.layer);
    }
  }

  const warnings: EventWritingAuditWarning[] = [];
  if (isTooGeneric) {
    warnings.push({
      id: 'too_generic',
      severity: 'fail',
      layer: 'concrete_scene',
      message: 'Metin çok genel/soyut.',
      suggestion: 'Somut saha problemi ve mahalle bağlamı ekle.',
    });
  }
  if (isDay1 && PANIC_PHRASES.some((p) => text.includes(p))) {
    warnings.push({
      id: 'day1_panic',
      severity: 'warn',
      message: 'Gün 1 için ağır kriz/panik dili.',
      suggestion: 'Öğrenme tonunu koru; kriz dilini hafiflet.',
    });
  }
  if (
    isDay1 &&
    (text.includes('sosyal nabız') || text.includes('kriz masası')) &&
    text.split(' ').length > 35
  ) {
    warnings.push({
      id: 'day1_heavy_systems',
      severity: 'warn',
      message: 'Gün 1 için fazla sistem/metrik yükü.',
    });
  }
  for (const word of EVENT_WRITING_FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      warnings.push({
        id: `forbidden_${word}`,
        severity: 'fail',
        message: `Yasaklı kelime: ${word}`,
      });
    }
  }

  const inferredDomain = inferEventWritingDomain(input);

  const result: EventWritingAuditResult = {
    eventId: input.id,
    title: input.title,
    source: input.source,
    inferredDomain,
    score,
    status,
    missingLayers,
    warnings,
    strengths,
    suggestedFixes: [],
    isDay1Safe: isDay1 && !isTooGeneric && (status !== 'fail' || score >= 45),
    isTooGeneric,
    hasConcreteScene: detectConcreteScene(text),
    hasTradeOffLanguage: detectTradeOffLanguage(text),
    hasCarryOverLanguage: detectCarryOverLanguage(text),
  };

  result.suggestedFixes = buildEventWritingSuggestedFixes(result);
  return result;
}

export function auditEventWritingBatch(
  inputs: EventWritingAuditInput[],
): EventWritingSummary {
  const results = inputs.map((i) => auditEventWriting(i));
  const pass = results.filter((r) => r.status === 'pass').length;
  const warn = results.filter((r) => r.status === 'warn').length;
  const fail = results.filter((r) => r.status === 'fail').length;
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
      : 0;

  const layerPassCounts: Record<EventWritingQualityLayer, number> = {
    district_context: 0,
    concrete_scene: 0,
    affected_actor: 0,
    operational_domain: 0,
    short_term_gain: 0,
    trade_off: 0,
    carry_over: 0,
    echo: 0,
  };

  for (const r of results) {
    for (const layer of EVENT_WRITING_LAYER_ORDER) {
      if (!r.missingLayers.includes(layer)) {
        layerPassCounts[layer] += 1;
      }
    }
  }

  const ratio = (layer: EventWritingQualityLayer) =>
    results.length > 0 ? layerPassCounts[layer] / results.length : 0;

  const weakLayers = EVENT_WRITING_LAYER_ORDER.filter((l) => ratio(l) < 0.45);
  const strongLayers = EVENT_WRITING_LAYER_ORDER.filter((l) => ratio(l) >= 0.7);

  return {
    total: results.length,
    pass,
    warn,
    fail,
    averageScore,
    weakLayers,
    strongLayers,
    nextRecommendedContentPack: 'Content Safety Pack Aşama 1: Mahalle + Konteyner Events',
  };
}

export function getEventWritingScore(input: EventWritingAuditInput): number {
  return auditEventWriting(input).score;
}
