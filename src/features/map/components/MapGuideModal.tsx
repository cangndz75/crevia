import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const GUIDE_ITEMS = [
  {
    title: 'Renkler',
    body: 'Teal: normal operasyon. Sarı/turuncu: dikkat. Kırmızı: kritik müdahale.',
  },
  {
    title: 'Pinler',
    body: 'Olay, risk, ekip, araç ve konteyner pinleri seçili pilot bölgeni gösterir.',
  },
  {
    title: 'Filtreler',
    body: 'Olaylar, Risk, Ekipler, Araçlar ve Konteyner sekmeleri farklı saha görünümleri sunar.',
  },
  {
    title: 'Pilot bölge',
    body: '7 gün boyunca yalnızca onboarding’de seçtiğin pilot bölgeden sorumlusun.',
  },
];

export function MapGuideModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, shadows.card]}>
        <View style={styles.header}>
          <Text style={styles.title}>Harita Rehberi</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        {GUIDE_ITEMS.map((item) => (
          <View key={item.title} style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>
          </View>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  item: {
    gap: 4,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
