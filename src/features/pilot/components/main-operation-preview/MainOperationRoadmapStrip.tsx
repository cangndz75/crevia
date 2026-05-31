import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { RoadmapStep, RoadmapStepState } from '@/features/pilot/components/operation-preview/operationPreviewData';
import {
  MAIN_OP_PREVIEW_COLORS,
  MAIN_OP_PREVIEW_RADIUS,
  cardShadow,
} from '@/features/pilot/utils/mainOperationPreviewTheme';

type MainOperationRoadmapStripProps = {
  steps: RoadmapStep[];
};

function nodePalette(state: RoadmapStepState) {
  switch (state) {
    case 'completed':
      return {
        ring: '#239B68',
        fill: '#239B68',
        icon: '#FFFFFF' as const,
        iconName: 'checkmark' as const,
      };
    case 'next':
      return {
        ring: '#C99A24',
        fill: '#FFF3D6',
        icon: '#B88A16' as const,
        iconName: null,
      };
    default:
      return {
        ring: '#D8D0C2',
        fill: '#F3EFE6',
        icon: '#9CA3AF' as const,
        iconName: null,
      };
  }
}

function connectorStyle(leftState: RoadmapStepState) {
  if (leftState === 'completed') {
    return styles.connectorSolidGreen;
  }
  if (leftState === 'next') {
    return styles.connectorSolidGold;
  }
  return styles.connectorDashed;
}

function RoadmapNode({
  step,
  connectorBefore,
  leftState,
}: {
  step: RoadmapStep;
  connectorBefore?: RoadmapStepState;
  leftState?: RoadmapStepState;
}) {
  const palette = nodePalette(step.state);

  return (
    <View style={styles.node}>
      <View style={styles.nodeTop}>
        {connectorBefore ? (
          <View style={[styles.connector, connectorStyle(leftState ?? 'locked')]} />
        ) : null}
        <View style={[styles.circleOuter, { borderColor: palette.ring }]}>
          <View style={[styles.circleInner, { backgroundColor: palette.fill }]}>
            <Ionicons
              name={
                step.state === 'completed'
                  ? palette.iconName!
                  : step.icon
              }
              size={step.state === 'completed' ? 22 : 18}
              color={palette.icon}
            />
          </View>
        </View>
      </View>
      <Text style={styles.nodeTitle} numberOfLines={2}>
        {step.title}
      </Text>
      <Text style={styles.nodeStatus} numberOfLines={1}>
        {step.statusLabel}
      </Text>
    </View>
  );
}

export function MainOperationRoadmapStrip({ steps }: MainOperationRoadmapStripProps) {
  return (
    <View style={[styles.card, cardShadow]}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={18} color={MAIN_OP_PREVIEW_COLORS.teal} />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Açılış Yol Haritası</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Pilot başarıların yeni sistemlerin açılış sırasını belirler.
          </Text>
        </View>
      </View>

      <View style={styles.roadmap}>
        {steps.map((step, index) => (
          <RoadmapNode
            key={step.id}
            step={step}
            connectorBefore={index > 0 ? steps[index - 1]?.state : undefined}
            leftState={index > 0 ? steps[index - 1]?.state : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    borderRadius: MAIN_OP_PREVIEW_RADIUS.card,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E7E0D1',
    padding: 16,
    minHeight: 138,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: MAIN_OP_PREVIEW_COLORS.muted,
  },
  roadmap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  node: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  nodeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    minHeight: 54,
  },
  connector: {
    flex: 1,
    height: 3,
    marginRight: 4,
    maxWidth: 28,
  },
  connectorSolidGreen: {
    backgroundColor: '#239B68',
  },
  connectorSolidGold: {
    backgroundColor: '#C99A24',
  },
  connectorDashed: {
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D8D0C2',
    backgroundColor: 'transparent',
  },
  circleOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
    zIndex: 1,
  },
  circleInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: MAIN_OP_PREVIEW_COLORS.text,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  nodeStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: MAIN_OP_PREVIEW_COLORS.muted,
    textAlign: 'center',
  },
});
