import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { useGameStore } from '@/store/useGameStore';
import { AppScreen } from '@/ui/components/AppScreen';
import { GameButton } from '@/ui/components/GameButton';
import { GameCard } from '@/ui/components/GameCard';
import { GameChip } from '@/ui/components/GameChip';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type FeatureCard = {
  id: string;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'map',
    title: 'Tam İlçe Haritası',
    body: 'Pilot bölgenin dışına çık, farklı karakterde mahalleleri aynı anda yönet.',
    icon: 'map-outline',
  },
  {
    id: 'neighborhoods',
    title: 'Yeni Mahalleler',
    body: 'Merkez, Cumhuriyet ve Sanayi dışında daha zorlu bölgeler açılır.',
    icon: 'business-outline',
  },
  {
    id: 'butterfly',
    title: 'Gelişmiş Kelebek Etkisi',
    body: 'Kararların sadece ertesi günü değil, haftalık operasyonu da etkiler.',
    icon: 'git-branch-outline',
  },
  {
    id: 'vehicles',
    title: 'Araç ve Bakım Sistemi',
    body: 'Arıza riski, bakım maliyeti ve rota gecikmeleri daha stratejik hale gelir.',
    icon: 'car-outline',
  },
  {
    id: 'staff',
    title: 'Personel Yorgunluğu ve Moral',
    body: 'Fazla mesai, vardiya dengesi ve ekip morali uzun vadeli sonuç üretir.',
    icon: 'people-outline',
  },
  {
    id: 'social',
    title: 'Sosyal Medya Krizleri',
    body: 'Mahalle grupları, yerel gündem ve görünür hizmet yönetimi önem kazanır.',
    icon: 'megaphone-outline',
  },
];

const ROADMAP_STEPS = [
  'Pilot Bölge',
  'İlçe Haritası',
  'Çoklu Mahalle',
  'Gelişmiş Krizler',
  'Haftalık Rapor',
  'Yeni Birimler',
] as const;

function FeaturePreviewCard({ title, body, icon, index }: FeatureCard & { index: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 60).duration(300).springify().damping(20)}>
      <GameCard padding="md" style={styles.featureCard}>
        <View style={styles.featureHead}>
          <View style={styles.featureIcon}>
            <Ionicons name={icon} size={20} color={colors.secondary} />
          </View>
          <View style={styles.featureLock}>
            <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
          </View>
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </GameCard>
    </Animated.View>
  );
}

type RoadmapStepProps = {
  label: string;
  index: number;
  isCompleted: boolean;
  isLast: boolean;
};

function RoadmapStep({ label, index, isCompleted, isLast }: RoadmapStepProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(500 + index * 50).duration(280).springify().damping(20)}
      style={styles.roadmapStep}>
      <View style={styles.roadmapRail}>
        <View
          style={[
            styles.roadmapDot,
            isCompleted ? styles.roadmapDotDone : styles.roadmapDotLocked,
          ]}>
          <Ionicons
            name={isCompleted ? 'checkmark' : 'lock-closed'}
            size={isCompleted ? 14 : 11}
            color={isCompleted ? colors.surface : colors.textSecondary}
          />
        </View>
        {!isLast ? (
          <View
            style={[
              styles.roadmapLine,
              isCompleted ? styles.roadmapLineDone : styles.roadmapLineLocked,
            ]}
          />
        ) : null}
      </View>
      <View style={styles.roadmapContent}>
        <Text style={styles.roadmapIndex}>Adım {index + 1}</Text>
        <Text
          style={[
            styles.roadmapLabel,
            isCompleted && styles.roadmapLabelDone,
          ]}>
          {label}
        </Text>
        <GameChip
          label={isCompleted ? 'Tamamlandı' : 'Kilitli'}
          tone={isCompleted ? 'success' : 'neutral'}
        />
      </View>
    </Animated.View>
  );
}

