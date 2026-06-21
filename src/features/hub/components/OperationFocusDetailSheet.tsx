import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type {
  CenterOperationStatusCardId,
  OperationFocusSheetLine,
  OperationFocusSheetModel,
  OperationFocusState,
} from '@/features/hub/utils/centerOperationCommandPresentation';
import {
  HUB_PREMIUM_COLORS,
  HUB_PREMIUM_RADIUS,
  hubPremiumShadowCard,
} from '@/features/hub/utils/hubPremiumPresentation';
import { spacing } from '@/ui/theme/spacing';

type OperationFocusDetailSheetProps = {
  visible: boolean;
  sheetKey: CenterOperationStatusCardId | null;
  model?: OperationFocusSheetModel;
  onClose: () => void;
};

const STATE_COLORS: Record<OperationFocusState, { border: string; bg: string; text: string }> = {
  recommended: { border: '#E8C45A', bg: '#FFFBF0', text: '#9A7B28' },
  ready: { border: 'rgba(26,143,138,0.18)', bg: '#F8FCFB', text: '#157A76' },
  active: { border: '#1A8F8A', bg: '#F0FAF8', text: '#07564F' },
  completed: { border: '#3BAF7A', bg: '#F2FAF5', text: '#2E8B60' },
  locked: { border: 'rgba(107,125,120,0.2)', bg: '#F6F6F4', text: '#6B7D78' },
  warning: { border: '#E8B44A', bg: '#FFF8EC', text: '#9A6B12' },
};

const LINE_TONE_COLORS: Record<
  NonNullable<OperationFocusSheetLine['tone']>,
  string
> = {
  positive: '#2E8B60',
  neutral: '#5C7A75',
  warning: '#C9922E',
  active: '#07564F',
  completed: '#2E8B60',
  locked: '#8A9692',
};

function SheetLineRow({ line }: { line: OperationFocusSheetLine }) {
  const toneColor = line.tone ? LINE_TONE_COLORS[line.tone] : HUB_PREMIUM_COLORS.textMuted;
  return (
    <View style={styles.lineRow}>
      <Text style={styles.lineLabel} numberOfLines={2}>
        {line.label}
      </Text>
      {line.value ? (
        <Text style={[styles.lineValue, { color: toneColor }]} numberOfLines={2}>
          {line.value}
        </Text>
      ) : null}
    </View>
  );
}

export function OperationFocusDetailSheet({
  visible,
  sheetKey,
  model,
  onClose,
}: OperationFocusDetailSheetProps) {
  const router = useRouter();

  if (!model || !sheetKey) return null;

  const handleRoute = (route?: string) => {
    if (!route) return;
    playLightImpactHaptic();
    onClose();
    router.push(route as Href);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, hubPremiumShadowCard()]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title} numberOfLines={1}>
                {model.title}
              </Text>
              {model.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {model.subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closePressed]}>
              <Ionicons name="close" size={22} color={HUB_PREMIUM_COLORS.tealDark} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {model.sections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.lines.map((line) => (
                  <SheetLineRow key={line.id} line={line} />
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {model.primaryCtaLabel ? (
              <Pressable
                onPress={() => handleRoute(model.primaryCtaRoute)}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                accessibilityRole="button">
                <Text style={styles.primaryBtnText}>{model.primaryCtaLabel}</Text>
              </Pressable>
            ) : null}
            {model.secondaryCtaLabel ? (
              <Pressable
                onPress={() => handleRoute(model.secondaryCtaRoute)}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                accessibilityRole="button">
                <Text style={styles.secondaryBtnText}>{model.secondaryCtaLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function operationFocusStateStyle(state: OperationFocusState) {
  return STATE_COLORS[state];
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 40, 36, 0.42)',
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: '#FFFEFA',
    borderTopLeftRadius: HUB_PREMIUM_RADIUS.cardLg,
    borderTopRightRadius: HUB_PREMIUM_RADIUS.cardLg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 78, 69, 0.08)',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: HUB_PREMIUM_COLORS.tealDark,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: HUB_PREMIUM_COLORS.textMuted,
    lineHeight: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 78, 69, 0.06)',
  },
  closePressed: {
    opacity: 0.8,
  },
  scroll: {
    maxHeight: 360,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  section: {
    gap: 8,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: '#F8FCFB',
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.08)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.tealDark,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  lineRow: {
    gap: 2,
    minWidth: 0,
  },
  lineLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: HUB_PREMIUM_COLORS.textDark,
    lineHeight: 18,
  },
  lineValue: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  footer: {
    padding: spacing.lg,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 78, 69, 0.08)',
  },
  primaryBtn: {
    borderRadius: 14,
    backgroundColor: HUB_PREMIUM_COLORS.teal,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.18)',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: HUB_PREMIUM_COLORS.tealDark,
  },
  btnPressed: {
    opacity: 0.88,
  },
});
