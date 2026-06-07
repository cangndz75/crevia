import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { CityJournalHubPresentation } from '@/core/cityJournal';

type Props = {
  presentation: CityJournalHubPresentation | null | undefined;
};

export function HubCityJournalStrip({ presentation }: Props) {
  if (!presentation?.visible || !presentation.primaryLine) return null;

  return (
    <View style={styles.strip}>
      <View style={styles.iconWrap}>
        <Ionicons name="book-outline" size={17} color="#5C4A32" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {presentation.title}
        </Text>
        <Text style={styles.mainLine} numberOfLines={1} ellipsizeMode="tail">
          {presentation.primaryLine}
        </Text>
        {presentation.secondaryLine ? (
          <Text style={styles.supportLine} numberOfLines={1} ellipsizeMode="tail">
            {presentation.secondaryLine}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(92, 74, 50, 0.12)',
    backgroundColor: '#FFFCF6',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EBDD',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    color: '#3D3428',
  },
  mainLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#5C4A32',
  },
  supportLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: '#7A6E60',
  },
});
