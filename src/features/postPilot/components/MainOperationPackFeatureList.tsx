import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { PostPilotOfferViewModel } from '@/core/monetization/monetizationTypes';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type Props = {
  packTitle: string;
  packSubtitle: string;
  packDescription: string;
  featureRows: PostPilotOfferViewModel['featureRows'];
};

const TONE_COLORS = {
  teal: eventDetail.teal,
  mint: '#5BA898',
  gold: '#C99922',
  neutral: '#6B8480',
} as const;

export function MainOperationPackFeatureList({
  packTitle,
  packSubtitle,
  packDescription,
  featureRows,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.packTitle} numberOfLines={1}>
        {packTitle}
      </Text>
      <Text style={styles.packSubtitle} numberOfLines={1}>
        {packSubtitle}
      </Text>
      <Text style={styles.packDescription} numberOfLines={3}>
        {packDescription}
      </Text>
      <View style={styles.list}>
        {featureRows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={row.iconKey as keyof typeof Ionicons.glyphMap}
                size={18}
                color={TONE_COLORS[row.tone]}
              />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {row.title}
              </Text>
              <Text style={styles.rowDescription} numberOfLines={2}>
                {row.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
    padding: 14,
    gap: 8,
    minWidth: 0,
    shadowColor: '#063F3B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  packSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.teal,
  },
  packDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5F7A75',
    lineHeight: 17,
    flexShrink: 1,
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F0FAF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  rowDescription: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B8480',
    marginTop: 2,
    flexShrink: 1,
  },
});
