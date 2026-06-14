import { StyleSheet, Text, View } from 'react-native';

import { gameUi } from '@/ui/theme/gameUiTokens';

type PremiumSectionHeaderProps = {
  title: string;
  subtitle?: string;
  accessibilityLabel?: string;
};

export function PremiumSectionHeader({
  title,
  subtitle,
  accessibilityLabel,
}: PremiumSectionHeaderProps) {
  return (
    <View
      style={styles.root}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? title}>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 2,
    minWidth: 0,
  },
  title: {
    ...gameUi.typography.sectionTitle,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: gameUi.colors.textMuted,
  },
});
