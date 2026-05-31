import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ReportTomorrowNotesModel } from '@/features/reports/presentation/reportPremiumPresentation';

type Props = {
  model: ReportTomorrowNotesModel;
};

export function ReportTomorrowNotesCard({ model }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="create-outline" size={20} color="#0F8F86" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Yarına Etki Eden Notlar
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {model.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA8A5" style={styles.chevron} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 85, 78, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: 0,
    shadowColor: '#152C27',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF8F4',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#173B3A',
    flexShrink: 1,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#5C726E',
    flexShrink: 1,
  },
  chevron: {
    flexShrink: 0,
  },
});
