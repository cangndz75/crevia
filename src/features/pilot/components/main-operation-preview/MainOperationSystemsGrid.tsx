import Ionicons from '@expo/vector-icons/Ionicons';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import type { MainOpPreviewSystemCard } from '@/features/pilot/utils/mainOperationPreviewUiModel';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationSystemsGridProps = {
  cards: MainOpPreviewSystemCard[];
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Şehir: { bg: '#E4F6EC', text: '#239B68' },
  Strateji: { bg: '#EAF2FF', text: '#3B73D9' },
  Etki: { bg: '#F0E8FF', text: '#6B4FA8' },
  Operasyon: { bg: '#FFF0E0', text: '#C67A12' },
};

function SystemCard({ card, width }: { card: MainOpPreviewSystemCard; width: number }) {
  const tagPalette = TAG_COLORS[card.tag] ?? { bg: '#F5F1E8', text: MAIN_OP_PREVIEW_COLORS.muted };

  return (
    <View style={[styles.card, cardShadow, { width }]}>
      <View style={styles.visualSide}>
        <HubAssetImage
          source={card.imageSource}
          containerStyle={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={styles.iconBubble}>
          <Ionicons name={card.icon} size={20} color={MAIN_OP_PREVIEW_COLORS.teal} />
        </View>
        {card.showLock ? (
          <View style={styles.lockBubble}>
            <Ionicons name="lock-closed" size={12} color="#C89D1D" />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {card.description}
        </Text>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: tagPalette.bg }]}>
            <Text style={[styles.chipText, { color: tagPalette.text }]} numberOfLines={1}>
              {card.tag}
            </Text>
          </View>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText} numberOfLines={1}>
              {card.statusTag}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function MainOperationSystemsGrid({ cards }: MainOperationSystemsGridProps) {
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 16 * 2 - 12) / 2;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="layers" size={18} color={MAIN_OP_PREVIEW_COLORS.blue} />
        </View>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>Açılacak Sistemler</Text>
          <Text style={styles.sectionSubtitle} numberOfLines={2}>
            Ana operasyonda genişleyecek oyun katmanları
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <SystemCard key={card.id} card={card} width={cardWidth} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: MAIN_OP_PREVIEW_COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: MAIN_OP_PREVIEW_COLORS.muted,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    height: 142,
    borderRadius: 18,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E7E0D1',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  visualSide: {
    width: '40%',
    height: '100%',
    backgroundColor: '#EEF7F5',
    overflow: 'hidden',
  },
  iconBubble: {
    position: 'absolute',
    right: -6,
    top: '36%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF7F5',
    borderWidth: 1,
    borderColor: '#DCEBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBubble: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF6DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
    lineHeight: 18,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    color: MAIN_OP_PREVIEW_COLORS.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusChip: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.chip,
    backgroundColor: '#FFF6DA',
    borderWidth: 1,
    borderColor: '#EAD7A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9A7618',
  },
});
