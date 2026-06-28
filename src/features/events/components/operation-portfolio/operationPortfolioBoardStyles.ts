import { StyleSheet } from 'react-native';

export const operationPortfolioPalette = {
  canvas: '#F4F9F6',
  surface: '#FFFCF5',
  surfaceWarm: '#FFF6E6',
  surfaceLift: '#EAF6F0',
  stroke: 'rgba(7, 86, 79, 0.12)',
  strokeStrong: 'rgba(216, 167, 46, 0.28)',
  teal: '#07564F',
  tealMid: '#0D7168',
  tealSoft: '#DFF1EB',
  mint: '#93E8BD',
  cream: '#FFF6E6',
  gold: '#D8A72E',
  goldSoft: '#FFE5A2',
  green: '#3E9E6A',
  amber: '#C58A1E',
  red: '#C85A4B',
  text: '#173D3A',
  muted: '#68746E',
  faint: 'rgba(23, 61, 58, 0.42)',
  white: '#FFFFFF',
} as const;

export const operationPortfolioBoardStyles = StyleSheet.create({
  root: {
    gap: 12,
    minWidth: 0,
    flexShrink: 1,
  },
  boardSurface: {
    borderRadius: 24,
    padding: 14,
    gap: 12,
    backgroundColor: operationPortfolioPalette.surface,
    borderWidth: 1,
    borderColor: operationPortfolioPalette.stroke,
    shadowColor: '#043A36',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroBlock: {
    gap: 8,
    minWidth: 0,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  dayPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: operationPortfolioPalette.tealSoft,
    flexShrink: 0,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: operationPortfolioPalette.teal,
  },
  tonePill: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: operationPortfolioPalette.surfaceWarm,
    borderWidth: 1,
    borderColor: operationPortfolioPalette.strokeStrong,
  },
  tonePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: operationPortfolioPalette.amber,
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: operationPortfolioPalette.text,
  },
  heroSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: operationPortfolioPalette.muted,
  },
  heroMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: operationPortfolioPalette.tealMid,
  },
  priorityRail: {
    height: 4,
    borderRadius: 999,
    backgroundColor: operationPortfolioPalette.tealSoft,
    overflow: 'hidden',
  },
  priorityRailFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: operationPortfolioPalette.gold,
  },
  slotPrimary: {
    borderRadius: 20,
    padding: 12,
    gap: 8,
    backgroundColor: operationPortfolioPalette.surfaceLift,
    borderWidth: 1.5,
    borderColor: operationPortfolioPalette.strokeStrong,
    minWidth: 0,
  },
  slotSecondary: {
    borderRadius: 18,
    padding: 10,
    gap: 7,
    backgroundColor: operationPortfolioPalette.surfaceWarm,
    borderWidth: 1,
    borderColor: operationPortfolioPalette.stroke,
    minWidth: 0,
  },
  slotCompact: {
    borderRadius: 16,
    padding: 9,
    gap: 6,
    backgroundColor: operationPortfolioPalette.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(13,113,104,0.14)',
    minWidth: 0,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  slotTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: operationPortfolioPalette.text,
  },
  slotType: {
    fontSize: 10,
    fontWeight: '800',
    color: operationPortfolioPalette.tealMid,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 140,
    flexShrink: 1,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '900',
  },
  deferLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: operationPortfolioPalette.muted,
  },
  slotCta: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: operationPortfolioPalette.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.28)',
  },
  slotCtaText: {
    fontSize: 12,
    fontWeight: '900',
    color: operationPortfolioPalette.teal,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 11,
    gap: 8,
    backgroundColor: operationPortfolioPalette.surface,
    borderWidth: 1,
    borderColor: operationPortfolioPalette.stroke,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: operationPortfolioPalette.teal,
    letterSpacing: 0.3,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  capacityMeterTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: operationPortfolioPalette.tealSoft,
    overflow: 'hidden',
    minWidth: 0,
  },
  capacityMeterFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: operationPortfolioPalette.tealMid,
  },
  capacityLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: operationPortfolioPalette.gold,
    flexShrink: 0,
  },
  capacitySummary: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: operationPortfolioPalette.muted,
  },
  conflictBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(200,90,75,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(200,90,75,0.22)',
  },
  conflictBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: operationPortfolioPalette.red,
  },
  conflictLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: operationPortfolioPalette.text,
  },
  pendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  pendingChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: operationPortfolioPalette.tealSoft,
    maxWidth: '48%',
    flexShrink: 1,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: operationPortfolioPalette.teal,
  },
  balanceTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: operationPortfolioPalette.tealSoft,
    overflow: 'hidden',
  },
  balanceFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: operationPortfolioPalette.mint,
  },
  balanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  balanceLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: operationPortfolioPalette.muted,
    flexShrink: 1,
  },
  heroCta: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: operationPortfolioPalette.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(216,167,46,0.28)',
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '900',
    color: operationPortfolioPalette.teal,
  },
});

export function chipColors(tone: string): { bg: string; text: string; border: string } {
  switch (tone) {
    case 'gold':
      return {
        bg: operationPortfolioPalette.surfaceWarm,
        text: operationPortfolioPalette.amber,
        border: 'rgba(216,167,46,0.24)',
      };
    case 'amber':
    case 'warning':
      return {
        bg: 'rgba(197,138,30,0.12)',
        text: operationPortfolioPalette.amber,
        border: 'rgba(197,138,30,0.22)',
      };
    case 'sage':
      return {
        bg: '#E6F6EA',
        text: operationPortfolioPalette.green,
        border: 'rgba(62,158,106,0.18)',
      };
    case 'teal':
    default:
      return {
        bg: operationPortfolioPalette.tealSoft,
        text: operationPortfolioPalette.tealMid,
        border: 'rgba(13,113,104,0.16)',
      };
  }
}