export function MainOperationPreviewScreen() {
  const router = useRouter();
  const { pilotCompleted } = useGameStore(
    useShallow((s) => ({
      pilotCompleted: s.gameState.pilot.status === 'completed',
    })),
  );

  const goPilotReport = () => {
    router.push('/events/pilot-final-report');
  };

  const goHub = () => {
    router.replace('/');
  };

  return (
    <AppScreen>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={16} color={colors.hubGoldDark} />
          <Text style={styles.heroBadgeText}>Ana Operasyon Önizlemesi</Text>
        </View>
        <Text style={styles.heroTitle}>Ana Operasyon</Text>
        <Text style={styles.heroSub}>
          Pilot bölge sadece başlangıçtı. Tam ilçe yönetimi, gelişmiş kriz
          zincirleri ve yeni mahalleler ana operasyonda açılır.
        </Text>
      </Animated.View>

      <GameCard padding="lg" style={[styles.statusCard, shadows.card]}>
        <View style={styles.statusChips}>
          <GameChip label="Kilitli İçerik" tone="warning" />
          <GameChip label="Yakında" tone="neutral" />
        </View>
        <Text style={styles.statusTitle}>
          {pilotCompleted
            ? 'Pilot tamamlandı, ana operasyon için hazırsın.'
            : 'Ana operasyonu açmak için pilot bölgeyi tamamla.'}
        </Text>
        <Text style={styles.statusBody}>
          Bu ekran yalnızca önizlemedir. Gerçek ana operasyon modu henüz
          açılmadı; yakında genişletilmiş içerikler burada aktifleşecek.
        </Text>
      </GameCard>

      <SectionHeader
        title="Açılacak Sistemler"
        subtitle="Pilot sonrası genişleyen operasyon katmanları"
        icon="layers-outline"
        iconColor={colors.primary}
      />

      <View style={styles.featureGrid}>
        {FEATURE_CARDS.map((feature, idx) => (
          <FeaturePreviewCard key={feature.id} {...feature} index={idx} />
        ))}
      </View>

      <SectionHeader
        title="Ana Operasyon Yol Haritası"
        subtitle="İlerleme önizlemesi — kilitler yakında açılacak"
        icon="trail-sign-outline"
        iconColor={colors.secondary}
      />

      <GameCard padding="lg" style={styles.roadmapCard}>
        {ROADMAP_STEPS.map((step, index) => (
          <RoadmapStep
            key={step}
            label={step}
            index={index}
            isCompleted={index === 0 && pilotCompleted}
            isLast={index === ROADMAP_STEPS.length - 1}
          />
        ))}
      </GameCard>

      <GameCard padding="lg" soft style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Hazır olduğunda devam edeceksin</Text>
        <Text style={styles.ctaBody}>
          Ana operasyon modu şu an kapalı. Pilot deneyimini tamamladıktan sonra
          bu alan genişletilmiş ilçe yönetimiyle açılacak.
        </Text>
        <View style={styles.ctaActions}>
          <GameButton
            title="Yakında Açılacak"
            onPress={() => {}}
            variant="secondary"
            disabled
            style={styles.fullBtn}
          />
          <GameButton
            title="Pilot Raporuna Dön"
            onPress={goPilotReport}
            variant="secondary"
            style={styles.fullBtn}
          />
          <GameButton
            title="Pilot Bölgede Kal"
            onPress={goHub}
            variant="ghost"
            style={styles.fullBtn}
          />
        </View>
      </GameCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: colors.hubGold,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
  heroTitle: {
    ...typography.title,
    fontSize: 28,
  },
  heroSub: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  statusCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.hubGold,
    backgroundColor: colors.hubGoldMuted,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  statusBody: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  featureGrid: {
    gap: spacing.md,
  },
  featureCard: {
    gap: spacing.sm,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  featureHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLock: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureBody: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  roadmapCard: {
    gap: spacing.lg,
  },
  roadmapStep: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roadmapRail: {
    width: 28,
    alignItems: 'center',
  },
  roadmapDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapDotDone: {
    backgroundColor: colors.success,
  },
  roadmapDotLocked: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roadmapLine: {
    flex: 1,
    width: 2,
    minHeight: 28,
    marginVertical: 4,
  },
  roadmapLineDone: {
    backgroundColor: colors.successMuted,
  },
  roadmapLineLocked: {
    backgroundColor: colors.border,
  },
  roadmapContent: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  roadmapIndex: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  roadmapLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roadmapLabelDone: {
    color: colors.textPrimary,
  },
  ctaCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ctaBody: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  ctaActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fullBtn: {
    alignSelf: 'stretch',
  },
});
