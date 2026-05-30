import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';

import type { MapDistrictId } from '../data/mapAssets';
import type { MapNeighborhoodStripItem } from '../utils/mapUiPresentation';

type Props = {
  items: MapNeighborhoodStripItem[];
  selectedId?: MapDistrictId;
  onSelect?: (districtId: MapDistrictId) => void;
};

const STRIP_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  city: 'business-outline',
  home: 'home-outline',
  factory: 'construct-outline',
  route: 'git-branch-outline',
  leaf: 'leaf-outline',
  navigate: 'navigate-outline',
};

function segmentFill(level: number): string {
  if (level >= 3) return mapUi.gold;
  if (level >= 2) return mapUi.riskHigh;
  if (level >= 1) return mapUi.teal;
  return '#E4E2DD';
}

function resolveSegmentLevel(item: MapNeighborhoodStripItem, selected: boolean): number {
  if (selected) return 3;
  const label = item.statusLabel.toLowerCase();
  if (label.includes('yüksek') || label.includes('kritik')) return 3;
  if (label.includes('orta') || label.includes('izlen')) return 2;
  if (label.includes('önizleme')) return 0;
  return 1;
}

export function MapNeighborhoodStrip({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText} numberOfLines={2}>
          Mahalle sinyali henüz yok. Gün ilerledikçe saha notları burada görünür.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        const iconName = item.identityIconKey
          ? resolveIoniconForRegistryKey(item.identityIconKey)
          : STRIP_ICON_MAP.factory;
        const segmentLevel = resolveSegmentLevel(item, selected);
        const statusColor = selected
          ? mapUi.gold
          : item.statusLabel.toLowerCase().includes('yüksek')
            ? mapUi.riskHigh
            : mapUi.teal;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect?.(item.id)}
            style={[
              styles.card,
              shadows.soft,
              selected ? styles.cardSelected : styles.cardDefault,
            ]}>
            <View
              style={[
                styles.thumb,
                { backgroundColor: selected ? mapUi.goldSoft : mapUi.mint },
              ]}>
              <Ionicons name={iconName} size={22} color={item.accentColor} />
            </View>

            <View style={styles.copy}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text
                  style={[styles.status, { color: statusColor }]}
                  numberOfLines={1}>
                  {item.statusLabel}
                </Text>
              </View>
              <View style={styles.segments}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: segmentFill(
                          index < segmentLevel ? segmentLevel : 0,
                        ),
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: mapUi.screenPadding,
    gap: 12,
    paddingVertical: 2,
  },
  card: {
    width: 168,
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardDefault: {
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: mapUi.gold,
    backgroundColor: '#FFFCF5',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: mapUi.textDark,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  status: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '700',
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    maxWidth: 22,
  },
  empty: {
    marginHorizontal: mapUi.screenPadding,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    color: mapUi.textSecondary,
    fontWeight: '500',
  },
});
