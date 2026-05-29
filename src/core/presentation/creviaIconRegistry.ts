import type { CreviaIconDefinition, CreviaIconDomain } from './iconPresentationTypes';

function def(
  key: string,
  domain: CreviaIconDomain,
  iconName: string,
  tone: CreviaIconDefinition['tone'],
  label: string,
  description?: string,
): CreviaIconDefinition {
  return { key, domain, iconName, tone, label, description };
}

export const CREVIA_ICON_FALLBACK_KEY = 'fallback';

export const CREVIA_ICON_REGISTRY: Record<string, CreviaIconDefinition> = {
  [CREVIA_ICON_FALLBACK_KEY]: def(
    CREVIA_ICON_FALLBACK_KEY,
    'map',
    'circle',
    'neutral',
    'Gösterge',
  ),

  // authority
  authority_rank: def('authority_rank', 'authority', 'ribbon', 'teal', 'Yetki Derecesi'),
  authority_trust: def('authority_trust', 'authority', 'shield', 'blue', 'Yetki Güveni'),
  promotion_candidate: def(
    'promotion_candidate',
    'authority',
    'badge',
    'amber',
    'Terfi Adaylığı',
  ),
  formal_assignment: def(
    'formal_assignment',
    'authority',
    'medal',
    'gold',
    'Resmi Görev',
  ),
  authority_stable: def('authority_stable', 'authority', 'shield', 'teal', 'Stabil Görev'),
  authority_watching: def(
    'authority_watching',
    'authority',
    'alertTriangle',
    'amber',
    'İzleme',
  ),
  authority_promoted: def(
    'authority_promoted',
    'authority',
    'medal',
    'gold',
    'Görevlendirme',
  ),

  // badge
  badge_common: def('badge_common', 'badge', 'circleCheck', 'teal', 'Yaygın Rozet'),
  badge_uncommon: def('badge_uncommon', 'badge', 'sparkles', 'mint', 'Seçkin Rozet'),
  badge_rare: def('badge_rare', 'badge', 'shieldStar', 'amber', 'Nadir Rozet'),
  badge_epic: def('badge_epic', 'badge', 'trophy', 'gold', 'Destansı Rozet'),
  badge_operations: def('badge_operations', 'badge', 'target', 'teal', 'Operasyon'),
  badge_publicTrust: def('badge_publicTrust', 'badge', 'heart', 'mint', 'Halk Güveni'),
  badge_resources: def('badge_resources', 'badge', 'walletCards', 'green', 'Kaynak'),
  badge_personnel: def('badge_personnel', 'badge', 'users', 'mint', 'Personel'),
  badge_crisis: def('badge_crisis', 'badge', 'alertTriangle', 'coral', 'Kriz'),
  badge_authority: def('badge_authority', 'badge', 'ribbon', 'gold', 'Yetki'),
  badge_consistency: def(
    'badge_consistency',
    'badge',
    'circleCheck',
    'teal',
    'Tutarlılık',
  ),
  badge_pilot: def('badge_pilot', 'badge', 'flag', 'blue', 'Pilot'),

  // district
  district_center: def('district_center', 'district', 'building2', 'teal', 'Merkez'),
  district_cumhuriyet: def(
    'district_cumhuriyet',
    'district',
    'home',
    'mint',
    'Cumhuriyet',
  ),
  district_sanayi: def('district_sanayi', 'district', 'factory', 'amber', 'Sanayi'),
  district_istasyon: def('district_istasyon', 'district', 'route', 'blue', 'İstasyon'),
  district_yesilvadi: def(
    'district_yesilvadi',
    'district',
    'leaf',
    'green',
    'Yeşilvadi',
  ),
  district_fallback: def(
    'district_fallback',
    'district',
    'mapPin',
    'neutral',
    'Pilot Bölgesi',
  ),

  // social
  social_pulse: def('social_pulse', 'social', 'heartPulse', 'teal', 'Sosyal Nabız'),
  social_complaint: def(
    'social_complaint',
    'social',
    'messageCircleWarning',
    'amber',
    'Şikayet',
  ),
  social_praise: def('social_praise', 'social', 'heart', 'green', 'Takdir'),
  social_rumor: def('social_rumor', 'social', 'messagesSquare', 'blue', 'Söylenti'),
  social_warning: def('social_warning', 'social', 'alertTriangle', 'coral', 'Uyarı'),
  social_info: def('social_info', 'social', 'chatbubble', 'teal', 'Bilgilendirme'),

  // operation
  operation_focus: def('operation_focus', 'operation', 'target', 'teal', 'Operasyon Odağı'),
  field_operation: def('field_operation', 'operation', 'radio', 'blue', 'Saha'),
  dispatch: def('dispatch', 'operation', 'send', 'teal', 'Yönlendirme'),
  result: def('result', 'operation', 'checkCircle', 'green', 'Sonuç'),
  report: def('report', 'operation', 'clipboardList', 'teal', 'Rapor'),

  // vehicle / route / container / personnel
  vehicle: def('vehicle', 'vehicle', 'truck', 'blue', 'Araç'),
  route: def('route', 'route', 'navigation', 'teal', 'Rota'),
  container: def('container', 'container', 'archive', 'amber', 'Konteyner'),
  personnel: def('personnel', 'personnel', 'users', 'mint', 'Personel'),
  fatigue: def('fatigue', 'personnel', 'batteryWarning', 'amber', 'Yorgunluk'),

  // crisis / resource
  crisis: def('crisis', 'crisis', 'siren', 'coral', 'Kriz'),
  risk: def('risk', 'crisis', 'alertTriangle', 'amber', 'Risk'),
  resource: def('resource', 'resource', 'walletCards', 'green', 'Kaynak'),
  budget: def('budget', 'resource', 'scale', 'mint', 'Bütçe'),

  // leaderboard
  leaderboard: def('leaderboard', 'leaderboard', 'trophy', 'gold', 'Liderlik'),
  podium: def('podium', 'leaderboard', 'crown', 'gold', 'Podyum'),
  avatar_fallback: def(
    'avatar_fallback',
    'leaderboard',
    'userRound',
    'teal',
    'Operatör',
  ),

  // postPilot
  post_pilot_agenda: def(
    'post_pilot_agenda',
    'postPilot',
    'compass',
    'teal',
    'Post-Pilot Gündem',
  ),
  light_operation: def(
    'light_operation',
    'postPilot',
    'sunrise',
    'mint',
    'Hafif Operasyon',
  ),
  staged_scope: def('staged_scope', 'postPilot', 'signpost', 'blue', 'Kademeli Alan'),

  // map / report extras
  map_focus: def('map_focus', 'map', 'mapPin', 'teal', 'Harita Odağı'),
  report_summary: def('report_summary', 'report', 'clipboardList', 'teal', 'Gün Sonu'),
};

export const CREVIA_ICON_DOMAINS: CreviaIconDomain[] = [
  'authority',
  'badge',
  'district',
  'social',
  'operation',
  'vehicle',
  'container',
  'personnel',
  'crisis',
  'route',
  'resource',
  'leaderboard',
  'report',
  'postPilot',
  'map',
];
