import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type FieldNoteCardProps = {
  body: string;
};

export function FieldNoteCard({ body }: FieldNoteCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses" size={16} color={eventDetail.teal} />
        </View>
        <Text style={styles.title}>SAHA NOTU</Text>
      </View>

      <Text style={styles.body} numberOfLines={3}>
        {body}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="camera-outline" size={14} color={eventDetail.teal} />
          <Text style={styles.metaText} numberOfLines={1}>
            Fotoğraf Var
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="shield-checkmark-outline" size={14} color={eventDetail.teal} />
          <Text style={styles.metaText} numberOfLines={1}>
            Konum Güveni %90
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={eventDetail.teal} />
          <Text style={styles.metaText} numberOfLines={1}>
            Mahalle Etkisi Orta
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    marginTop: -12,
    backgroundColor: eventDetail.card,
    borderRadius: eventDetail.smallRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: eventDetail.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: eventDetail.tealDark,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: eventDetail.textDark,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    flexShrink: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: eventDetail.textMuted,
    flexShrink: 1,
  },
});
