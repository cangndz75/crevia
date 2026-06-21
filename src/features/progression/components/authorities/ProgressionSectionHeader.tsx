import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';

type ProgressionSectionHeaderProps = {
  title: string;
  countLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function ProgressionSectionHeader({
  title,
  countLabel,
  icon = 'ribbon-outline',
}: ProgressionSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name={icon} size={16} color={AUTHORITY_COLLECTION_THEME.tealDark} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {countLabel ? (
        <Text style={styles.count} numberOfLines={1}>
          {countLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    flexShrink: 1,
  },
  count: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2D6A6A',
    flexShrink: 0,
  },
});
