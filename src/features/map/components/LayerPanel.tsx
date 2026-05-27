import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { layerConfigs } from '../data/mapSelectors';
import type { ActiveLayers, LayerId } from '../types/map';

type Props = {
  visible: boolean;
  layers: ActiveLayers;
  onToggle: (id: LayerId) => void;
  onClose: () => void;
};

export function LayerPanel({ visible, layers, onToggle, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, shadows.card]}>
        <View style={styles.header}>
          <Text style={styles.title}>Aktif Katmanlar</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {layerConfigs.map((layer) => (
            <View key={layer.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{layer.label}</Text>
                <Text style={styles.rowSubtitle}>{layer.subtitle}</Text>
              </View>
              <Switch
                value={layers[layer.id]}
                onValueChange={() => onToggle(layer.id)}
                trackColor={{ false: colors.border, true: `${colors.primary}66` }}
                thumbColor={layers[layer.id] ? colors.primary : '#f4f3f4'}
              />
            </View>
          ))}
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
