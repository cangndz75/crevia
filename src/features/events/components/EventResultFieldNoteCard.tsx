import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { EVENT_RESULT_COPY } from '@/features/events/utils/eventResultPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';

type Props = {
  note: string;
};

export function EventResultFieldNoteCard({ note }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
        <Text style={styles.title} numberOfLines={1}>
          {EVENT_RESULT_COPY.fieldNoteTitle}
        </Text>
      </View>
      <Text style={styles.body} numberOfLines={2}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: eventDetail.mintSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: eventDetail.tealDark,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textDark,
    lineHeight: 18,
  },
});
