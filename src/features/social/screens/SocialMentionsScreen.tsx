import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  selectSocialPulseStateFromStore,
  useGameStore,
} from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { MentionCategoryFilter } from '../components/mentions/MentionCategoryFilter';
import { MentionFeedCard } from '../components/mentions/MentionFeedCard';
import {
  matchesMentionFilter,
  type MentionFilterKey,
} from '../components/mentions/mentionUiConstants';
import { SocialMentionsHeader } from '../components/mentions/SocialMentionsHeader';
import { buildSocialPulseUiBundle } from '../utils/socialUiMappers';

export function SocialMentionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<MentionFilterKey>('all');
  const socialPulseState = useGameStore(selectSocialPulseStateFromStore);
  const currentDay = useGameStore((s) => s.gameState.city.day);

  const { mentions, activeMentionCount } = useMemo(
    () => buildSocialPulseUiBundle(socialPulseState, currentDay),
    [socialPulseState, currentDay],
  );

  const items = Array.isArray(mentions) ? mentions : [];
  const safeCount =
    typeof activeMentionCount === 'number' && Number.isFinite(activeMentionCount)
      ? Math.max(0, Math.round(activeMentionCount))
      : 0;

  const filteredItems = useMemo(
    () => items.filter((m) => matchesMentionFilter(m.category, filter)),
    [items, filter],
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#EDE8F8', '#E8F0FC', '#F5E8F5', colors.hubCream]}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SocialMentionsHeader activeCount={safeCount} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.body,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.feedBanner, shadows.soft]}>
          <View style={styles.feedDot} />
          <Text style={styles.feedBannerText}>
            {items.length > 0
              ? `${items.length} paylaşım akışta`
              : 'Şu an canlı mention yok'}
          </Text>
        </View>

        <MentionCategoryFilter selected={filter} onSelect={setFilter} />

        {filteredItems.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={36} color="#8B5CF6" />
            </View>
            <Text style={styles.emptyTitle}>
              {items.length === 0 ? 'Akış sakin' : 'Bu kategoride paylaşım yok'}
            </Text>
            <Text style={styles.emptyBody}>
              {items.length === 0
                ? 'Vatandaş paylaşımları burada görünecek. Karar verdikçe mention hacmi artabilir.'
                : 'Başka bir kategori seçerek akışı inceleyebilirsin.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map((mention, index) => (
              <MentionFeedCard key={mention.id} mention={mention} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.hubCream,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  feedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'center',
    minWidth: '72%',
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  feedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C1D95',
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.12)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
