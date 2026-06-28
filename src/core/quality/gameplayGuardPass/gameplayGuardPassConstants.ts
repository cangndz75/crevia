import type {
  GameplayGuardPassQualityCriterion,
  GameplayGuardPassReportSection,
  GameplayGuardPassRule,
} from './gameplayGuardPassTypes';

export const GAMEPLAY_10_10_GUARD_DOCS_PATH = 'docs/crevia-gameplay-10-10-guard-pass.md';

/** Guard pass ve her alt pass sonunda zorunlu minimum komutlar. */
export const GAMEPLAY_10_10_GUARD_MINIMUM_COMMANDS = [
  'typecheck:tsc',
  'verify:gameplay-loop-qa',
  'verify:final-ui-visual-unification',
  'verify:save-version-policy',
  'verify:gameplay-guard-pass',
] as const;

/** Her feature pass sonunda eklenen minimum komutlar (ilgili feature verify hariç). */
export const GAMEPLAY_10_10_PER_PASS_MINIMUM_COMMANDS = [
  'typecheck:tsc',
  'verify:gameplay-loop-qa',
  'verify:final-ui-visual-unification',
] as const;

export const GAMEPLAY_10_10_OUT_OF_SCOPE: readonly string[] = [
  'Store listing',
  'Privacy URL',
  'IAP',
  'App Store / Play Store screenshot işleri',
  'Marketing copy',
  'Cloud save',
  'Yeni sezon sistemi',
  'Büyük backend sistemi',
  'Yeni devasa progression mimarisi',
  'SAVE_VERSION değişikliği (onaysız)',
] as const;

export const GAMEPLAY_10_10_RISKY_AREAS: readonly string[] = [
  'useGameStore.ts — yüksek blast radius',
  'Persist / migration dosyaları',
  'Hub ve Report ekranları — density riski',
  'Ece metinleri — uzunluk oyun hissini düşürür',
  'Maintenance economy — denge riski',
  'Harita — ana mutation board’a dönüşmemeli',
  'Day 1 — fazla bilgi onboarding’i zedeler',
] as const;

export const GAMEPLAY_10_10_BASE_RULES: readonly GameplayGuardPassRule[] = [
  {
    id: 'deepen_not_expand',
    title: 'Derinleştir, genişletme',
    description: 'Yeni feature eklemek yerine mevcut fonksiyonları 10/10 hissettirmeye odaklan.',
  },
  {
    id: 'small_isolated_passes',
    title: 'Küçük izole pass',
    description: 'Her pass küçük, kontrollü ve izole olmalı.',
  },
  {
    id: 'avoid_game_store_bloat',
    title: 'useGameStore karmaşasından kaçın',
    description: 'useGameStore.ts içine gereksiz yeni karmaşa ekleme.',
  },
  {
    id: 'layer_separation',
    title: 'Katman ayrımı',
    description: 'Mümkünse logic’i model/helper/presentation katmanında çöz.',
  },
  {
    id: 'runtime_mutation_justification',
    title: 'Runtime mutation gerekçesi',
    description: 'Runtime mutation gerekiyorsa açık gerekçe yaz.',
  },
  {
    id: 'no_persist_shape_change',
    title: 'Persist shape değiştirme',
    description: 'Persist shape değiştirme.',
  },
  {
    id: 'no_save_version_change',
    title: 'SAVE_VERSION değiştirme',
    description: 'SAVE_VERSION değiştirme.',
  },
  {
    id: 'save_version_approval',
    title: 'SAVE_VERSION onayı',
    description: 'SAVE_VERSION değişmesi gerçekten zorunluysa önce gerekçeyi raporla ve onay bekle.',
  },
  {
    id: 'preserve_gameplay_loop',
    title: 'Gameplay loop korunur',
    description: 'Existing gameplay loop bozulmamalı.',
  },
  {
    id: 'no_type_escape',
    title: 'Type kaçışı yok',
    description: 'Any/unknown ile type kaçışı yapma.',
  },
  {
    id: 'no_fake_pass',
    title: 'Fake PASS yok',
    description: 'Fake PASS yazma.',
  },
  {
    id: 'real_verify_assertions',
    title: 'Gerçek verify assertion',
    description:
      'Verify script sadece metin arayan yüzeysel kontrol olmamalı; gerçek davranışı koruyan assertion içermeli.',
  },
  {
    id: 'mobile_density',
    title: 'Mobil density',
    description: 'Mobil density her pass’te korunmalı.',
  },
  {
    id: 'day1_simple',
    title: 'Day 1 sade',
    description: 'Day 1 deneyimi sade kalmalı.',
  },
  {
    id: 'day8_rich_not_overwhelming',
    title: 'Day 8+ zengin ama boğmaz',
    description: 'Day 8+ deneyimi daha zengin olabilir ama oyuncuyu boğmamalı.',
  },
  {
    id: 'deterministic_copy',
    title: 'Deterministik metin',
    description: 'Her yeni metin deterministic/state-based olmalı.',
  },
  {
    id: 'no_random_copy',
    title: 'Random copy yok',
    description: 'Random copy üretme.',
  },
  {
    id: 'duplicate_content_guard',
    title: 'Duplicate content guard',
    description: 'Duplicate content guard korunmalı.',
  },
  {
    id: 'mobile_ui_safety',
    title: 'Mobil UI güvenliği',
    description: 'UI’da küçük ekran, safe area, bottom nav ve scroll davranışı düşünülmeli.',
  },
  {
    id: 'accessibility_readability',
    title: 'Erişilebilirlik',
    description: 'Accessibility ve readability bozulmamalı.',
  },
] as const;

