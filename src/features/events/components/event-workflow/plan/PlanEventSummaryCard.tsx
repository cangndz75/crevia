import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

type PlanEventSummaryCardProps = {
  title: string;
  location: string;
  priorityLabel: string;
  remainingLabel: string;
  thumbnail?: ImageSource;
};

export function PlanEventSummaryCard({
  title,
  location,
  priorityLabel: _priorityLabel,
  remainingLabel: _remainingLabel,
  thumbnail,
}: PlanEventSummaryCardProps) {
  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.mainRow}>
        {thumbnail ? (
          <View style={styles.thumbFrame}>
            <Image
              source={thumbnail}
              style={styles.thumb}
              contentFit="cover"
              accessibilityLabel="Olay görseli"
            />
          </View>
        ) : null}

        <View style={styles.taskCol}>
          <Text style={styles.label} numberOfLines={1}>
            Seçili Görev
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.activeChip}>
            <Text style={styles.activeText} numberOfLines={1}>
              Aktif Görev
            </Text>
          </View>
        </View>

        <View style={styles.regionCol}>
          <Text style={styles.label} numberOfLines={1}>
            Bölge
          </Text>
          <Text style={styles.region} numberOfLines={1}>
            {location}
          </Text>
          <View style={styles.safeRow}>
            <Ionicons name="happy-outline" size={13} color="#2E8A55" />
            <Text style={styles.safeText} numberOfLines={1}>
              Güvenli
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inspectChip}>
        <Ionicons name="search" size={14} color={eventDetail.tealDark} />
        <Text style={styles.inspectText} numberOfLines={1}>
          Detayları İncele
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: eventDetail.screenPadding,
    minHeight: 120,
    backgroundColor: eventDetail.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    gap: 10,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  thumbFrame: {
    width: 74,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: eventDetail.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.06)',
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  taskCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: eventDetail.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: eventDetail.textDark,
    lineHeight: 18,
    letterSpacing: 0,
  },
  activeChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: eventDetail.mint,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  regionCol: {
    width: 86,
    minWidth: 0,
    gap: 4,
  },
  region: {
    fontSize: 15,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  safeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E8A55',
  },
  inspectChip: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#E8F4F1',
    paddingHorizontal: 11,
    paddingVertical: 8,
    maxWidth: 142,
  },
  inspectText: {
    fontSize: 10,
    fontWeight: '900',
    color: eventDetail.tealDark,
  },
});
