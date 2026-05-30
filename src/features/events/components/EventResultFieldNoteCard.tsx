import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { EVENT_RESULT_COPY } from '@/features/events/utils/eventResultPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type Props = {
  note: string;
};

export function EventResultFieldNoteCard({ note }: Props) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.content}>
        <View style={styles.head}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={eventDetail.teal}
          />
          <Text style={styles.title} numberOfLines={1}>
            {EVENT_RESULT_COPY.fieldNoteTitle}
          </Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {note}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    backgroundColor: '#E8F7F0',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.14)',
    padding: 16,
    minHeight: 92,
    minWidth: 0,
    overflow: 'hidden',
  },
  content: {
    gap: 6,
    minWidth: 0,
    flexShrink: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.tealDark,
    flexShrink: 1,
    minWidth: 0,
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    color: eventDetail.textDark,
    lineHeight: 21,
    flexShrink: 1,
    minWidth: 0,
  },
});
