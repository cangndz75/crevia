import type { ImageSource } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { MainOperationCardBanner } from '@/features/pilot/components/main-operation-preview/MainOperationCardBanner';
import {
  MAIN_OP_PREVIEW_COLORS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

export type MainOperationStatusCardView = {
  id: string;
  title: string;
  description: string;
  iconBg: string;
  borderColor: string;
  active: boolean;
  imageSource: ImageSource;
};

type MainOperationStatusCardsProps = {
  cards: MainOperationStatusCardView[];
};

const CARD_WIDTH = 132;

function StatusCard({ card }: { card: MainOperationStatusCardView }) {
  return (
    <View
      style={[
        styles.card,
        cardShadow,
        {
          borderColor: card.borderColor,
          opacity: card.active ? 1 : 0.78,
        },
      ]}>
      <MainOperationCardBanner
        source={card.imageSource}
        height={52}
        borderRadius={0}
        overlayColors={['transparent', 'rgba(255,255,255,0.94)']}
      />

      <View style={styles.body}>
        <View style={[styles.iconBox, { backgroundColor: card.iconBg }]}>
          <HubAssetImage
            source={card.imageSource}
            containerStyle={styles.iconAsset}
            contentFit="contain"
          />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {card.description}
        </Text>
      </View>
    </View>
  );
}

export function MainOperationStatusCards({ cards }: MainOperationStatusCardsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {cards.map((card) => (
        <StatusCard key={card.id} card={card} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconAsset: {
    width: 22,
    height: 22,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
    lineHeight: 15,
  },
  description: {
    fontSize: 10,
    lineHeight: 13,
    color: MAIN_OP_PREVIEW_COLORS.muted,
  },
});
