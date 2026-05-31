import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import type { PostPilotOfferViewModel } from '@/core/monetization/monetizationTypes';
import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { getPressFeedbackStyle } from '@/ui/feedback/pressFeedback';

type Props = {
  model: PostPilotOfferViewModel;
  onPrimary: () => void;
  onSecondary: () => void;
  onRestore: () => void;
  primaryDisabled?: boolean;
  restoreDisabled?: boolean;
  statusMessage?: string;
  errorMessage?: string;
  priceLabel?: string;
  productDisplayLabel?: string;
  isPurchasing?: boolean;
  isRestoring?: boolean;
};

export function PostPilotAccessChoiceCard({
  model,
  onPrimary,
  onSecondary,
  onRestore,
  primaryDisabled = false,
  restoreDisabled = false,
  statusMessage,
  errorMessage,
  priceLabel,
  productDisplayLabel,
  isPurchasing = false,
  isRestoring = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const primaryBusy = isPurchasing || isRestoring;

  if (model.isFullAccess) {
    return (
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle} numberOfLines={1}>
            {MONETIZATION_COPY.fullUnlockedTitle}
          </Text>
          <Text style={styles.statusBody} numberOfLines={2}>
            {MONETIZATION_COPY.fullUnlockedLine}
          </Text>
        </View>
        <Pressable
          onPress={onPrimary}
          style={({ pressed }) => [styles.primaryWrap, getPressFeedbackStyle({ pressed })]}>
          <LinearGradient
            colors={[eventDetail.tealDark, eventDetail.teal]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryBtn}>
            <Text style={styles.primaryLabel} numberOfLines={1}>
              Ana Operasyona Devam Et
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {productDisplayLabel || priceLabel ? (
        <View style={styles.productMeta}>
          {productDisplayLabel ? (
            <Text style={styles.productTitle} numberOfLines={1}>
              {productDisplayLabel}
            </Text>
          ) : null}
          {priceLabel ? (
            <Text style={styles.productPrice} numberOfLines={1}>
              {priceLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      {statusMessage ? (
        <Text style={styles.statusInline} numberOfLines={2}>
          {statusMessage}
        </Text>
      ) : null}
      {errorMessage ? (
        <Text style={styles.errorInline} numberOfLines={2}>
          {errorMessage}
        </Text>
      ) : null}

      {model.isLimitedAccess ? (
        <View style={[styles.statusCard, styles.statusLimited]}>
          <Text style={styles.statusTitle} numberOfLines={1}>
            {MONETIZATION_COPY.limitedWarningTitle}
          </Text>
          <Text style={styles.statusBody} numberOfLines={2}>
            {MONETIZATION_COPY.limitedWarningLine}
          </Text>
        </View>
      ) : null}

      <Pressable
        disabled={primaryDisabled || primaryBusy}
        onPress={() => {
          if (primaryDisabled || primaryBusy) return;
          playLightImpactHaptic();
          onPrimary();
        }}
        style={({ pressed }) => [
          styles.primaryWrap,
          (primaryDisabled || primaryBusy) && styles.disabled,
          getPressFeedbackStyle({ pressed: pressed && !primaryDisabled }),
        ]}>
        <LinearGradient
          colors={[eventDetail.tealDark, eventDetail.teal]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryBtn}>
          {isPurchasing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryLabel} numberOfLines={1}>
              {model.primaryCtaLabel}
            </Text>
          )}
        </LinearGradient>
      </Pressable>

      {model.canChooseLimited ? (
        <Pressable
          onPress={() => {
            playLightImpactHaptic();
            onSecondary();
          }}
          style={({ pressed }) => [
            styles.secondaryBtn,
            getPressFeedbackStyle({ pressed }),
          ]}>
          <Text style={styles.secondaryLabel} numberOfLines={1}>
            {model.secondaryCtaLabel}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        disabled={restoreDisabled || primaryBusy}
        onPress={() => {
          if (restoreDisabled || primaryBusy) return;
          playLightImpactHaptic();
          onRestore();
        }}
        accessibilityRole="button"
        style={restoreDisabled ? styles.disabled : undefined}>
        {isRestoring ? (
          <ActivityIndicator size="small" color="#6B8480" />
        ) : (
          <Text style={styles.restoreLabel} numberOfLines={1}>
            {model.restoreLabel}
          </Text>
        )}
      </Pressable>

      <Text style={styles.footer} numberOfLines={2}>
        {model.showDevNote && model.devNote ? model.devNote : model.footerNote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingTop: 8,
    minWidth: 0,
  },
  productMeta: {
    gap: 2,
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  productPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B8480',
  },
  statusInline: {
    fontSize: 12,
    fontWeight: '600',
    color: eventDetail.tealDark,
    textAlign: 'center',
  },
  errorInline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A6B3A',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
  statusCard: {
    borderRadius: 14,
    backgroundColor: '#E8F7F2',
    borderWidth: 1,
    borderColor: 'rgba(15, 143, 134, 0.2)',
    padding: 12,
    gap: 4,
  },
  statusLimited: {
    backgroundColor: '#FFF6E8',
    borderColor: 'rgba(214, 162, 60, 0.35)',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  statusBody: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5F5B',
    flexShrink: 1,
  },
  primaryWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  primaryBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.18)',
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  restoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B8480',
    textAlign: 'center',
    paddingVertical: 4,
  },
  footer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B8480',
    textAlign: 'center',
    lineHeight: 16,
    flexShrink: 1,
  },
});
