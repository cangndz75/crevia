import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { gameUi } from '@/ui/theme/gameUiTokens';

type IconName = keyof typeof Ionicons.glyphMap;

type CompactInsightRowProps = {
  label?: string;
  line: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'teal';
  icon?: IconName;
  accessibilityLabel?: string;
};

const toneStyles = {
  neutral: { bg: gameUi.colors.cardWhite, accent: gameUi.colors.primaryTealMid, border: gameUi.colors.borderSoft },
  positive: { bg: '#E6F6EA', accent: gameUi.colors.mintPositive, border: 'rgba(62,158,106,0.18)' },
  warning: { bg: gameUi.colors.cardWarmTint, accent: gameUi.colors.amberCaution, border: 'rgba(199,137,37,0.22)' },
  teal: { bg: gameUi.colors.cardMintTint, accent: gameUi.colors.primaryTealMid, border: 'rgba(13,113,104,0.16)' },
} as const;

export function CompactInsightRow({
  label,
  line,
  tone = 'neutral',
  icon = 'information-circle-outline',
  accessibilityLabel,
}: CompactInsightRowProps) {
  const colors = toneStyles[tone];

  return (
    <View
      style={[styles.row, { backgroundColor: colors.bg, borderColor: colors.border }]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${label ?? ''} ${line}`.trim()}>
      <View style={[styles.iconWrap, { borderColor: colors.border }]}>
        <Ionicons name={icon} size={14} color={colors.accent} accessibilityElementsHidden importantForAccessibility="no" />
      </View>
      <View style={styles.copy}>
        {label ? (
          <Text style={[styles.label, { color: colors.accent }]} numberOfLines={1} ellipsizeMode="tail">
            {label}
          </Text>
        ) : null}
        <Text style={styles.line} numberOfLines={2} ellipsizeMode="tail">
          {line}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 40,
    borderRadius: gameUi.radius.chip,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: gameUi.radius.badge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    ...gameUi.typography.badgeLabel,
  },
  line: {
    ...gameUi.typography.body,
    color: gameUi.colors.textPrimary,
  },
});
