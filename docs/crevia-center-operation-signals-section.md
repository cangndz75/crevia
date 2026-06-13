# Crevia — Merkez Operasyon Sinyalleri Bölümü

Operasyon Sinyalleri, şehirdeki spesifik risk, fırsat, baskı ve uyarıları maksimum 2–3 kompakt kartla gösterir.

## OperationFocus ile fark

| Modül | Seviye | Örnek |
|-------|--------|-------|
| **Operasyon Odağı** | Domain | Ulaşım · Bugünkü odak |
| **Operasyon Sinyalleri** | Spesifik olay | Rota baskısı artıyor |
| **Aktif Hedef** | Ana görev | Ulaşımı Güçlendirelim |

## Kaynak önceliği

1. `operationSignals` runtime (watch/strained/critical)
2. ActiveTarget domain bağlantısı (`isLinkedToActiveTarget`)
3. Yarın riski (`hubTomorrowRisk`)
4. Sosyal nabız (`socialPulseState`)
5. Araç bakımı / ekip uyarısı
6. Şehir yankısı / Merkez özeti risk metriği
7. Empty: “Bugün kritik sinyal yok”

## Max sinyal kuralı

- Maksimum 3, compact modda 2
- `sourceIds` duplicate yok
- Aynı domain’den en yüksek priority seçilir

## Severity / tone

- `urgent` / `warning` yalnızca gerçek kaynaklarda
- Empty ve Day 1 fake urgent üretmez
- Fırsat sinyalleri `success` tone

## Day 1

- `displayMode: compact`
- Tek teaser: “İlk sinyal hazır”
- Fake risk kartı yok

## Motion foundation

- `CreviaAnimatedPressable` press feedback
- `motionHint.shouldHighlight` statik accent
- Sonsuz pulse yok; `reducedMotion` desteklenir

## Dedupe

ActiveTarget, OperationFocus domain title’ları, Ece, CitySummary, DailyReward helper, Header notification ile birebir tekrar yok.

## Verify

```bash
npm run verify:center-operation-signals
```

## Sonraki prompt

**Hızlı İşlemler Final**

## Dosyalar

- `src/features/hub/utils/centerOperationSignalsPresentation.ts`
- `src/features/hub/components/CenterOperationSignalsSection.tsx`
