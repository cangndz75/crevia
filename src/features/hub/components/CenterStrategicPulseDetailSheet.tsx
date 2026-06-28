import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import type { CenterStrategicPulseDetail } from '@/features/hub/utils/centerHubGameplayPresentation';
import { CENTER_MIN_TOUCH_TARGET } from '@/features/hub/utils/centerLayoutTokens';

type CenterStrategicPulseDetailSheetProps = {
  visible: boolean;
  detail: CenterStrategicPulseDetail;
  onClose: () => void;
};

function buildSvgLinePath(
  points: CenterStrategicPulseDetail['chart'],
  width: number,
  height: number,
): string {
  if (points.length < 2) return '';
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(1, maxValue - minValue);
  const leftPadding = 8;
  const rightPadding = 8;
  const topPadding = 12;
  const bottomPadding = 20;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - topPadding - bottomPadding;

  return points
    .map((point, index) => {
      const x = leftPadding + (chartWidth / Math.max(1, points.length - 1)) * index;
      const y = topPadding + chartHeight - ((point.value - minValue) / range) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export function CenterStrategicPulseDetailSheet({
  visible,
  detail,
  onClose,
}: CenterStrategicPulseDetailSheetProps) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * 0.55);
  const chartWidth = 280;
  const chartHeight = 112;
  const path = buildSvgLinePath(detail.chart, chartWidth, chartHeight);

  const handleRoute = (route?: string) => {
    if (!route) return;
    playLightImpactHaptic();
    onClose();
    router.push(route as Href);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Kapat" />
        <View style={[styles.sheet, { minHeight: sheetHeight, maxHeight: Math.round(windowHeight * 0.85) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              Şehir Nabzı
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={22} color="#0D3F39" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.metricRow}>
              {detail.explanationRows.map((row) => (
                <View key={row.id} style={styles.metricChip}>
                  <Text style={styles.metricLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <Text style={styles.metricValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {path.length > 0 ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle} numberOfLines={1}>
                  Son 7 gün
                </Text>
                <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                  <Line x1="8" y1="62" x2="272" y2="62" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <Path
                    d={path}
                    fill="none"
                    stroke="#D8A72E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {detail.chart.map((point, index) => {
                    const values = detail.chart.map((item) => item.value);
                    const minValue = Math.min(...values);
                    const maxValue = Math.max(...values);
                    const range = Math.max(1, maxValue - minValue);
                    const x = 8 + ((chartWidth - 16) / Math.max(1, detail.chart.length - 1)) * index;
                    const y = 12 + (chartHeight - 32) - ((point.value - minValue) / range) * (chartHeight - 32);
                    return (
                      <Circle
                        key={point.label}
                        cx={x}
                        cy={y}
                        r={index === detail.chart.length - 1 ? 5 : 3}
                        fill="#F5E3AF"
                      />
                    );
                  })}
                  {detail.chart.map((point, index) => {
                    const x = 8 + ((chartWidth - 16) / Math.max(1, detail.chart.length - 1)) * index;
                    return (
                      <SvgText
                        key={`${point.label}-label`}
                        x={x}
                        y={chartHeight - 3}
                        fill="rgba(255,255,255,0.56)"
                        fontSize="8"
                        fontWeight="700"
                        textAnchor="middle">
                        {point.label}
                      </SvgText>
                    );
                  })}
                </Svg>
              </View>
            ) : null}

            <View style={styles.signalCard}>
              <Text style={styles.signalLabel} numberOfLines={1}>
                CANLI SİNYAL
              </Text>
              <Text style={styles.signalTitle} numberOfLines={1}>
                {detail.signalTitle}
              </Text>
              <Text style={styles.signalBody} numberOfLines={2}>
                {detail.signalBody}
              </Text>
            </View>

            {detail.advisorHint ? (
              <View style={styles.advisorCard}>
                <Ionicons name="sparkles-outline" size={14} color="#0D3F39" />
                <Text style={styles.advisorText} numberOfLines={2}>
                  {detail.advisorHint}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {detail.primaryAction.enabled !== false ? (
              <Pressable
                onPress={() => handleRoute(detail.primaryAction.route)}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                accessibilityRole="button">
                <Text style={styles.primaryBtnText} numberOfLines={1}>
                  {detail.primaryAction.label}
                </Text>
              </Pressable>
            ) : null}
            {detail.secondaryAction ? (
              <Pressable
                onPress={() => handleRoute(detail.secondaryAction?.route)}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                accessibilityRole="button">
                <Text style={styles.secondaryBtnText} numberOfLines={1}>
                  {detail.secondaryAction.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 40, 36, 0.35)',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#0D3F39',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245,227,175,0.35)',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeBtn: {
    minWidth: CENTER_MIN_TOUCH_TARGET,
    minHeight: CENTER_MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 8,
    gap: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.68)',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.13)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    padding: 10,
    gap: 6,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.72)',
  },
  signalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(157,242,210,0.13)',
    backgroundColor: 'rgba(255,255,255,0.065)',
    padding: 12,
    gap: 4,
  },
  signalLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: '#9DF2D2',
  },
  signalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  signalBody: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
  advisorCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.24)',
    backgroundColor: 'rgba(245,227,175,0.10)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advisorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 8,
  },
  primaryBtn: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 999,
    backgroundColor: '#F5E3AF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtn: {
    minHeight: CENTER_MIN_TOUCH_TARGET,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0D3F39',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F5E3AF',
  },
  pressed: {
    opacity: 0.88,
  },
});
