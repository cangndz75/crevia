import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';

type HubSectionShellProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeTone?: 'gold' | 'teal' | 'muted';
  children: ReactNode;
  footer?: ReactNode;
  gradient?: readonly [string, string];
};

export function HubSectionShell({
  title,
  subtitle,
  icon,
  iconColor = colors.headerTealDark,
  iconBg = colors.primaryMuted,
  badge,
  badgeTone = 'muted',
  children,
  footer,
  gradient = ['#FFFFFF', '#F4FAF9'],
}: HubSectionShellProps) {
  return (
    <View style={[styles.wrap, shadows.soft]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {badge ? (
                <View
                  style={[
                    styles.badge,
                    badgeTone === 'gold' && styles.badgeGold,
                    badgeTone === 'teal' && styles.badgeTeal,
                    badgeTone === 'muted' && styles.badgeMuted,
                  ]}>
                  <Text
                    style={[
                      styles.badgeText,
                      badgeTone === 'gold' && styles.badgeTextGold,
                      badgeTone === 'teal' && styles.badgeTextTeal,
                    ]}>
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {children}
        {footer}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.12)',
  },
  gradient: {
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGold: {
    backgroundColor: colors.hubGoldMuted,
  },
  badgeTeal: {
    backgroundColor: colors.primaryMuted,
  },
  badgeMuted: {
    backgroundColor: colors.backgroundAlt,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  badgeTextGold: {
    color: colors.hubGoldDark,
  },
  badgeTextTeal: {
    color: colors.headerTealDark,
  },
});
