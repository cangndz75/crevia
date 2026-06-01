# Crevia Dynamic Social Echo

## Amaç

Sosyal Nabız yüzeyinde karar yankısını oyuncunun son kararı, event domain’i, mahalle, outcome band ve carry-over sinyallerine bağlı, deterministik bir presentation katmanı ile göstermek.

## Neden gerekli?

Generic veya rastgele mention hissi, pilot ve post-pilot’ta “kararımın karşılığı var mı?” sorusunu zayıflatıyor. Dynamic Social Echo, Content Safety Pack eventEcho ve Carry-over Memory ile aynı dilde konuşur.

## Oyuncu döngüsündeki yeri

1. Oyuncu event’te karar verir.
2. Sonuç / rapor echo üretir (değişmez).
3. Sosyal Nabız açıldığında `SocialDecisionEchoCard` son kararın mahalledeki yansımasını özetler.
4. Mention listesi ve hot topic kartı bağımsız kalır; skor motoru değişmez.

## Event Echo system ile ilişki

- Öncelik 1: `buildSocialEchoMention` / `selectSocialEcho` (eventEcho social surface).
- Aynı `stableHash` determinizmi; `Math.random` yok.

## Carry-over Memory ile ilişki

- Carry-over özeti social echo için fallback olabilir.
- Result echo veya carry-over kartı ile birebir aynı cümle bastırılır; alternatif fallback seçilir.

## Event Domain UI ile ilişki

- `eventDomainFocus.socialEchoLine` üçüncü öncelik kaynağıdır.
- `social` domain’de görünürlük Day 4+ highlighted olabilir.

## Social Pulse yüzeyleri

- `SocialPulseScreen`: karar yankısı kartı (mention listesinin altında).
- `socialPulsePresentation`: view model üretimi (render-time).

## Day 1 safety

- Gün 1: `hidden` veya tutorial compact; kart render edilmez.

## Day 4 social theme

- Pilot tema günü 4 (social_pulse): echo `highlighted` görünürlük.

## Crisis-adjacent panik dili guard

- `validateSocialEchoNoPanicLanguage` felaket/panik ifadelerini reddeder.
- Metin: “izleniyor”, “dikkat çekiyor”, “risk büyümeden” tonu.

## Neyi değiştirmez?

- `applyDecision`, dayPipeline, event generation, postPilotEventEngine
- Social engine skorları, persist shape, `SAVE_VERSION`
- Yeni route, analytics SDK, IAP, harita marker

## Verify

```bash
npm run verify:dynamic-social-echo
```

## Sonraki prompt

**Crevia Report Tomorrow Preview** (`report-tomorrow-preview`)
