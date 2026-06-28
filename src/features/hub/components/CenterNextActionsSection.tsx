import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { CenterNextActionsPresentation } from '@/features/hub/utils/centerHubGameplayPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { pushHubRoute } from './centerLowerDashboardShared';

type IconName = keyof typeof Ionicons.glyphMap;

type CenterNextActionsSectionProps = {
  presentation: CenterNextActionsPresentation;
  excludeActionIds?: string[];
  reducedMotion?: boolean;
};

function resolveIconName(iconKey: string | undefined, fallback: IconName = 'flash-outline'): IconName {
  if (iconKey && iconKey in Ionicons.glyphMap) return iconKey as IconName;
  return fallback;
}

function accentStyle(accent: CenterNextActionsPresentation['actions'][number]['accent']) {
  switch (accent) {
    case 'gold':
      return styles.cardGold;
    case 'amber':
      return styles.cardAmber;
    case 'sage':
      return styles.cardSage;
    default:
      return styles.cardGreen;
  }
}

function NextActionCard({
  action,
  layout,
  reducedMotion,
}: {
  action: CenterNextActionsPresentation['actions'][number];
  layout: 'row' | 'wide' | 'compact';
  reducedMotion: boolean;
}) {
  const router = useRouter();

  return (
    <CreviaAnimatedPressable
      onPress={() => {
        if (action.routeKey) pushHubRoute(router, action.routeKey);
      }}
      reducedMotion={reducedMotion}
      pressScale={0.975}
      disabled={action.disabled || !action.routeKey}
      accessibilityRole="button"
      accessibilityLabel={`${action.title}. ${action.subtitle ?? ''}`}
      style={[
        styles.card,
        accentStyle(action.accent),
        layout === 'compact' ? styles.cardCompact : layout === 'wide' ? styles.cardWide : styles.cardDefault,
      ]}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name={resolveIconName(action.iconKey)} size={17} color="#F5E3AF" />
        </View>
        {action.statusLabel ? (
          <Text style={styles.statusLabel} numberOfLines={1}>
            {action.statusLabel}
          </Text>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {action.title}
      </Text>
      {action.subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {action.subtitle}
        </Text>
      ) : null}
    </CreviaAnimatedPressable>
  );
}

export function CenterNextActionsSection({
  presentation,
  excludeActionIds = [],
  reducedMotion = false,
}: CenterNextActionsSectionProps) {
  const router = useRouter();
  const excludedIds = new Set(excludeActionIds);
  const visibleActions = presentation.actions.filter((action) => !excludedIds.has(action.id));

  if (presentation.visibility !== 'visible' || visibleActions.length === 0) {
    return null;
  }

  const count = visibleActions.length;
  const layout = count === 1 ? 'compact' : count === 2 ? 'wide' : 'row';

  if (count === 1 && layout === 'compact') {
    const action = visibleActions[0]!;
    return (
      <View style={styles.section}>
        <Text style={styles.heading} numberOfLines={1}>
          {presentation.title.toUpperCase()}
        </Text>
        <CreviaAnimatedPressable
          onPress={() => {
        if (action.routeKey) pushHubRoute(router, action.routeKey);
      }}
          reducedMotion={reducedMotion}
          pressScale={0.98}
          disabled={!action.routeKey}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          style={[styles.compactRow, accentStyle(action.accent)]}>
          <Ionicons name={resolveIconName(action.iconKey)} size={18} color="#F5E3AF" />
          <View style={styles.compactCopy}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {action.title}
            </Text>
            {action.subtitle ? (
              <Text style={styles.compactSubtitle} numberOfLines={1}>
                {action.subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#F5E3AF" />
        </CreviaAnimatedPressable>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading} numberOfLines={1}>
        {presentation.title.toUpperCase()}
      </Text>
      <View style={styles.row}>
        {visibleActions.map((action) => (
          <NextActionCard
            key={action.id}
            action={action}
            layout={layout}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(7,86,79,0.08)',
    backgroundColor: '#FFFCF5',
    padding: 14,
    gap: 10,
    shadowColor: 'rgba(15, 60, 52, 0.10)',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  heading: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#173D3A',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  card: {
    minWidth: 0,
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    padding: 9,
    gap: 6,
  },
  cardDefault: {
    flex: 1,
  },
  cardWide: {
    flex: 1,
  },
  cardCompact: {
    width: '100%',
  },
  cardGreen: {
    backgroundColor: '#0D3F39',
    borderColor: 'rgba(157,242,210,0.18)',
  },
  cardGold: {
    backgroundColor: '#8F7429',
    borderColor: 'rgba(245,227,175,0.30)',
  },
  cardAmber: {
    backgroundColor: '#6F5C2A',
    borderColor: 'rgba(245,227,175,0.32)',
  },
  cardSage: {
    backgroundColor: '#07564F',
    borderColor: 'rgba(157,242,210,0.20)',
  },
  cardTop: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,227,175,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.18)',
  },
  statusLabel: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '900',
    color: '#F5E3AF',
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
  compactRow: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  compactTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  compactSubtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
});
