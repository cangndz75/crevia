import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { TomorrowRiskModel } from '@/core/tomorrowRisk';

type Props = {
  model: TomorrowRiskModel | null | undefined;
};

export function HubTomorrowRiskStrip({ model }: Props) {
  if (!model?.shouldShowInHub) return null;

  return (
    <View style={styles.strip}>
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={17} color="#07534C" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {model.title}
        </Text>
        <Text style={styles.mainLine} numberOfLines={1} ellipsizeMode="tail">
          {model.mainLine}
        </Text>
        {model.supportLine && !model.shouldShowAsCompact ? (
          <Text style={styles.supportLine} numberOfLines={1} ellipsizeMode="tail">
            {model.supportLine}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(7, 83, 76, 0.10)',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F7F2',
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
    color: '#173D3A',
  },
  mainLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#07534C',
  },
  supportLine: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: '#63706D',
  },
});
