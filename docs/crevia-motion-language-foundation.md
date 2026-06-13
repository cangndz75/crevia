# Crevia — Motion Language Foundation (Merkez)

Bu belge Merkez sayfası için motion/animasyon dilini açıklar. Global motion foundation (`src/core/motion/motionConstants.ts`) ile birlikte çalışır.

## Felsefe

- Kısa, kontrollü mikro etkileşimler
- Oyuncuyu bekletmeyen giriş animasyonları
- Reduced motion tam destek
- Sonsuz pulse/glow yok
- Scroll performansını bozan state animasyonu yok

**Teknik:** Mevcut `react-native-reanimated ~4.1.1` kullanılır; yeni dependency eklenmedi.

## Token'lar

Kaynak: `src/core/motion/motionTokens.ts`

| Grup | Örnek |
|------|--------|
| duration | press 90ms, fast 160ms, normal 220ms, reveal 420ms |
| delay | staggerSmall 45ms, staggerMedium 75ms |
| scale | press 0.975, ctaPulse 1.025 |
| pulse | softRepeatCount 2, maxLoopMs 2200 |

Kart girişi reveal süresi ≤ 500ms hedefi; stagger toplamı kısa tutulur.

## Preset'ler

Kaynak: `src/core/motion/motionPresets.ts`  
Hook'lar: `src/shared/motion/useCenterMotionPresets.ts`

- `centerCtaPulse` — sınırlı tekrarlı CTA dikkat
- `centerRewardPulse` — ödül available + ctaEnabled
- `centerSpeechReveal` — Ece recommendation fade
- `centerAvatarAttention` — avatar hafif attention
- `centerProgressHighlight` — aktif hedef progress vurgusu

## Reduced motion

`useCreviaReducedMotion()` (`src/core/motion/motionAccessibility.ts`):

- Giriş animasyonu kapalı
- Pulse/glow kapalı
- Press scale sade veya kapalı

## Merkez kart girişi

`CenterMotionEnter` → `CreviaAnimatedCard` (`surface="hub"`)

Sıra: Header (0) → Özet (1) → Günlük Ödül (2) → Aktif Hedef (3) → Ece (4)

Hub cap: max 3 giriş animasyonu (`MOTION_DENSITY_CAPS.hub`); index ≥ 3 disabled.

## Motion hook bağlantıları

### Aktif Hedef (`HubActiveTaskCardStack`)

- `shouldPulseCta` + `cta.enabled` → `useCenterCtaPulse`
- `shouldHighlightProgress` → progress bar highlight
- `revealLevel: strong` → border accent (statik, agresif flash yok)

### Günlük Ödül (`CenterDailyRewardRoute`)

- `pulseAvailable && ctaEnabled` → animated pulse
- `pulseAvailable && !ctaEnabled` → statik teaser border only

### Ece (`CenterAdvisorCard`)

- `shouldRevealSpeech` → recommendation fade
- `shouldPulseAvatar` / `attentionLevel` → avatar attention
- Compact mode → minimal animasyon

## Yasaklar

- Sonsuz `withRepeat(-1)` pulse
- Her kartın aynı anda parlaması
- Uzun sinematik bekleme
- setInterval animasyon zincirleri
- Lottie/Rive (bu fazda yok)

## Sonraki motion işleri

- Inspect Phase Interaction Pass
- Plan Phase Strategy Board Pass
- Reward Claim Celebration
- Result Impact Reveal

## Verify

```bash
npm run verify:center-motion
npm run verify:motion-foundation
```
