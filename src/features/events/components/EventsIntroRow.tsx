import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { eventsScreen } from '@/features/events/theme/eventsScreenTokens';

export function EventsIntroRow() {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name="compass-outline" size={16} color={eventsScreen.teal} />
      </View>
      <Text style={styles.text} numberOfLines={2}>
        Şehirdeki gelişmeleri takip et, karar ver ve etkilerini yönet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: eventsScreen.card,
    borderWidth: 1,
    borderColor: eventsScreen.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: eventsScreen.textMuted,
  },
});
