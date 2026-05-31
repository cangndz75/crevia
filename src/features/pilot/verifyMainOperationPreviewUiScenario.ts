import { SAVE_VERSION } from '@/store/gamePersist';
import {
  ROADMAP_STEPS,
  STATUS_CHIPS,
  SYSTEM_CARDS,
} from '@/features/pilot/components/operation-preview/operationPreviewData';

const FORBIDDEN_WORDS = ['paywall', 'premium', 'satın al', 'satın alma'];

const REQUIRED_COPY = [
  'Ana Operasyon Önizlemesi',
  'Pilot bölge tamamlandı, Şehir ölçeği yakında açılıyor.',
  'Pilot Tamamlandı',
  '7 Günlük Rapor Hazır',
  'Yetki İzleniyor',
  'Yetki Durumu',
  'Sıradaki Kapsam',
  'Şehir Ölçeğine',
  'Geçiş Hazırlanıyor',
  'Açılacak Sistemler',
  'Açılış Yol Haritası',
  'Liderliği Gör',
  'Başarılarım',
  'Pilot Raporuna Dön',
];

const FORBIDDEN_LEGACY_COPY = [
  'Ana Operasyon Kilitli',
  'Merkeze Dön',
  'Operasyon Gündemini Başlat',
];

export type VerifyMainOperationPreviewUiOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail?: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail ?? pass}`);
  return ok;
}

export function verifyMainOperationPreviewUiScenario(): VerifyMainOperationPreviewUiOutcome {
  const checks: string[] = [];
  let ok = true;

  ok = assert(checks, STATUS_CHIPS.length === 3, 'status card count 3') && ok;
  ok =
    assert(
      checks,
      STATUS_CHIPS.some((c) => c.id === 'authority-tracking'),
      'authority tracking status card exists',
    ) && ok;
  ok =
    assert(
      checks,
      !STATUS_CHIPS.some((c) => c.id === 'main-locked'),
      'eski Ana Operasyon Kilitli chip kaldırıldı',
    ) && ok;
  ok = assert(checks, SYSTEM_CARDS.length === 4, 'systems grid count 4') && ok;
  ok = assert(checks, ROADMAP_STEPS.length === 4, 'roadmap steps count 4') && ok;
  ok =
    assert(
      checks,
      ROADMAP_STEPS.some((s) => s.title === 'Şehir Ölçeği'),
      'roadmap includes Şehir Ölçeği step',
    ) && ok;
  ok =
    assert(
      checks,
      ROADMAP_STEPS[0]?.title === 'Pilot Bölge',
      'roadmap step 1 Pilot Bölge',
    ) && ok;

  const dataCopy = [
    ...STATUS_CHIPS.flatMap((c) => [c.label, c.description ?? '']),
    ...SYSTEM_CARDS.flatMap((c) => [c.title, c.description, c.tag, c.statusTag]),
    ...ROADMAP_STEPS.flatMap((s) => [s.title, s.statusLabel]),
    ...REQUIRED_COPY,
  ]
    .join(' ')
    .toLowerCase();

  ok =
    assert(
      checks,
      REQUIRED_COPY.every((line) => dataCopy.includes(line.toLowerCase())),
      'zorunlu copy data katmanında mevcut',
    ) && ok;

  const forbiddenHit = FORBIDDEN_WORDS.filter((word) => dataCopy.includes(word));
  ok =
    assert(
      checks,
      forbiddenHit.length === 0,
      'forbidden words yok',
      forbiddenHit.join(', '),
    ) && ok;

  const legacyHit = FORBIDDEN_LEGACY_COPY.filter((line) =>
    dataCopy.includes(line.toLowerCase()),
  );
  ok =
    assert(
      checks,
      legacyHit.length === 0,
      'eski footer/cta copy ekranda kullanılmıyor',
      legacyHit.join(', '),
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 12, 'SAVE_VERSION değişmedi (12)') && ok;

  return { ok, checks };
}
