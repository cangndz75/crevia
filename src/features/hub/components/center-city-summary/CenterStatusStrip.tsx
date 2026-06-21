import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { centerSummaryTokens as tokens } from '@/features/hub/theme/centerCitySummaryTokens';
import type { CenterSummaryStatusView } from '@/features/hub/utils/centerCitySummaryUiPresentation';

type CenterStatusStripProps = {
  status: CenterSummaryStatusView;
  compact?: boolean;
};

export function CenterStatusStrip({ status, compact = false }: CenterStatusStripProps) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={status.accessibilityLabel}>
      <LinearGradient
        colors={[tokens.colors.statusGreen, tokens.colors.statusGreenDark]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}>
        <View style={styles.content}>
          <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
            <Ionicons name="leaf-outline" size={compact ? 14 : 16} color={tokens.colors.deepGreen} />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
              {status.title}
            </Text>
            <Text style={[styles.description, compact && styles.descriptionCompact]} numberOfLines={2}>
              {status.description}
            </Text>
          </View>
        </View>

        <View style={styles.decorWrap} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(167,214,196,0.45)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const STRIP_HEIGHT = tokens.layout.statusStripMinHeight;

const styles = StyleSheet.create({
  wrap: {
    height: STRIP_HEIGHT,
    borderRadius: tokens.radius.statusStrip,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    height: STRIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCircleCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  description: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  descriptionCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  decorWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 72,
  },
});
