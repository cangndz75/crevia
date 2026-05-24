import { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  hero: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.15,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  stat: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } satisfies TextStyle,
} as const;
