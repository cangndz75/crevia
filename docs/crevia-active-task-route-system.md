# Crevia Active Task Route System

## Amaç

Aktif görev rotası, oyuncuya seçili operasyonun saha yönünü ve kaynak baskısını gösterir. Model deterministic olarak aktif olay, assignment, kaynak sinyali ve map layer context üzerinden türetilir.

## Ne Değildir?

- Gerçek GPS değildir.
- Gerçek pathfinding değildir.
- Gerçek rota optimizasyonu değildir.
- Araç simülasyonu değildir.
- Persisted logistics state değildir.

## Active Route Modeli

- Source node: güvenli fallback olarak Operasyon Merkezi.
- Target district: aktif olay, seçili olay veya assignment bağlamından türetilir.
- Route stage: planned, assigned, dispatch_ready, en_route, on_site, completed gibi presentation stage.
- Route status: inactive, ready, active, delayed, strained, blocked, completed veya preview.
- Pressure: low, medium, high veya critical.
- Risk line: kaynak, kriz, ekip ve domain sinyalinden kısa oyuncu metni.
- Compact chips: stage, pressure ve domain.

## Dispatch Bağlantısı

Dispatch yüzeyinde ekip/araç ataması sonrasında route preview üretilebilir. Bu patch mevcut dispatch component davranışını değiştirmez; compact presentation model sağlar.

## Field Bağlantısı

Field yüzeyinde saha aşaması başladığında route stage/status line üretilebilir. Bu patch mevcut field component davranışını değiştirmez; field surface için compact presentation model sağlar.

## Map Layer Bağlantısı

`active_task_route` map layer foundation ile uyumlu helper vardır. `getActiveTaskRouteMapLayerContext` helper çıktısı future map layer context için `hasActiveTask`, `routeStatus` ve `routePressure` sağlar. Bu patch map layer unlock davranışını değiştirmez.

## Rank Permission Bağlantısı

String-level uyum için `assignment_fit_preview`, `map_resource_layer` ve `active_task_route` referansları tutulur. Rank permission engine değiştirilmez.

## District Trust Ve Resource Bağlantısı

Target district future district trust risk line bağlamına uygun tutulur. Operational resource ve resource fatigue sinyalleri route pressure için safe heuristic olarak okunabilir. District trust scoring ve operational resources engine değiştirilmez.

## Bu Patchin Sınırları

- SAVE_VERSION yok
- Persist yok
- pathfinding yok
- event generation yok
- applyDecision yok
- dayPipeline yok
- UI redesign yok

## Sonraki Patch Bağlantıları

- Active Route UI Polish
- Vehicle Maintenance Window
- Team Specialization
- Real Route Optimization Lite
- District-Specific Operations
