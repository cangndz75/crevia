import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionStatusCounts } from '@/features/progression/utils/authorityPermissionsTabPresentation';
import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';

type AuthorityPermissionStatusBarProps = {
  counts: AuthorityPermissionStatusCounts;
};

type StatusChip = {
  key: keyof AuthorityPermissionStatusCounts;
  label: string;
  color: string;
};

const CHIPS: StatusChip[] = [
  { key: 'open', label: 'Açık', color: '#1A8F8A' },
  { key: 'ready', label: 'Hazır', color: '#E65100' },
  { key: 'next', label: 'Sıradaki', color: '#1565C0' },
  { key: 'locked', label: 'Kilitli', color: '#8A9094' },
];

export function AuthorityPermissionStatusBar({ counts }: AuthorityPermissionStatusBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name="shield-checkmark-outline" size={16} color={AUTHORITY_COLLECTION_THEME.tealDark} />
        <Text style={styles.title} numberOfLines={1}>
          Yetki İzinleri
        </Text>
      </View>

      <View style={styles.chips}>
        {CHIPS.map((chip) => (
          <Text key={chip.key} style={[styles.chip, { color: chip.color }]} numberOfLines={1}>
            {chip.label}: {counts[chip.key]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    minWidth: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  chip: {
    fontSize: 11,
    fontWeight: '800',
  },
});