export const GAMEPLAY_10_10_QUALITY_CRITERIA: readonly GameplayGuardPassQualityCriterion[] = [
  {
    id: 'purpose_in_5s',
    title: '5 saniyede amaç',
    description: 'Oyuncu 5 saniye içinde ekranın amacını anlamalı.',
  },
  {
    id: 'single_primary_action',
    title: 'Tek ana aksiyon',
    description: 'Ekran tek ana aksiyona yönlendirmeli.',
  },
  {
    id: 'visible_decision_impact',
    title: 'Görünür karar etkisi',
    description: 'Kararların etkisi görünür olmalı.',
  },
  {
    id: 'connected_systems',
    title: 'Bağlı sistemler',
    description: 'Sistemler birbirinden kopuk hissettirmemeli.',
  },
  {
    id: 'mobile_readable',
    title: 'Mobilde okunabilir',
    description: 'UI mobilde rahat okunmalı.',
  },
  {
    id: 'no_dashboard_clutter',
    title: 'Dashboard kalabalığı yok',
    description: 'Kart kalabalığı dashboard hissi yaratmamalı.',
  },
  {
    id: 'day1_day8_progression',
    title: 'Day 1 / Day 8+ ilerleme',
    description: 'Day 1 sade, Day 8+ zengin olmalı.',
  },
  {
    id: 'no_repetitive_copy',
    title: 'Tekrarlayan metin yok',
    description: 'Aynı metinler ve aynı sinyaller sürekli tekrar etmemeli.',
  },
  {
    id: 'consistent_outcomes',
    title: 'Tutarlı sonuçlar',
    description: 'Sonuç ekranları önceki kararlarla çelişmemeli.',
  },
  {
    id: 'verify_typecheck_pass',
    title: 'Verify ve typecheck',
    description: 'Verify ve typecheck PASS olmalı.',
  },
] as const;

export const GAMEPLAY_10_10_PASS_REPORT_SECTIONS: readonly GameplayGuardPassReportSection[] = [
  { order: 1, id: 'summary', title: 'Kısa özet' },
  { order: 2, id: 'changed_files', title: 'Değişen dosyalar' },
  { order: 3, id: 'function_polished', title: 'Hangi fonksiyon 10/10’a yaklaştırıldı?' },
  { order: 4, id: 'player_experience', title: 'Oyuncu deneyiminde ne değişti?' },
  { order: 5, id: 'day1_behavior', title: 'Day 1 davranışı' },
  { order: 6, id: 'day8_behavior', title: 'Day 8+ davranışı' },
  { order: 7, id: 'runtime_persist', title: 'Runtime/persist etkisi var mı?' },
  { order: 8, id: 'save_version', title: 'SAVE_VERSION değişti mi?' },
  { order: 9, id: 'verify_controls', title: 'Yeni veya güncellenen verify kontrolleri' },
  { order: 10, id: 'command_results', title: 'Komut sonuçları' },
  { order: 11, id: 'remaining_risks', title: 'Kalan riskler' },
  { order: 12, id: 'next_pass', title: 'Sonraki önerilen pass' },
] as const;
