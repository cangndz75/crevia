import { AUTHORITY_PERMISSION_BY_ID } from './authorityConstants';
import { createInitialAuthorityState, normalizeAuthorityState } from './authoritySeed';
import type {
  AuthorityPermissionId,
  AuthorityState,
} from './authorityTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';

export type AuthorityPermissionPreviewTone =
  | 'active'
  | 'locked_preview'
  | 'watching';

export type AuthorityPermissionPreview = {
  visible: boolean;
  tone: AuthorityPermissionPreviewTone;
  title: string;
  line: string;
  requiredPermissionId?: AuthorityPermissionId;
  currentPermissionUnlocked?: boolean;
};

export type SelectAuthorityPermissionPreviewInput = {
  authorityState?: unknown;
  decision?: unknown;
  event?: unknown;
  day?: number;
};

const HIDDEN_PREVIEW: AuthorityPermissionPreview = {
  visible: false,
  tone: 'watching',
  title: '',
  line: '',
};

const PERMISSION_PRIORITY: AuthorityPermissionId[] = [
  'unit_chief_scope',
  'district_expansion_preview',
  'operations_responsible_scope',
  'promotion_review_eligible',
  'field_priority_note',
  'daily_preparation_authority',
];

const PERMISSION_COPY: Record<
  AuthorityPermissionId,
  {
    activeLine: string;
    lockedLine: string;
    watchingLine: string;
    activeTitle: string;
    lockedTitle: string;
    watchingTitle: string;
  }
