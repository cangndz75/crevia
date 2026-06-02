import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';
import type { PlanDisplayOption } from '@/features/events/utils/eventWorkflowPlanUiPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import { shadows } from '@/ui/theme/shadows';

const SELECTED_BORDER = '#0E6D69';

const fastImage = require('../../../../../../assets/b9.png');
const balancedImage = require('../../../../../../assets/b4.png');
const economyImage = require('../../../../../../assets/b2.png');

type PlanOptionPickerProps = {
  options: PlanDisplayOption[];
  selectedId: PlanOptionId;
  onSelect: (id: PlanOptionId) => void;
};

type ImpactTone = 'high' | 'medium' | 'low';

type PlanMetric = {
  label: string;
  value: string;
  tone: ImpactTone;
  icon: ComponentProps<typeof Ionicons>['name'];
};

const PLAN_COPY: Record<
  PlanOptionId,
  {
    title: string;
    description: string;
    image: ImageSource;
    icon: ComponentProps<typeof Ionicons>['name'];
    metrics: PlanMetric[];
  }
> = {
  fast: {
    title: 'Hızlı Müdahale Planı',
    description: 'Mevcut riske hızlı müdahale ederek hasarı en aza indirir.',
    image: fastImage,
    icon: 'flash',
    metrics: [
      { label: 'Personel', value: 'Yüksek', tone: 'high', icon: 'people' },
      { label: 'Araç', value: 'Yüksek', tone: 'high', icon: 'bus' },
      { label: 'Sosyal Etki', value: 'Orta', tone: 'medium', icon: 'people' },
      { label: 'Güven', value: 'Yüksek', tone: 'high', icon: 'shield-checkmark' },
    ],
  },
  balanced: {
    title: 'Önleyici Plan',
    description: 'Risk büyümeden tedbir alır, gelecekteki etkileri azaltır.',
    image: balancedImage,
    icon: 'shield-checkmark',
    metrics: [
      { label: 'Personel', value: 'Orta', tone: 'medium', icon: 'people' },
      { label: 'Araç', value: 'Orta', tone: 'medium', icon: 'bus' },
      { label: 'Sosyal Etki', value: 'Yüksek', tone: 'high', icon: 'people' },
      { label: 'Güven', value: 'Orta', tone: 'medium', icon: 'shield-checkmark' },
    ],
  },
  economy: {
    title: 'Görünür İletişim Planı',
    description: 'Vatandaşları bilgilendirir, farkındalığı artırır ve iş birliğini güçlendirir.',
    image: economyImage,
    icon: 'chatbubble-ellipses',
    metrics: [
      { label: 'Personel', value: 'Düşük', tone: 'low', icon: 'people' },
      { label: 'Araç', value: 'Düşük', tone: 'low', icon: 'bus' },
      { label: 'Sosyal Etki', value: 'Yüksek', tone: 'high', icon: 'people' },
      { label: 'Güven', value: 'Yüksek', tone: 'high', icon: 'shield-checkmark' },
    ],
  },
};

function toneColor(tone: ImpactTone): string {
  if (tone === 'high') return '#0E6D69';
  if (tone === 'medium') return '#C58B18';
  return '#2F8E62';
}

function PlanOptionCard({
  option,
  selected,
  onPress,
}: {
  option: PlanDisplayOption;
  selected: boolean;
  onPress: () => void;
}) {
  const copy = PLAN_COPY[option.id];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        selected ? styles.cardSelected : styles.cardDefault,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View style={styles.topRow}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
        </View>

        <View style={styles.iconCircle}>
          <Ionicons name={copy.icon} size={25} color={eventDetail.tealDark} />
        </View>

        <View style={styles.copyCol}>
          <Text style={styles.title} numberOfLines={2}>
            {copy.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {copy.description}
          </Text>
        </View>

        <Image source={copy.image} style={styles.planImage} contentFit="contain" />
      </View>

      <View style={styles.metricsGrid}>
        {copy.metrics.map((metric) => (
          <View key={`${option.id}-${metric.label}`} style={styles.metricPill}>
            <Text style={styles.metricLabel} numberOfLines={1}>
              {metric.label}
            </Text>
            <View style={styles.metricValueRow}>
              <Ionicons name={metric.icon} size={12} color={eventDetail.tealDark} />
              <Text
                style={[styles.metricValue, { color: toneColor(metric.tone) }]}
                numberOfLines={1}>
                {metric.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export function PlanOptionPicker({
  options,
  selectedId,
  onSelect,
}: PlanOptionPickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          Plan Seçenekleri
        </Text>
        <Text style={styles.sectionHint} numberOfLines={2}>
          Duruma göre en uygun stratejiyi seç. Her plan farklı kaynak ve etki dengesi sunar.
        </Text>
      </View>

      <View style={styles.list}>
        {options.map((option) => (
          <PlanOptionCard
            key={option.id}
            option={option}
            selected={selectedId === option.id}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: eventDetail.screenPadding,
    gap: 10,
  },
  sectionHeader: {
    gap: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: eventDetail.textDark,
    letterSpacing: 0,
  },
  sectionHint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: eventDetail.textMuted,
  },
  list: {
    gap: 8,
  },
  card: {
    width: '100%',
    minHeight: 148,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: eventDetail.card,
    padding: 12,
    gap: 10,
  },
  cardDefault: {
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  cardSelected: {
    borderColor: SELECTED_BORDER,
    backgroundColor: '#FFFCF5',
  },
  pressed: {
    opacity: 0.94,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(6, 63, 59, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  },
  radioSelected: {
    backgroundColor: SELECTED_BORDER,
    borderColor: SELECTED_BORDER,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E7F4EF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  description: {
    fontSize: 11,
    fontWeight: '700',
    color: eventDetail.textMuted,
    lineHeight: 15,
  },
  planImage: {
    width: 86,
    height: 76,
    flexShrink: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 5,
  },
  metricPill: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#F6F2EA',
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 3,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: eventDetail.textDark,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
  },
  metricValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 8,
    fontWeight: '900',
  },
});
