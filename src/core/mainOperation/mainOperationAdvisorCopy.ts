import type { AdvisorLevel } from '@/core/advisors/advisorTypes';
import type { MainOperationGoalDomain } from './mainOperationTypes';

export type MainOperationAdvisorCopyEntry = {
  id: string;
  domain: MainOperationGoalDomain | 'crisis' | 'limited';
  level: AdvisorLevel;
  body: string;
};

export const MAIN_OPERATION_ADVISOR_COPY: MainOperationAdvisorCopyEntry[] = [
  {
    id: 'mo-l1-city-1',
    domain: 'city_balance',
    level: 1,
    body: 'Ana Operasyonda birden fazla sinyal aynı anda değişebilir. Bugün mahalle odağını dikkatli seçmek iyi olur.',
  },
  {
    id: 'mo-l1-vehicles-1',
    domain: 'vehicles',
    level: 1,
    body: 'Araç tarafında küçük bir baskı görünüyor olabilir. Bu görevde kapasite seçimini izlemek iyi olur.',
  },
  {
    id: 'mo-l1-containers-1',
    domain: 'containers',
    level: 1,
    body: 'Konteyner hattında hafif sıkışma olabilir. Günlük planda toplama odağını netleştirmek faydalı.',
  },
  {
    id: 'mo-l1-districts-1',
    domain: 'districts',
    level: 1,
    body: 'Mahalle kapsamı genişledikçe sinyaller dağılır. Tek hatta yoğunlaşmak kısa vadede rahatlatır.',
  },
  {
    id: 'mo-l1-assignments-1',
    domain: 'assignments',
    level: 1,
    body: 'Saha ataması uyumu bugün sezon hedeflerini etkileyebilir. Zayıf eşleşmeleri gözden geçir.',
  },
  {
    id: 'mo-l1-crisis-1',
    domain: 'crisis',
    level: 1,
    body: 'Kriz sinyali oluşuyor olabilir. Planı tek mahalleye değil, şehir baskısına göre kur.',
  },
  {
    id: 'mo-l1-limited-1',
    domain: 'limited',
    level: 1,
    body: 'Sınırlı gündemde kriz sinyali dar kapsamda izleniyor. Tam kriz yönetimi Ana Operasyon kapsamına bağlı.',
  },
  {
    id: 'mo-l2-city-1',
    domain: 'city_balance',
    level: 2,
    body: 'Şehir dengesi hedefi ile filo sinyali aynı gün çekilebilir. Dengeli çözüm rotayı korur.',
  },
  {
    id: 'mo-l2-districts-1',
    domain: 'districts',
    level: 2,
    body: 'İstasyon ve Cumhuriyet sinyalleri aynı gün yükseliyor. Planı rota ve sosyal tepki birlikte düşün.',
  },
  {
    id: 'mo-l2-vehicles-1',
    domain: 'vehicles',
    level: 2,
    body: 'Araç ve konteyner baskısı birlikte yükseliyor. Önleyici bakım bugün filo riskini yumuşatabilir.',
  },
  {
    id: 'mo-l2-containers-1',
    domain: 'containers',
    level: 2,
    body: 'Konteyner baskısı artarken hızlı müdahale kısa vadede iyi çalışır, filo sinyalini de yükseltebilir.',
  },
  {
    id: 'mo-l2-assignments-1',
    domain: 'assignments',
    level: 2,
    body: 'Güçlü saha ataması sezon hedefini destekler. Zayıf uyum kriz sinyalini büyütebilir.',
  },
  {
    id: 'mo-l2-crisis-1',
    domain: 'crisis',
    level: 2,
    body: 'Şehir baskısı kritik eşiğe yaklaşıyor. Araç ve konteyner zincirine göre plan yapmak iyi olur.',
  },
  {
    id: 'mo-l2-season-1',
    domain: 'city_balance',
    level: 2,
    body: 'Sezon hedeflerinde şehir dengesi öne çıkıyor. Bugünkü kararlar yarınki kapsamı şekillendirir.',
  },
  {
    id: 'mo-l3-city-1',
    domain: 'city_balance',
    level: 3,
    body: 'Ana Operasyon aktif. Şehir kapsamında iki hat birleşirse kriz sinyali hızlanır; önceliği erken netleştir.',
  },
  {
    id: 'mo-l3-districts-1',
    domain: 'districts',
    level: 3,
    body: 'Aktif mahallelerde farklı operasyon kimlikleri var. Merkez görünürlük, Sanayi hacim baskısı ayrı okunmalı.',
  },
  {
    id: 'mo-l3-vehicles-1',
    domain: 'vehicles',
    level: 3,
    body: 'Sanayi’de yüksek kapasite konteyner riskini düşürür, araç bakım hedefini yavaşlatabilir.',
  },
  {
    id: 'mo-l3-containers-1',
    domain: 'containers',
    level: 3,
    body: 'Konteyner temizlik odağı sosyal tepkiyi yumuşatır; rota gecikmesi riski ayrı izlenmeli.',
  },
  {
    id: 'mo-l3-assignments-1',
    domain: 'assignments',
    level: 3,
    body: 'Bugünkü atama uyumu güçlü kalırsa sezon saha atamaları hedefi ilerler. Zayıf uyum kriz riskini büyütür.',
  },
  {
    id: 'mo-l3-crisis-1',
    domain: 'crisis',
    level: 3,
    body: 'Kriz Masası birden fazla sinyali aynı hatta görüyor. Zayıf atamalar riski büyütebilir.',
  },
  {
    id: 'mo-l3-season-1',
    domain: 'assignments',
    level: 3,
    body: 'Sezon hedefleri ve günlük plan aynı hedefte birleşmezse operasyon dengesi zorlanır.',
  },
  {
    id: 'mo-l2-limited-1',
    domain: 'limited',
    level: 2,
    body: 'Sınırlı gündemde operasyon sinyalleri izleniyor; tam mahalle kapsamı Ana Operasyon ile açılır.',
  },
  {
    id: 'mo-l3-istasyon-1',
    domain: 'districts',
    level: 3,
    body: 'İstasyon hattında gecikme zinciri oluşabilir. Sabah rota çakışmasını plana erken yaz.',
  },
  {
    id: 'mo-l2-yesilvadi-1',
    domain: 'districts',
    level: 2,
    body: 'Yeşilvadi çevre hassasiyeti yükselirse sessiz operasyon ve konteyner konumu kritik olur.',
  },
  {
    id: 'mo-l1-season-1',
    domain: 'city_balance',
    level: 1,
    body: 'Sezon hedefleri tam kapsamda izleniyor. Bugünkü operasyon dengesi skorunu etkiler.',
  },
];

