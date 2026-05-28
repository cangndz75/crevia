import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type PlanningDetailHeaderProps = {
  chipLabel: string;
};

export function PlanningDetailHeader({ chipLabel }: PlanningDetailHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <Text style={styles.title}>Detaylar</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Planın tüm yönlerini keşfedin.
        </Text>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText} numberOfLines={1}>
          {chipLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.textDark,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 17,
  },
  chip: {
    backgroundColor: eventDetail.mintSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.1)',
    maxWidth: 120,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: eventDetail.tealDark,
    textAlign: 'center',
  },
});
