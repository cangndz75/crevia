import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { MapActionBundlePresentation } from '@/core/mapDirectAction';
import { MapDirectActionRow } from '@/features/map/components/MapDirectActionRow';
import type { MapDirectActionPresentation } from '@/core/mapDirectAction';
import { mapUi } from '@/features/map/utils/mapUiTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  phaseLabel?: string;
  title: string;
  bundle: MapActionBundlePresentation;
  reducedMotion?: boolean;
  isMarkerSelectedOnMap?: boolean;
  hidePrimaryWhenPanelShowsSame?: boolean;
  onActionPress: (action: MapDirectActionPresentation) => void;
};

export function MapActiveOperationActionCard({
  phaseLabel,
  title,
  bundle,
  reducedMotion = false,
  isMarkerSelectedOnMap = false,
  hidePrimaryWhenPanelShowsSame = false,
  onActionPress,
}: Props) {
  if (!bundle.primaryAction && bundle.secondaryActions.length === 0) {
    return null;
  }

  const displayBundle: MapActionBundlePresentation =
    hidePrimaryWhenPanelShowsSame && bundle.primaryAction
      ? {
          ...bundle,
          primaryAction: undefined,
          secondaryActions: bundle.secondaryActions,
        }
      : bundle;

  if (!displayBundle.primaryAction && displayBundle.secondaryActions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.card, shadows.soft]} pointerEvents="box-none">
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="radio-outline" size={18} color={mapUi.teal} />
        </View>
        <View style={styles.copy}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker} numberOfLines={1}>
              {phaseLabel ?? 'Aktif Operasyon'}
            </Text>
            {isMarkerSelectedOnMap ? (
              <View style={styles.selectedPill}>
                <Text style={styles.selectedPillText} numberOfLines={1}>
                  Haritada seçili
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>
      <MapDirectActionRow
        bundle={displayBundle}
        compact
        reducedMotion={reducedMotion}
        onActionPress={onActionPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 72,
    left: 14,
    right: 14,
    maxWidth: 320,
    gap: 10,
    backgroundColor: 'rgba(6, 22, 20, 0.88)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: mapUi.borderStrong,
    zIndex: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: mapUi.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  selectedPill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: mapUi.goldSoftDark,
    borderWidth: 1,
    borderColor: mapUi.goldBorder,
  },
  selectedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: mapUi.gold,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: mapUi.textLight,
    lineHeight: 18,
  },
});