const FORBIDDEN = ['xp', 'premium', 'satın al', 'kilitli'] as const;

export function pickMainOperationAdvisorCopy(params: {
  level: AdvisorLevel;
  accessMode: 'full' | 'limited' | 'none';
  focusDomain?: MainOperationGoalDomain | 'crisis';
  day: number;
}): string | null {
  if (params.accessMode === 'none') {
    return null;
  }
  if (params.accessMode === 'limited') {
    const limited = MAIN_OPERATION_ADVISOR_COPY.filter(
      (c) => c.domain === 'limited' && c.level <= params.level,
    );
    if (limited.length === 0) {
      return 'Sınırlı gündemde operasyon sinyalleri dar kapsamda izlenir.';
    }
    return limited[params.day % limited.length]!.body;
  }

  const pool = MAIN_OPERATION_ADVISOR_COPY.filter(
    (c) =>
      c.domain !== 'limited' &&
      c.level === params.level &&
      (params.focusDomain == null || c.domain === params.focusDomain),
  );
  const fallback = MAIN_OPERATION_ADVISOR_COPY.filter(
    (c) => c.domain !== 'limited' && c.level === params.level,
  );
  const chosen = (pool.length > 0 ? pool : fallback)[
    params.day % Math.max(1, pool.length > 0 ? pool.length : fallback.length)
  ];
  if (!chosen) {
    return null;
  }
  const lower = chosen.body.toLowerCase();
  if (FORBIDDEN.some((w) => (w === 'xp' ? /\bxp\b/.test(lower) : lower.includes(w)))) {
    return null;
  }
  return chosen.body;
}

export function countMainOperationAdvisorCopy(): number {
  return MAIN_OPERATION_ADVISOR_COPY.length;
}
