# Crevia Quality Audit

Soft-launch öncesi performans, render stabilitesi, import sınırları ve store sorumlulukları için kalite denetimi.

Kaynak: `src/core/quality/` · Çalıştırma: `npm run verify:quality-audit`

---

## 1. Genel sağlık özeti

Bu denetim **yeni özellik eklemez**; riskleri görünür kılar ve küçük güvenli düzeltmelere izin verir.

| Health | Anlamı |
|--------|--------|
| **PASS** | Kritik mimari ihlal yok; düşük/orta uyarılar sınırlı |
| **WARN** | core→features production import, ağır ekranlar veya layout guard eksikleri |
| **FAIL** | Icon/postPilot UI import, sonsuz animasyon, yasaklı kelime veya kritik import ihlali |

Otomatik sonuç verify çıktısında `Quality audit health:` satırında raporlanır.

---

## 2. Architecture boundary değerlendirmesi

### Katman kuralları

| Katman | Sorumluluk |
|--------|------------|
| `core/*` | Oyun kuralları, engine, presentation registry, audit |
| `features/*` | Ekranlar, bileşenler, feature presentation |
| `store/*` | Persist + orchestration action’ları |

### Bilinen sınırlar

- **Production core → features**: Bazı dosyalar (`buildDailyReport`, `postPilotEventEngine`, `liveFlow`, `uxFlowPresentation`) feature util/type import eder. Bu **WARN** üretir; verify-only importlar kabul edilir.
- **Icon registry**: UI React component import etmemeli; yalnızca Ionicon resolve.
- **Post-pilot UX presentation**: `postPilotOperationUxPresentation.ts` map label helper kullanır; React component yok.
- **Barrel export**: `postPilot/index.ts` verify senaryolarını export etmemeli (mobil bundle `node:fs` riski).

---

## 3. Store action sorumlulukları

### `endCurrentDay` (yüksek yoğunluk)

Tetiklenen domain’ler: personnel, containers, vehicles, social, dailyGoals, dailyPriority, butterfly, carryOver, authority, badges, endDay engine, pilot snapshot.

**Risk:** high — bilinçli monolith orchestration.  
**Gelecek refactor:** `runEndOfDayPipeline` pure orchestrator + ince store wrapper.

### `completePilot` (orta)

Tetiklenen domain’ler: authority evaluation, badge evaluation, pilot run finalize, postPilot seed, leaderboard persist, daily report merge.

**Risk:** medium.  
**Gelecek refactor:** `pilotCompletionOrchestrator` modülü.

### `startLightMainOperation` (düşük)

Post-pilot faz, city day, `refreshPilotEventsFromGameState`. Pilot completed dışında yan etki yok.

### Event refresh ayrımı

- Pilot: `refreshPilotEventsFromGameState` / pilot event engine  
- Post-pilot: `ensurePostPilotDailyEvents` / post-pilot event engine  
- Günlük cap: **2 aktif event** (post-pilot light)

---

## 4. Render/performance riskleri

| Ekran | Not | Tipik risk |
|-------|-----|------------|
| HubScreen | Çok bileşen, koşullu layout | medium — tüm `gameState` okuma |
| EndOfDayReportView | Meta progression bölümleri | medium |
| ProfileScreen | Authority + badge + prestige | medium |
| MapScreen | SVG + strip + panel | medium–high |
| SocialPulseScreen | Mention listesi | medium |
| LeaderboardScreen | Podium + liste | low–medium |
| EventDetailDecisionScreen | Workflow fazları | high — büyük dosya |

**Öneri:** Dar Zustand selector, `useShallow`, alt kartlarda `React.memo`, liste giriş animasyonu kullanma.

---

## 5. Animation layer değerlendirmesi

- Token süreleri: fast 120ms, normal 180ms, slow 260ms (**< 300ms**)
- `selectedPulse`: `endlessLoop: false`, sınırlı `withRepeat`
- Entrance: uzun listelerde **kullanılmamalı**
- `reduceMotion` parametreleri hook’larda mevcut
- `CreviaAnimatedPressable`: yalnızca press scale; callback davranışını değiştirmez

Aşama 1 animasyonlu bileşenler: Hub CTA, workflow footer, report CTA, MapPin pulse, podium/badge/result girişleri.

---

## 6. Text overflow guard durumu

Kritik bileşenlerde üçlü guard hedeflenir:

- `numberOfLines`
- `flexShrink`
- `minWidth` (veya `minWidth: 0` flex child)

Verify, `CRITICAL_UI_GUARD_TARGETS` listesini dosya içeriğinde tarar. Faz wrapper’ları (`EventDispatchPhase`) alt kart dosyalarıyla birlikte değerlendirilir.

---

## 7. Verify/analyze script matrisi

| Script | Rol |
|--------|-----|
| `verify:full-loop` | 7 gün simülasyon, SAVE_VERSION |
| `verify:full-ux-flow` | Ekran render path + yasaklı kelime |
| `verify:meta-progression` | Authority/badge/report köprüsü |
| `verify:post-pilot-loop-balance` | Gün 8+ cap ve event üretimi |
| `verify:badges` / `verify:authority` | Domain kuralları |
| `verify:animation-presentation` | Mikro animasyon |
| `verify:icon-presentation` | Icon registry |
| `verify:event-authoring` | İçerik planı |
| `verify:quality-audit` | Bu denetim |

`analyze:*` scriptleri balance/rapor içindir; `verify:*` regression içindir.

---

## 8. Kritik riskler

- Production core’un `@/features` importları (type/util taşınmalı)
- HubScreen tam `gameState` subscription
- `postPilot/index` verify export’u (bundle’da `node:fs`)
- Verify dosyalarının app barrel’ına girmesi

---

## 9. Orta vadeli refactor önerileri

1. End-of-day pipeline’ı store dışına pure fonksiyon olarak çıkar  
2. core/contracts altında paylaşılan UI-facing tipler  
3. Hub/Map için view-model selector hook’ları  
4. Feature verify’ları app import graph’ından izole tut  
5. Event içeriklerini `eventAuthoring` standardına göre paket paket ekle  

---

## 10. Şimdi yapılmaması gerekenler

- Store rewrite veya `endCurrentDay` sıra değişikliği (açık bug yoksa)  
- Event generation / pilot template büyük refactor  
- SAVE_VERSION veya persist şema değişikliği  
- Yeni route / navigation yapısı  
- UI redesign veya yeni npm bağımlılığı  
- Tam çoklu mahalle simülasyonu bu patch kapsamında değil  

---

## İlgili komutlar

```bash
npm run typecheck
npm run verify:quality-audit
npm run verify:animation-presentation
npm run verify:icon-presentation
npm run verify:event-authoring
npm run verify:full-ux-flow
npm run verify:meta-progression
npm run verify:post-pilot-loop-balance
npm run verify:full-loop
```
