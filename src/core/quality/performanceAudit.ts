import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ANIMATION_DURATION, MAX_ANIMATION_DURATION_MS } from '@/core/animations/animationTokens';
import { ANIMATION_PRESET_DEFINITIONS } from '@/core/animations/animationPresetDefinitions';

import type {
  QualityWarning,
  ScreenPerformanceNote,
  UiGuardScanResult,
} from './architectureAuditTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export const CRITICAL_UI_GUARD_TARGETS: Array<{
  id: string;
  paths: string[];
}> = [
  { id: 'HubTaskTrackingHero', paths: ['src/features/hub/components/HubTaskTrackingHero.tsx'] },
  { id: 'PostPilotAgendaBanner', paths: ['src/features/hub/components/PostPilotAgendaBanner.tsx'] },
  {
    id: 'HubAuthorityProgressChip',
    paths: ['src/features/hub/components/HubAuthorityProgressChip.tsx'],
  },
  {
    id: 'MapOperationBottomPanel',
    paths: ['src/features/map/components/MapOperationBottomPanel.tsx'],
  },
  { id: 'MapNeighborhoodStrip', paths: ['src/features/map/components/MapNeighborhoodStrip.tsx'] },
  {
    id: 'DecisionOptionCard',
    paths: ['src/features/events/components/DecisionOptionCard.tsx'],
  },
  {
    id: 'EventDispatchPhase',
    paths: [
      'src/features/events/components/event-workflow/dispatch/EventDispatchPhase.tsx',
      'src/features/events/components/event-workflow/dispatch/DispatchCommandCard.tsx',
      'src/features/events/components/event-workflow/dispatch/DispatchWorkflowFooter.tsx',
    ],
  },
  {
    id: 'EventFieldPhase',
    paths: [
      'src/features/events/components/event-workflow/field/EventFieldPhase.tsx',
      'src/features/events/components/event-workflow/field/LiveOperationCard.tsx',
      'src/features/events/components/event-workflow/field/FieldWorkflowFooter.tsx',
    ],
  },
  {
    id: 'EventResultHeroCard',
    paths: ['src/features/events/components/EventResultHeroCard.tsx'],
  },
  {
    id: 'ReportAuthoritySummary',
    paths: ['src/features/reports/components/ReportAuthoritySummary.tsx'],
  },
  { id: 'ReportBadgeSummary', paths: ['src/features/reports/components/ReportBadgeSummary.tsx'] },
  {
    id: 'ProfileAuthorityCard',
    paths: ['src/features/profile/components/ProfileAuthorityCard.tsx'],
  },
  {
    id: 'ProfileBadgeShowcaseCard',
    paths: ['src/features/profile/components/ProfileBadgeShowcaseCard.tsx'],
  },
  {
    id: 'SocialMentionInlineList',
    paths: ['src/features/social/components/SocialMentionInlineList.tsx'],
  },
  { id: 'LeaderboardRow', paths: ['src/features/leaderboard/components/LeaderboardRow.tsx'] },
  {
    id: 'LeaderboardPodiumStrip',
    paths: ['src/features/leaderboard/components/LeaderboardPodiumStrip.tsx'],
  },
];

const SCREEN_FILES: Array<{ screen: string; path: string }> = [
  { screen: 'HubScreen', path: 'src/features/hub/screens/HubScreen.tsx' },
  { screen: 'ReportScreen', path: 'src/features/reports/screens/ReportScreen.tsx' },
  {
    screen: 'EndOfDayReportView',
    path: 'src/features/reports/components/end-of-day/EndOfDayReportView.tsx',
  },
  { screen: 'ProfileScreen', path: 'src/features/profile/screens/ProfileScreen.tsx' },
  { screen: 'MapScreen', path: 'src/features/map/screens/MapScreen.tsx' },
  { screen: 'SocialPulseScreen', path: 'src/features/social/screens/SocialPulseScreen.tsx' },
  { screen: 'LeaderboardScreen', path: 'src/features/leaderboard/screens/LeaderboardScreen.tsx' },
  {
    screen: 'EventDetailDecisionScreen',
    path: 'src/features/events/screens/EventDetailDecisionScreen.tsx',
  },
];

function readRepoFile(relPath: string): string {
  const full = join(REPO_ROOT, relPath);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8');
}

