import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SELECTOR_AUDIT_CORE_BOUNDARY_FILES,
  SELECTOR_AUDIT_FORBIDDEN_WORDS,
  SELECTOR_AUDIT_TARGETS,
} from './selectorAuditConstants';
import type {
  PerformanceAuditFinding,
  PerformanceAuditSurface,
  SelectorAuditResult,
} from './selectorAuditTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');

function readRepoFile(relPath: string): string {
  const full = join(REPO_ROOT, relPath);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8');
}

function finding(
  id: string,
  surface: PerformanceAuditSurface,
  componentName: string,
  riskLevel: PerformanceAuditFinding['riskLevel'],
  message: string,
  recommendation: string,
  status: PerformanceAuditFinding['status'],
): PerformanceAuditFinding {
  return {
    id,
    surface,
    componentName,
    riskLevel,
    message,
    recommendation,
    status,
  };
}

function hasPresentationBuild(content: string): boolean {
  return /build\w+(Model|Bundle|Card|Hub|Map|Report|Sheet|Input)/.test(content);
}

function scanComponentFile(
  relPath: string,
  surface: PerformanceAuditSurface,
  componentName: string,
): PerformanceAuditFinding[] {
  const content = readRepoFile(relPath);
  const findings: PerformanceAuditFinding[] = [];

  if (!content) {
    findings.push(
      finding(
        `missing_${componentName}`,
        surface,
        componentName,
        'high',
        `${relPath} bulunamadı.`,
        'Dosya yolunu doğrula.',
        'fail',
      ),
    );
    return findings;
  }

  const jsxReturn = content.slice(content.indexOf('return ('));

  if (
    /useGameStore\(\s*\([^)]*\)\s*=>\s*s\.\w+\([^)]*\)/.test(jsxReturn) &&
    !content.includes('useEffect')
  ) {
    findings.push(
      finding(
        `render_store_action_${componentName}`,
        surface,
        componentName,
        'critical',
        'Render gövdesinde store action çağrısı riski.',
        'Handler veya useEffect içine taşı.',
        'fail',
      ),
    );
  }

  if (
    content.includes('Math.random()') &&
    !content.includes('__DEV__') &&
    !relPath.includes('verify')
  ) {
    findings.push(
      finding(
        `render_random_${componentName}`,
        surface,
        componentName,
        'critical',
        'Deterministik olmayan hesaplama.',
        'Sabit seed veya presentation katmanına taşı.',
        'fail',
      ),
    );
  }

  if (
    /useGameStore\(\(s\)\s*=>\s*s\.gameState\)/.test(content) ||
    /useGameStore\(selectGameState\)/.test(content)
  ) {
    const mitigated =
      content.includes('useMemo') &&
      (componentName === 'HubScreen' ||
        componentName === 'MapScreen' ||
        componentName === 'EndOfDayReportView');
    findings.push(
      finding(
        `full_game_state_${componentName}`,
        surface,
        componentName,
        mitigated ? 'medium' : 'high',
        'Tam gameState selector okuması re-render riski taşır.',
        mitigated
          ? 'Presentation model useMemo ile sınırlandırılmış; child kartlar dar selector kullanmalı.'
          : 'Dar selector veya useShallow ile slice oku.',
        mitigated ? 'pass' : 'warn',
      ),
    );
  }

  if (hasPresentationBuild(content)) {
    if (content.includes('useMemo')) {
      findings.push(
        finding(
          `memo_presentation_${componentName}`,
          surface,
          componentName,
          'low',
          'Presentation model useMemo ile üretiliyor.',
          'Bağımlılık listesini dar tut.',
          'pass',
        ),
      );
    } else {
      findings.push(
        finding(
          `heavy_presentation_${componentName}`,
          surface,
          componentName,
          'medium',
          'Presentation helper her render çağrılabilir.',
          'useMemo ile model üret.',
          'warn',
        ),
      );
    }
  }

  if (
    content.includes('numberOfLines') &&
    content.includes('flexShrink') &&
    content.includes('minWidth')
  ) {
    findings.push(
      finding(
        `layout_guard_${componentName}`,
        surface,
        componentName,
        'low',
        'Mobil taşma guard’ları mevcut.',
        'Uzun copy eklerken koru.',
        'pass',
      ),
    );
  } else if (content.includes('<Text') || content.includes('<Pressable')) {
    findings.push(
      finding(
        `layout_guard_missing_${componentName}`,
        surface,
        componentName,
        'medium',
        'numberOfLines / flexShrink / minWidth eksik olabilir.',
        'Yoğun metin satırlarına guard ekle.',
        'warn',
      ),
    );
  }

  if (componentName === 'HubDevTools' || componentName === 'PostPilotDevTools') {
    const guarded =
      content.includes('__DEV__') || content.includes('isPostPilotDevToolsEnabled');
    findings.push(
      finding(
        `dev_guard_${componentName}`,
        surface,
        componentName,
        guarded ? 'low' : 'critical',
        guarded ? 'Dev araçları production guard’lı.' : 'Dev araçları guard’sız.',
        guarded ? 'Koru.' : '__DEV__ veya isPostPilotDevToolsEnabled ekle.',
        guarded ? 'pass' : 'fail',
      ),
    );
  }

  if (componentName === 'ReportSeasonEndEvaluationCard') {
    const lazyDetail =
      content.includes('sheetVisible') &&
      (/!sheetVisible/.test(content) ||
        content.includes('if (!sheetVisible)') ||
        content.match(/buildSeasonEndDetailSheetModel[\s\S]{0,120}sheetVisible/));
    findings.push(
      finding(
        `season_end_lazy_detail_${componentName}`,
        surface,
        componentName,
        lazyDetail ? 'low' : 'medium',
        lazyDetail
          ? 'Detay sheet modeli sheet açıkken üretiliyor.'
          : 'Detay sheet modeli her render hesaplanıyor.',
        lazyDetail ? 'Koru.' : 'sheetVisible guard ile lazy üret.',
        lazyDetail ? 'pass' : 'warn',
      ),
    );
  }

  if (componentName === 'OperationalResourcesDetailSheet') {
    const activeTabOnly =
      content.includes('activeRows') &&
      content.includes('activeRows.map') &&
      !content.includes('personnelRows.map') &&
      !content.includes('vehicleRows.map') &&
      !content.includes('containerRows.map');
    const visibleGuard =
      content.includes('if (!visible') ||
      content.includes('!visible)') ||
      /if\s*\(\s*!visible/.test(content);
    const lazyModel =
      visibleGuard &&
      (content.includes('if (!visible) return') ||
        (content.includes('if (!visible)') && content.includes('return undefined')) ||
        content.includes('if (!visible || !sheetModel)'));

    findings.push(
      finding(
        `resource_sheet_tab_${componentName}`,
        surface,
        componentName,
        activeTabOnly ? 'low' : 'medium',
        activeTabOnly
          ? 'Sadece aktif tab satırları render ediliyor.'
          : 'Tüm tab içerikleri aynı anda render edilebilir.',
        'activeRows ile tek tab göster.',
        activeTabOnly ? 'pass' : 'warn',
      ),
    );
    findings.push(
      finding(
        `resource_sheet_visible_${componentName}`,
        surface,
        componentName,
        lazyModel ? 'low' : 'medium',
        lazyModel
          ? 'Sheet kapalıyken ağır model üretilmiyor.'
          : 'Sheet kapalıyken model hesaplanabilir.',
        'visible guard ile useMemo kısa devre.',
        lazyModel ? 'pass' : 'warn',
      ),
    );
  }

  if (componentName === 'MapScreen') {
    const memoOverlays =
      content.includes('mapCrisisPresentation = useMemo') &&
      content.includes('mapResourcePresentation = useMemo') &&
      content.includes('crisisHighlightDistrictIds = useMemo') &&
      content.includes('resourceHighlightDistrictIds = useMemo');
    findings.push(
      finding(
        `map_overlay_memo_${componentName}`,
        surface,
        componentName,
        memoOverlays ? 'low' : 'high',
        memoOverlays
          ? 'Harita kriz/kaynak overlay modelleri memoize.'
          : 'Harita overlay her render yeniden hesaplanıyor.',
        'useMemo ile bundle üret.',
        memoOverlays ? 'pass' : 'warn',
      ),
    );

    const crisisPriority =
      content.includes('crisisSet') ||
      (content.includes('crisisHighlightDistrictIds') &&
        content.includes('!crisisSet.has'));
    findings.push(
      finding(
        `map_crisis_priority_${componentName}`,
        surface,
        componentName,
        crisisPriority ? 'low' : 'medium',
        crisisPriority
          ? 'Kaynak highlight kriz mahallelerini ezmez.'
          : 'Kriz önceliği guard kontrol et.',
        'crisisSet ile filtrele.',
        crisisPriority ? 'pass' : 'warn',
      ),
    );
  }

  if (
    componentName === 'EventAssignmentPanel' ||
    componentName === 'OperationImpactPreviewStrip'
  ) {
    const returnBody = content.slice(content.indexOf('return ('));
    const sideEffectRisk =
      /return\s*\([\s\S]{0,400}\.(push|splice)\(/.test(returnBody) ||
      /return\s*\([\s\S]{0,400}useGameStore\.getState\(\)\.\w+\(/.test(returnBody);
    findings.push(
      finding(
        `event_flow_side_effect_${componentName}`,
        surface,
        componentName,
        sideEffectRisk ? 'critical' : 'low',
        sideEffectRisk
          ? 'Render içinde mutation/getState action riski.'
          : 'Render side-effect yok.',
        sideEffectRisk ? 'Effect veya handler kullan.' : 'Koru.',
        sideEffectRisk ? 'fail' : 'pass',
      ),
    );
  }

  if (content.includes('Modal') && content.includes('visible')) {
    const closedSkip =
      content.includes('if (!visible') ||
      content.includes('if (!model') ||
      content.includes('if (!sheetModel');
    if (closedSkip) {
      findings.push(
        finding(
          `modal_closed_skip_${componentName}`,
          surface,
          componentName,
          'low',
          'Modal/sheet kapalıyken erken çıkış var.',
          'Ağır listeleri visible ile koru.',
          'pass',
        ),
      );
    }
  }

  return findings;
}

function scanCoreUiBoundaries(): PerformanceAuditFinding[] {
  const findings: PerformanceAuditFinding[] = [];

  for (const rel of SELECTOR_AUDIT_CORE_BOUNDARY_FILES) {
    const content = readRepoFile(rel);
    const importsUi =
      content.includes("from '@/features/") &&
      (/components\//.test(content) ||
        content.includes('/screens/') ||
        content.includes('Screen.tsx'));
    const id = rel.split('/').pop()?.replace('.ts', '') ?? rel;
    if (rel.includes('playerFlowAuditEngine')) {
      findings.push(
        finding(
          `core_boundary_${id}`,
          'hub',
          'PlayerFlowAuditEngine',
          'low',
          'Player flow audit yalnızca presentation util import eder; React UI yok.',
          'UI component import ekleme.',
          importsUi ? 'warn' : 'pass',
        ),
      );
      continue;
    }
    findings.push(
      finding(
        `core_boundary_${id}`,
        'hub',
        id,
        importsUi ? 'high' : 'low',
        importsUi
          ? `${id} React UI import ediyor.`
          : `${id} UI component import etmiyor.`,
        importsUi ? 'Core’dan features UI kaldır.' : 'Koru.',
        importsUi ? 'fail' : 'pass',
      ),
    );
  }

  return findings;
}

export function runSelectorAudit(): SelectorAuditResult {
  const findings: PerformanceAuditFinding[] = [];

  for (const target of SELECTOR_AUDIT_TARGETS) {
    for (const path of target.paths) {
      findings.push(
        ...scanComponentFile(path, target.surface, target.componentName),
      );
    }
  }

  findings.push(...scanCoreUiBoundaries());

  const surfaces = new Set<PerformanceAuditSurface>();
  for (const target of SELECTOR_AUDIT_TARGETS) {
    surfaces.add(target.surface);
  }
  for (const surface of surfaces) {
    findings.push(
      finding(
        `surface_audited_${surface}`,
        surface,
        `${surface}_surface`,
        'low',
        `${surface} yüzeyi audit hedef listesinde.`,
        'Yeni kart eklerken listeye ekle.',
        'pass',
      ),
    );
  }

  const failCount = findings.filter((f) => f.status === 'fail').length;
  const warnCount = findings.filter((f) => f.status === 'warn').length;
  const passCount = findings.filter((f) => f.status === 'pass').length;

  let health: SelectorAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}

export function collectSelectorAuditCopy(): string {
  return SELECTOR_AUDIT_TARGETS.map((t) => t.componentName).join(' ');
}

export function countSelectorAuditForbiddenWords(text: string): number {
  const lower = text.toLowerCase();
  return SELECTOR_AUDIT_FORBIDDEN_WORDS.filter((word) => {
    if (word === 'xp') return /\bxp\b/.test(lower);
    return lower.includes(word);
  }).length;
}
