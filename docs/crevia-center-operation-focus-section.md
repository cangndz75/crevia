# Crevia — Merkez Operasyon Odağı Bölümü

Operasyon Odağı, Merkez sayfasında ulaşım, çevre, enerji, sosyal, lojistik ve bakım alanlarını kompakt kartlarla gösterir. Oyuncu bugün hangi alanın öne çıktığını, hangisinin riskli veya sakin olduğunu buradan okur.

## Amaç

- Domain seviyesinde yönlendirme (aktif hedef spesifik görev anlatır)
- Operasyon sinyalleri ve Ece ile çakışmayan kısa metinler
- Day 1 sade teaser; ilerleyen günlerde gerçek state bağlantısı

## Kaynak önceliği

1. **Aktif hedef domain** — `isActiveTargetDomain`, ilk sıra / `selectedDomain`
2. **OperationSignals** — tone ve priority (urgent/high → warning/urgent)
3. **MainOperationFeel** — görünür ana operasyon satırı
4. **CitySummary / socialPulse / bakım** — sosyal baskı, kaynak baskısı, araç bakımı
5. **Day 1 fallback** — 3 kilitli teaser kart (İlk Operasyon, Planlama, Saha Akışı)
6. **Empty fallback** — sakin domain kartları; fake risk yok

## Kart kuralları

- Maksimum 4, tercihen 3 item
- Duplicate domain yok (locked Day 1 hariç)
- `displayMode`: compact (1–2), carousel (3–4), locked, empty

## ActiveTarget ilişkisi

- Kart başlığı domain adıdır (`Ulaşım`), aktif hedef başlığını tekrar etmez
- Aktif domain: `statusLabel: Bugünkü odak`, hafif border accent

## Motion foundation

- `CreviaAnimatedPressable` press feedback
- Aktif domain statik highlight (sonsuz pulse yok)
- `reducedMotion` prop ile sadeleşme
- Hub motion density cap değişmedi

## Dedupe

OperationFocus şunlarla birebir tekrar etmez:

- ActiveTarget title/description
- Ece recommendation/contextLine
- OperationSignals section title’ları
- CitySummary primaryInsight

## Verify

```bash
npm run verify:center-operation-focus
```

## Sonraki prompt

**Operasyon Sinyalleri Final** — detay kartları, hub satır modeli ve sinyal listesi polish.

## Dosyalar

- `src/features/hub/utils/centerOperationFocusPresentation.ts`
- `src/features/hub/components/CenterOperationFocusSection.tsx`
- `src/features/hub/utils/centerHomePresentation.ts` (orchestrator)