function estimateComponentCount(content: string): number {
  const fnComponents = (content.match(/export function \w+/g) ?? []).length;
  const constComponents = (content.match(/export const \w+ = \(/g) ?? []).length;
  const jsxReturns = (content.match(/return \(/g) ?? []).length;
  return Math.max(fnComponents + constComponents, jsxReturns, 1);
}

function scanUiGuards(): UiGuardScanResult[] {
  return CRITICAL_UI_GUARD_TARGETS.map((target) => {
    const blob = target.paths.map(readRepoFile).join('\n');
    const hasNumberOfLines = blob.includes('numberOfLines');
    const hasFlexShrink = blob.includes('flexShrink');
    const hasMinWidth = blob.includes('minWidth');
    return {
      componentId: target.id,
      path: target.paths.join(' + '),
      hasNumberOfLines,
      hasFlexShrink,
      hasMinWidth,
      ok: hasNumberOfLines && hasFlexShrink && hasMinWidth,
    };
  });
}

function buildScreenNotes(): ScreenPerformanceNote[] {
  return SCREEN_FILES.map(({ screen, path }) => {
    const content = readRepoFile(path);
    const componentCountEstimate = estimateComponentCount(content);
    const conditionalCount =
      (content.match(/\?\.|&&\s*\(|ternary|\? \(/g) ?? []).length;
    const listCount =
      (content.match(/\.map\(|FlatList|ScrollView/g) ?? []).length;
    const animationCount =
      (content.match(/reanimated|Animated\.|useEntranceAnimation|FadeIn/g) ?? []).length;

    const conditionalRenderDensity: ScreenPerformanceNote['conditionalRenderDensity'] =
      conditionalCount > 25 ? 'high' : conditionalCount > 12 ? 'medium' : 'low';
    const listGridDensity: ScreenPerformanceNote['listGridDensity'] =
      listCount > 8 ? 'high' : listCount > 4 ? 'medium' : 'low';
    const animationUsage: ScreenPerformanceNote['animationUsage'] =
      animationCount > 6 ? 'medium' : animationCount > 0 ? 'low' : 'low';

    let risk: ScreenPerformanceNote['risk'] = 'low';
    if (componentCountEstimate > 8 || conditionalRenderDensity === 'high') {
      risk = 'high';
    } else if (componentCountEstimate > 5 || listGridDensity === 'high') {
      risk = 'medium';
    }

    return {
      screen,
      componentCountEstimate,
      conditionalRenderDensity,
      listGridDensity,
      animationUsage,
      risk,
      recommendation:
        risk === 'high'
          ? 'Alt kartları memoize et; selector ile minimal view-model oku.'
          : risk === 'medium'
            ? 'Koşullu blokları presentation model ile sadeleştir.'
            : 'Mevcut yapı soft-launch için yeterli.',
    };
  });
}

function scanRenderRisks(): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  const hubScreen = readRepoFile('src/features/hub/screens/HubScreen.tsx');
  if (hubScreen.includes('useGameStore((s) => s.gameState)')) {
    const mitigated =
      hubScreen.includes('buildHubScreenLayoutModel') &&
      hubScreen.includes('useMemo');
    warnings.push({
      id: 'hub_full_game_state',
      severity: mitigated ? 'low' : 'medium',
      area: 'store',
      message: mitigated
        ? 'HubScreen gameState okur; hubLayout/hubCardVisibility useMemo ile sınırlı.'
        : 'HubScreen tüm gameState’i okuyor; sık re-render riski.',
      recommendation: mitigated
        ? 'Alt kartlar dar selector kullanmaya devam et.'
        : 'Layout model için dar selector + useShallow kullan.',
    });
  }

  const eventDetail = readRepoFile('src/features/events/screens/EventDetailDecisionScreen.tsx');
  if (eventDetail.includes('useGameStore.getState()')) {
    warnings.push({
      id: 'event_detail_get_state_in_memo',
      severity: 'low',
      area: 'store',
      message: 'EventDetailDecisionScreen useMemo içinde getState kullanıyor.',
      recommendation: 'solvedEvents için selector ile memo input sabitle.',
    });
  }

  const pulseFile = readRepoFile('src/core/animations/usePulseAnimation.ts');
  if (pulseFile.includes('withRepeat') && pulseFile.includes('repeatCount')) {
    warnings.push({
      id: 'pulse_limited_repeat',
      severity: 'low',
      area: 'animation',
      message: 'selectedPulse withRepeat sınırlı tekrar ile guard’lı.',
      recommendation: 'Sonsuz döngü ekleme.',
    });
  } else if (pulseFile.includes('withRepeat') && !pulseFile.includes('repeatCount')) {
    warnings.push({
      id: 'pulse_endless_risk',
      severity: 'high',
      area: 'animation',
      message: 'selectedPulse sınırsız withRepeat riski.',
      recommendation: 'repeatCount veya finite sequence kullan.',
    });
  }

  return warnings;
}

export function runPerformanceAudit(): {
  screens: ScreenPerformanceNote[];
  uiGuards: UiGuardScanResult[];
  warnings: QualityWarning[];
  animationDurationsOk: boolean;
  selectedPulseEndless: boolean;
} {
  const warnings: QualityWarning[] = [...scanRenderRisks()];
  const screens = buildScreenNotes();
  const uiGuards = scanUiGuards();

  for (const screen of screens) {
    if (screen.risk === 'high') {
      warnings.push({
        id: `screen_risk_${screen.screen}`,
        severity: 'medium',
        area: 'performance',
        message: `${screen.screen} yüksek render karmaşıklığı tahmini.`,
        recommendation: screen.recommendation,
      });
    }
  }

  for (const guard of uiGuards) {
    if (!guard.ok) {
      warnings.push({
        id: `guard_missing_${guard.componentId}`,
        severity: 'medium',
        area: 'layout',
        message: `${guard.componentId} layout guard eksik (numberOfLines/flexShrink/minWidth).`,
        recommendation: 'Üç guard’ı da ekle veya delegasyon dosyalarını genişlet.',
      });
    }
  }

  const animationDurationsOk = Object.values(ANIMATION_DURATION).every(
    (ms) => ms < MAX_ANIMATION_DURATION_MS,
  );
  const selectedPulseEndless =
    ANIMATION_PRESET_DEFINITIONS.selectedPulse.endlessLoop === true;

  if (!animationDurationsOk) {
    warnings.push({
      id: 'animation_duration_cap',
      severity: 'high',
      area: 'animation',
      message: 'Animation duration 300ms üstüne çıkıyor.',
      recommendation: 'animationTokens sürelerini düşür.',
    });
  }

  if (selectedPulseEndless) {
    warnings.push({
      id: 'animation_endless_pulse',
      severity: 'high',
      area: 'animation',
      message: 'selectedPulse endlessLoop=true.',
      recommendation: 'endlessLoop false + sınırlı repeat.',
    });
  }

  return {
    screens,
    uiGuards,
    warnings,
    animationDurationsOk,
    selectedPulseEndless,
  };
}