> = {
  basic_operations: {
    activeLine: 'Temel operasyon yetkisi bu hamleyi destekliyor.',
    lockedLine: 'İleri yetkide bu hamle daha görünür hale gelir.',
    watchingLine: 'Temel operasyon akışında izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
  daily_preparation_authority: {
    activeLine: 'Günlük hazırlık izni bu hamleyi destekliyor.',
    lockedLine:
      'Günlük hazırlık izni ileri yetkide bu kararı daha net destekler.',
    watchingLine: 'Günlük hazırlık akışında izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
  field_priority_note: {
    activeLine: 'Saha öncelik notu bu kararı görünür kılar.',
    lockedLine: 'Saha öncelik notu ileri yetkide bu kararı daha belirgin yapar.',
    watchingLine: 'Saha önceliği değerlendirmesinde izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
  promotion_review_eligible: {
    activeLine: 'Bu karar terfi değerlendirmesinde kayda geçer.',
    lockedLine: 'Bu karar ileri yetkide terfi değerlendirmesinde daha güçlü izlenir.',
    watchingLine: 'Bu karar terfi değerlendirmesinde izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
  operations_responsible_scope: {
    activeLine: 'Operasyon Sorumlusu kapsamı bu kararı destekliyor.',
    lockedLine:
      'Operasyon Sorumlusu kapsamı bu kararı daha etkili hale getirir.',
    watchingLine: 'Operasyon kapsamı değerlendirmesinde izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
  district_expansion_preview: {
    activeLine: 'Bölge genişletme yetkisi bu kararın kapsamını büyütebilir.',
    lockedLine:
      'Bölge genişletme yetkisi ileri yetkide bu kararın kapsamını genişletir.',
    watchingLine: 'Bölge kapsamı değerlendirmesinde izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
  unit_chief_scope: {
    activeLine: 'Birim Şefi kapsamı bu tür kararları stratejik hale getirir.',
    lockedLine:
      'Birim Şefi kapsamı bu tür kararları daha stratejik hale getirir.',
    watchingLine: 'Birim düzeyi değerlendirmede izlenir.',
    activeTitle: 'Yetki desteği',
    lockedTitle: 'İleri yetkide güçlenir',
    watchingTitle: 'Yetki notu',
  },
};

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function includesAny(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function buildDecisionHaystack(
  decision: unknown,
  event: unknown,
): string {
  const parts: string[] = [];

  if (isRecord(decision)) {
    parts.push(
      readString(decision.id),
      readString(decision.title),
      readString(decision.description),
      readString(decision.style),
      readString(decision.decisionStyle),
      readString(decision.contentStrategyLabel),
      readString(decision.contentPriorityHint),
    );
    if (isRecord(decision.effects)) {
      parts.push(JSON.stringify(decision.effects));
    }
    if (isRecord(decision.costs)) {
      parts.push(JSON.stringify(decision.costs));
    }
  }

  if (isRecord(event)) {
    parts.push(
      readString(event.id),
      readString(event.title),
      readString(event.description),
      readString(event.category),
      readString(event.eventType),
      readString(event.contextTag),
      readString(event.riskLevel),
      readString(event.neighborhoodId),
      readString(event.district),
    );
    if (Array.isArray(event.districtIds)) {
      parts.push(...event.districtIds.map((item) => readString(item)));
    }
    if (Array.isArray(event.filterTags)) {
      parts.push(...event.filterTags.map((item) => readString(item)));
    }
    if (isRecord(event.butterflyMeta)) {
      parts.push(readString(event.butterflyMeta.label));
      parts.push(readString(event.butterflyMeta.hookId));
    }
  }

  return parts.filter(Boolean).join(' ').toLowerCase();
}

function readDecision(decision: unknown): EventDecision | null {
  if (!isRecord(decision)) return null;
  if (typeof decision.id !== 'string' || typeof decision.title !== 'string') {
    return null;
  }
  return decision as unknown as EventDecision;
}

function readEvent(event: unknown): EventCard | null {
  if (!isRecord(event)) return null;
  if (typeof event.id !== 'string' || typeof event.title !== 'string') {
    return null;
  }
  return event as unknown as EventCard;
}

function isLowImpactDecision(decision: unknown, haystack: string): boolean {
  if (includesAny(haystack, ['monitor', 'izle', 'stay_silent', 'sessiz', 'none_action'])) {
    return true;
  }

  const parsed = readDecision(decision);
  if (!parsed) {
    return false;
  }

  if (parsed.decisionStyle === 'communication') {
    const effects = parsed.effects ?? {
      publicSatisfaction: 0,
      budget: 0,
      morale: 0,
      risk: 0,
      xp: 0,
    };
    const impact =
      Math.abs(effects.publicSatisfaction) +
      Math.abs(effects.budget) +
      Math.abs(effects.morale ?? 0) +
      Math.abs(effects.risk);
    if (
      impact <= 8 &&
      !includesAny(haystack, [
        'dispatch',
        'permanent',
        'crisis',
        'kritik',
        'field',
        'saha',
      ])
    ) {
      return true;
    }
  }

  return false;
}

function scorePermissionMatch(
  permissionId: AuthorityPermissionId,
  haystack: string,
  event: EventCard | null,
  decision: EventDecision | null,
): number {
  switch (permissionId) {
    case 'daily_preparation_authority':
      if (
        includesAny(haystack, [
          'hazırlık',
          'preparation',
          'route_preparation',
          'field_duty',
          'devriye',
          'patrol',
          'neighborhood_patrol',
          'plan',
          'planned',
          'öncelik',
          'priority',
          'social_response',
          'communicate',
          'iletişim',
        ])
      ) {
        return 12;
      }
      return 0;
    case 'field_priority_note':
      if (
        includesAny(haystack, [
          'dispatch',
          'sevk',
          'prioritize_route',
          'rota',
          'team assignment',
          'ekip',
          'complaint',
          'şikayet',
        ]) ||
        (includesAny(haystack, ['field', 'saha']) &&
          includesAny(haystack, ['intervention', 'müdahale']))
      ) {
        return 11;
      }
      return 0;
    case 'promotion_review_eligible': {
      const highSeverity =
        event?.riskLevel === 'high' ||
        event?.riskLevel === 'critical' ||
        includesAny(haystack, ['critical', 'kritik', 'high severity', 'yüksek risk']);
      const followUp = includesAny(haystack, [
        'butterfly',
        'follow-up',
        'followup',
        'kelebek',
        'final stress',
        'pilot final',
      ]);
      const crisisTag = includesAny(haystack, ['crisis', 'kriz']);
      if (highSeverity || followUp || crisisTag) {
        return highSeverity ? 13 : 10;
      }
      return 0;
    }
    case 'operations_responsible_scope':
      if (
        includesAny(haystack, [
          'permanent',
          'permanent_solution',
          'kalıcı',
          'add_capacity',
          'maintenance',
          'bakım',
          'route optimization',
          'container',
          'konteyner',
          'vehicle',
          'araç',
        ])
      ) {
        return 12;
      }
      return 0;
    case 'district_expansion_preview': {
      const multiDistrict = (event?.districtIds?.length ?? 0) >= 2;
      if (
        multiDistrict ||
        includesAny(haystack, [
          'multi-neighborhood',
          'district signal',
          'expansion',
          'genişleme',
          'bölge',
          'map',
          'harita',
        ])
      ) {
        return multiDistrict ? 14 : 10;
      }
      return 0;
    }
    case 'unit_chief_scope': {
      const heavyBudget =
        (decision?.costs?.budget ?? 0) >= 40 ||
        (decision?.effects?.budget ?? 0) <= -30;
      const strategicScope = includesAny(haystack, [
        'department-wide',
        'multi-system',
        'department',
        'birim şefi',
        'birim geneli',
      ]);
      const crisisHeavy =
        strategicScope &&
        (event?.riskLevel === 'high' ||
          event?.riskLevel === 'critical' ||
          includesAny(haystack, ['high severity', 'yüksek risk']));
      if (heavyBudget || crisisHeavy) {
        return crisisHeavy ? 13 : 11;
      }
      return 0;
    }
    default:
      return 0;
  }
}

function resolveBestPermissionMatch(
  haystack: string,
  event: EventCard | null,
  decision: EventDecision | null,
): AuthorityPermissionId | null {
  let bestId: AuthorityPermissionId | null = null;
  let bestScore = 0;

  for (const permissionId of PERMISSION_PRIORITY) {
    const score = scorePermissionMatch(permissionId, haystack, event, decision);
    if (score > bestScore) {
      bestScore = score;
      bestId = permissionId;
    }
  }

  return bestScore >= 8 ? bestId : null;
}

function hasUnlockedPermission(
  authorityState: AuthorityState,
  permissionId: AuthorityPermissionId,
): boolean {
  return authorityState.unlockedPermissionIds.includes(permissionId);
}

export function buildAuthorityPermissionPreviewTone(
  permissionId: AuthorityPermissionId,
  unlocked: boolean,
): AuthorityPermissionPreviewTone {
  if (permissionId === 'promotion_review_eligible') {
    return 'watching';
  }
  return unlocked ? 'active' : 'locked_preview';
}

export function buildAuthorityPermissionPreviewLine(
  permissionId: AuthorityPermissionId,
  tone: AuthorityPermissionPreviewTone,
): { title: string; line: string } {
  const copy = PERMISSION_COPY[permissionId];
  if (tone === 'active') {
    return { title: copy.activeTitle, line: copy.activeLine };
  }
  if (tone === 'locked_preview') {
    return { title: copy.lockedTitle, line: copy.lockedLine };
  }
  return { title: copy.watchingTitle, line: copy.watchingLine };
}

export function selectAuthorityPermissionPreviewForDecision(
  input: SelectAuthorityPermissionPreviewInput,
): AuthorityPermissionPreview {
  const day = Math.max(1, typeof input.day === 'number' ? input.day : 1);
  if (day <= 1) {
    return HIDDEN_PREVIEW;
  }

  const authorityState = normalizeAuthorityState(
    input.authorityState ?? createInitialAuthorityState(day),
    day,
  );
  const decision = readDecision(input.decision);
  const event = readEvent(input.event);
  const haystack = buildDecisionHaystack(input.decision, input.event);

  if (!decision || isLowImpactDecision(decision, haystack)) {
    return HIDDEN_PREVIEW;
  }

  const permissionId = resolveBestPermissionMatch(haystack, event, decision);
  if (!permissionId || !AUTHORITY_PERMISSION_BY_ID[permissionId]) {
    return HIDDEN_PREVIEW;
  }

  const unlocked = hasUnlockedPermission(authorityState, permissionId);
  const tone = buildAuthorityPermissionPreviewTone(permissionId, unlocked);
  const { title, line } = buildAuthorityPermissionPreviewLine(permissionId, tone);

  return {
    visible: true,
    tone,
    title,
    line,
    requiredPermissionId: permissionId,
    currentPermissionUnlocked: unlocked,
  };
}
