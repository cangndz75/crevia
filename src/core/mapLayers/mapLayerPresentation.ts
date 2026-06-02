import {
  CREVIA_MAP_LAYER_CATEGORY_LABELS,
  CREVIA_MAP_LAYER_FORBIDDEN_COPY_TERMS,
  CREVIA_MAP_LAYER_MAX_VISIBLE_CHIPS,
  CREVIA_MAP_LAYER_STATUS_LABELS,
} from './mapLayerConstants';
import type {
  CreviaMapLayerCategory,
  CreviaMapLayerChipModel,
  CreviaMapLayerContext,
  CreviaMapLayerId,
  CreviaMapLayerState,
  CreviaMapLayerStatus,
  CreviaMapLayerViewModel,
} from './mapLayerTypes';

export function buildMapLayerStatusLabel(status: CreviaMapLayerStatus): string {
  return CREVIA_MAP_LAYER_STATUS_LABELS[status];
}

export function buildMapLayerCategoryLabel(category: CreviaMapLayerCategory): string {
  return CREVIA_MAP_LAYER_CATEGORY_LABELS[category];
}

export function buildMapLayerChipModel(
  state: CreviaMapLayerState,
  selectedLayerId: CreviaMapLayerId,
): CreviaMapLayerChipModel {
  const isSelected = state.definition.id === selectedLayerId;
  return {
    id: state.definition.id,
    label: state.definition.shortLabel,
    status: state.status,
    iconKey: state.definition.iconKey,
    tone: state.definition.tone,
    isSelected,
    isDisabled: !state.isSelectable,
    helperText: isSelected ? buildMapLayerStatusLabel('active') : buildMapLayerStatusLabel(state.status),
  };
}

export function buildCompactMapLayerChips(
  viewModel: Pick<CreviaMapLayerViewModel, 'availableLayers' | 'previewLayers' | 'selectedLayerId'>,
): CreviaMapLayerChipModel[] {
  const selected = [...viewModel.availableLayers, ...viewModel.previewLayers].find(
    (state) => state.definition.id === viewModel.selectedLayerId,
  );
  const candidates: CreviaMapLayerState[] = [];
  if (selected) candidates.push(selected);
  for (const state of viewModel.availableLayers.sort((a, b) => a.priority - b.priority)) {
    if (!candidates.some((candidate) => candidate.definition.id === state.definition.id)) candidates.push(state);
  }
  const firstPreview = viewModel.previewLayers.sort((a, b) => a.priority - b.priority)[0];
  if (firstPreview && !candidates.some((candidate) => candidate.definition.id === firstPreview.definition.id)) {
    candidates.push(firstPreview);
  }
  return candidates
    .slice(0, CREVIA_MAP_LAYER_MAX_VISIBLE_CHIPS)
    .map((state) => buildMapLayerChipModel(state, viewModel.selectedLayerId));
}

export function buildMapLayerSummaryLine(viewModel: Pick<CreviaMapLayerViewModel, 'selectedLayerId' | 'availableLayers' | 'previewLayers'>): string {
  if (viewModel.selectedLayerId === 'base_districts') return 'Harita temel mahalle görünümünde.';
  if (viewModel.selectedLayerId === 'district_trust') return 'Mahalle güveni harita katmanına bağlanmaya hazır.';
  if (viewModel.availableLayers.some((state) => state.definition.category === 'resource')) {
    return 'Kaynak ve operasyon katmanları yetki kapsamına göre görünür.';
  }
  if (viewModel.previewLayers.length > 0) {
    return 'Harita katmanları operasyon kariyerin ilerledikçe açılır.';
  }
  return 'Harita katmanları mevcut operasyon kapsamını özetler.';
}

export function buildMapLayerUnlockHintLine(
  viewModel: Pick<CreviaMapLayerViewModel, 'previewLayers'>,
): string | undefined {
  const next = viewModel.previewLayers[0];
  if (!next) return undefined;
  if (next.definition.id === 'district_trust') {
    return 'Bölge Sorumlusu olduğunda Mahalle Güveni katmanı görünür olur.';
  }
  if (next.definition.id === 'active_task_route') {
    return 'Saha Koordinatörü yetkisi Aktif Görev Rotası görünümünü güçlendirir.';
  }
  return next.unlockLine ?? next.reasonLine;
}

export function buildMapLayerEmptyStateCopy(context: CreviaMapLayerContext = {}): string {
  if ((context.day ?? 1) <= 1) {
    return 'Harita katmanları operasyon kariyerin ilerledikçe açılır.';
  }
  return 'Bu kapsam için görünür harita katmanı henüz hazırlanıyor.';
}

export function buildSelectedLayerPanelLine(layerState: CreviaMapLayerState): string {
  switch (layerState.definition.id) {
    case 'resource_pressure':
      return 'Kaynak baskısı, araç/personel/konteyner sinyallerini öne çıkarır.';
    case 'resource_fatigue':
      return 'Kaynak yorgunluğu, bakım ve kapasite sinyallerini özetler.';
    case 'social_pulse':
      return 'Sosyal nabız, mahalle algısı ve gündem yoğunluğunu gösterir.';
    case 'crisis_watch':
      return 'Kriz izleme, risk eşiğindeki mahalleleri önceliklendirir.';
    case 'district_trust':
      return 'Mahalle güveni, uzun vadeli ilişki ve güven trendini gösterir.';
    case 'district_memory':
      return 'Mahalle hafıza izi, önceki kararların bıraktığı kısa izi gösterir.';
    case 'active_task_route':
      return 'Aktif görev rotası, seçili operasyonun saha yönünü gösterir.';
    case 'event_family_signal':
      return 'Olay ailesi sinyali, tekrar eden içerik temasını harita bağlamına hazırlar.';
    case 'operation_era':
      return 'Operasyon dönemi, uzun vadeli harita temasını görünür kılar.';
    case 'city_development':
      return 'Şehir gelişimi, ilerleyen sistemler için future harita katmanıdır.';
    case 'district_identity':
      return 'Mahalle kimliği, bölgenin karakter ve risk odağını gösterir.';
    case 'base_districts':
    default:
      return 'Temel mahalle görünümü, şehir haritasının ana katmanıdır.';
  }
}

export function mapLayerCopyContainsForbiddenTerms(text: string): string[] {
  const haystack = text.toLocaleLowerCase('tr-TR');
  return CREVIA_MAP_LAYER_FORBIDDEN_COPY_TERMS.filter((term) =>
    haystack.includes(term.toLocaleLowerCase('tr-TR')),
  );
}
