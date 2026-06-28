import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import type {
  CenterQuickCommandLayout,
  CenterQuickCommandsPresentation,
} from '@/features/hub/utils/centerHubGameplayPresentation';
import { CreviaAnimatedPressable } from '@/shared/motion';

import { pushHubRoute } from './centerLowerDashboardShared';

type IconName = keyof typeof Ionicons.glyphMap;

type CenterQuickActionsTilesProps = {
  presentation: CenterQuickCommandsPresentation;
  reducedMotion?: boolean;
};

function resolveIconName(iconKey: string | undefined, fallback: IconName = 'grid-outline'): IconName {
  if (iconKey && iconKey in Ionicons.glyphMap) return iconKey as IconName;
  return fallback;
}

function layoutWidth(layout: CenterQuickCommandLayout, index: number, total: number): DimensionValue {
  if (layout === 'threeColumn') return '31%';
  if (layout === 'twoColumn' || layout === 'twoPlusLockedTeaser') return '48%';
  if (layout === 'singleCompact') return '100%';
  return total === 1 ? '100%' : `${Math.floor(100 / total) - 2}%`;
}

function accentStyle(accent: CenterQuickCommandsPresentation['commands'][number]['accent']) {
  switch (accent) {
    case 'gold':
      return styles.tileGold;
    case 'amber':
      return styles.tileAmber;
    case 'sage':
      return styles.tileSage;
    default:
      return styles.tileGreen;
  }
}

function iconAccentStyle(accent: CenterQuickCommandsPresentation['commands'][number]['accent']) {
  switch (accent) {
    case 'gold':
      return styles.iconGold;
    case 'amber':
      return styles.iconAmber;
    case 'sage':
      return styles.iconSage;
    default:
      return styles.iconGreen;
  }
}

function CommandTile({
  command,
  width,
  layout,
  reducedMotion,
}: {
  command: CenterQuickCommandsPresentation['commands'][number];
  width: DimensionValue;
  layout: CenterQuickCommandLayout;
  reducedMotion: boolean;
}) {
  const router = useRouter();

  return (
    <CreviaAnimatedPressable
      onPress={() => {
        if (command.routeKey) pushHubRoute(router, command.routeKey);
      }}
      reducedMotion={reducedMotion}
      pressScale={0.97}
      disabled={command.disabled || !command.routeKey}
      accessibilityRole="button"
      accessibilityLabel={`${command.title}. ${command.subtitle ?? command.unlockLabel ?? ''}`}
      style={[
        styles.tile,
        layout === 'twoColumn' ? styles.tileTwoColumn : undefined,
        layout === 'singleCompact' ? styles.tileSingle : undefined,
        { width },
        accentStyle(command.accent),
      ]}>
      <View style={[styles.iconWrap, iconAccentStyle(command.accent)]}>
        <Ionicons
          name={resolveIconName(command.iconKey, command.disabled ? 'lock-closed-outline' : 'grid-outline')}
          size={22}
          color="#F5E3AF"
        />
      </View>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
        {command.title}
      </Text>
      {command.subtitle || command.unlockLabel ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {command.disabled ? command.unlockLabel : command.subtitle}
        </Text>
      ) : null}
      {!command.disabled ? (
        <View style={styles.commandCta}>
          <Ionicons name="chevron-forward" size={14} color="#0D3F39" />
        </View>
      ) : null}
    </CreviaAnimatedPressable>
  );
}

export function CenterQuickActionsTiles({
  presentation,
  reducedMotion = false,
}: CenterQuickActionsTilesProps) {
  if (presentation.visibility !== 'visible' || presentation.commands.length === 0) {
    return null;
  }

  const { layout, commands } = presentation;

  return (
    <View style={styles.section}>
      <Text style={styles.heading} numberOfLines={1}>
        {presentation.title.toUpperCase()}
      </Text>
      {layout === 'twoColumn' ? (
        <Text style={styles.sectionSubtitle} numberOfLines={1}>
          Genel yönetim araçları
        </Text>
      ) : null}
      <View style={styles.row}>
        {commands.map((command, index) => (
          <CommandTile
            key={command.id}
            command={command}
            width={layoutWidth(layout, index, commands.length)}
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
  sectionSubtitle: {
    marginTop: -6,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#6B7D78',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  tile: {
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 5,
  },
  tileTwoColumn: {
    minHeight: 94,
    alignItems: 'flex-start',
    paddingHorizontal: 11,
  },
  tileSingle: {
    minHeight: 72,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  tileGreen: {
    backgroundColor: '#07564F',
    borderColor: 'rgba(157,242,210,0.22)',
  },
  tileGold: {
    backgroundColor: '#9B802F',
    borderColor: 'rgba(245,227,175,0.34)',
  },
  tileAmber: {
    backgroundColor: '#6F5C2A',
    borderColor: 'rgba(245,227,175,0.32)',
  },
  tileSage: {
    backgroundColor: '#0D3F39',
    borderColor: 'rgba(245,227,175,0.22)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconGreen: {
    backgroundColor: 'rgba(157,242,210,0.10)',
    borderColor: 'rgba(157,242,210,0.22)',
  },
  iconGold: {
    backgroundColor: 'rgba(13,63,57,0.16)',
    borderColor: 'rgba(245,227,175,0.24)',
  },
  iconAmber: {
    backgroundColor: 'rgba(245,227,175,0.10)',
    borderColor: 'rgba(245,227,175,0.22)',
  },
  iconSage: {
    backgroundColor: 'rgba(245,227,175,0.10)',
    borderColor: 'rgba(245,227,175,0.22)',
  },
  title: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    minHeight: 24,
  },
  commandCta: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E3AF',
    marginTop: 'auto',
  },
});
