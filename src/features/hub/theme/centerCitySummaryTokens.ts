export const centerSummaryTokens = {
  colors: {
    creamBg: '#F8F3E6',
    card: '#FFFFFF',
    deepGreen: '#064E45',
    green: '#3F8F5A',
    gold: '#D7A928',
    blue: '#2F6FB4',
    muted: '#6B7D78',
    border: 'rgba(6, 78, 69, 0.12)',
    statusGreen: '#0F5A4F',
    statusGreenDark: '#064E45',
    heroFallbackStart: '#EEF5F1',
    heroFallbackEnd: '#DCEFE8',
  },
  radius: {
    summaryCard: 26,
    metricCard: 16,
    statusStrip: 20,
    hero: 26,
  },
  spacing: {
    internalPadding: 12,
    gap: 10,
    metricGap: 8,
  },
  shadow: {
    shadowColor: 'rgba(15, 60, 52, 0.14)',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  layout: {
    heroHeight: 148,
    metricsOverlap: 22,
    statusStripMinHeight: 60,
  },
} as const;

export const CENTER_SUMMARY_COMPACT_WIDTH = 390;
