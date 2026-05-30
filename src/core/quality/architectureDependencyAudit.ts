import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type {
  DomainBoundaryNote,
  ImportScanResult,
  QualityWarning,
  StoreActionAuditNote,
} from './architectureAuditTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const CORE_DIR = join(REPO_ROOT, 'src', 'core');

const VERIFY_SCRIPT_KEYS = [
  'verify:full-loop',
  'verify:full-ux-flow',
  'verify:meta-progression',
  'verify:post-pilot-loop-balance',
  'verify:badges',
  'verify:authority',
  'verify:animation-presentation',
  'verify:icon-presentation',
  'verify:event-authoring',
  'verify:district-identity',
] as const;

function listTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules') continue;
      listTsFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function isVerifyOrAuditFile(relPath: string): boolean {
  const lower = relPath.toLowerCase();
  return (
    lower.includes('verify') ||
    lower.includes('audit') ||
    lower.includes('scenario') ||
    lower.includes('simulation')
  );
}

function scanCoreToFeaturesImports(): ImportScanResult {
  const files = listTsFiles(CORE_DIR);
  let productionCoreToFeaturesCount = 0;
  let verifyCoreToFeaturesCount = 0;
  const samples: string[] = [];

  for (const file of files) {
    const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');
    const content = readFileSync(file, 'utf8');
    if (!content.includes("@/features/") && !content.includes('@/features/')) continue;

    if (isVerifyOrAuditFile(rel)) {
      verifyCoreToFeaturesCount += 1;
    } else {
      productionCoreToFeaturesCount += 1;
      if (samples.length < 8) {
        samples.push(rel);
      }
    }
  }

  const presentationDir = join(CORE_DIR, 'presentation');
  let presentationImportsUi = false;
  if (existsSync(presentationDir)) {
    for (const file of listTsFiles(presentationDir)) {
      const content = readFileSync(file, 'utf8');
      if (
        content.includes("from '@/features/") &&
        (content.includes('/components/') || content.includes('.tsx'))
      ) {
        presentationImportsUi = true;
        break;
      }
    }
  }

  const postPilotUx = join(CORE_DIR, 'postPilot', 'postPilotOperationUxPresentation.ts');
  let postPilotUxImportsUi = false;
  if (existsSync(postPilotUx)) {
    const content = readFileSync(postPilotUx, 'utf8');
    postPilotUxImportsUi =
      content.includes("from 'react-native'") ||
      content.includes('from "react-native"') ||
      (content.includes("@/features/") && content.includes('/components/'));
  }

  return {
    productionCoreToFeaturesCount,
    verifyCoreToFeaturesCount,
    presentationImportsUi,
    postPilotUxImportsUi,
    samples,
  };
}

export function buildStoreActionAuditNotes(): StoreActionAuditNote[] {
  return [
    {
      action: 'endCurrentDay',
      domainCount: 12,
      domains: [
        'personnel',
        'containers',
        'vehicles',
        'social',
        'dailyGoals',
        'dailyPriority',
        'butterflyHooks',
        'carryOver',
        'authority',
        'badges',
        'endDayEngine',
        'pilotRunSnapshot',
      ],
      risk: 'high',
      note: 'Tek action gün sonu raporu için çok domain orkestre ediyor; bilinçli monolith store deseni.',
      recommendedFutureRefactor:
        'Gün sonu pipeline’ını `runEndOfDayPipeline` pure orchestrator + ince store wrapper’a taşı.',
    },
    {
      action: 'completePilot',
      domainCount: 6,
      domains: [
        'authorityEvaluation',
        'badgeEvaluation',
        'pilotRunFinalize',
        'postPilotSeed',
        'leaderboardPersist',
        'dailyReportMerge',
      ],
      risk: 'medium',
      note: 'Pilot kapanışı domain sınırları net; event pool temizliği ile birlikte çalışır.',
      recommendedFutureRefactor:
        'Pilot completion side-effect’lerini `pilotCompletionOrchestrator` modülüne taşı.',
    },
    {
      action: 'startLightMainOperation',
      domainCount: 3,
      domains: ['postPilotOperation', 'cityDay', 'refreshPilotEvents'],
      risk: 'low',
      note: 'Yalnızca pilot completed + post-pilot faz geçişinde çalışır; ana operasyon kilidi açmaz.',
      recommendedFutureRefactor:
        'Post-pilot refresh ile pilot refresh fonksiyonlarını isimlendirme ile ayır (zaten ayrı modüller).',
    },
    {
      action: 'refreshPilotEvents / ensurePostPilotDailyEvents',
      domainCount: 2,
      domains: ['pilotEventEngine', 'postPilotEventEngine'],
      risk: 'low',
      note: 'Pilot ve post-pilot event üretimi ayrı engine dosyalarında; karışım riski düşük.',
      recommendedFutureRefactor:
        'Ortak event pool yazımı için tek adapter, ayrı generation policy.',
    },
  ];
}

export function buildDomainBoundaryNotes(): DomainBoundaryNote[] {
  return [
    {
      domain: 'authority',
      readsFrom: ['core/authority', 'features/profile (verify only)', 'features/hub (chip model)'],
      risk: 'low',
      note: 'Runtime core → features yok; presentation modeller UI tarafında türetiliyor.',
    },
    {
      domain: 'badges',
      readsFrom: ['core/badges', 'features/profile (showcase verify)'],
      risk: 'low',
      note: 'Badge engine core’da; UI showcase presentation katmanında.',
    },
    {
      domain: 'postPilot',
      readsFrom: [
        'core/postPilot',
        'features/map (district labels — core postPilot UX presentation)',
        'features/reports (verify audit only)',
      ],
      risk: 'medium',
      note: 'postPilotOperationUxPresentation map label helper kullanır; UI component import etmez.',
    },
    {
      domain: 'districts',
      readsFrom: ['core/districts', 'features/map adapters'],
      risk: 'low',
      note: 'Kimlik core’da; harita strip presentation map feature utils ile hizalanır.',
    },
    {
      domain: 'presentation/icon',
      readsFrom: ['core/presentation', 'expo vector icons via resolve helpers'],
      risk: 'low',
      note: 'Icon registry UI component import etmez.',
    },
    {
      domain: 'animations',
      readsFrom: ['core/animations', 'react-native-reanimated (hooks only)'],
      risk: 'low',
      note: 'Verify script’leri hariç app bundle’a verify import edilmemeli.',
    },
    {
      domain: 'content/eventAuthoring',
      readsFrom: ['core/content', 'core/districts'],
      risk: 'low',
      note: 'Plan/guide only; gameplay bağlantısı yok.',
    },
    {
      domain: 'uxFlowPresentation',
      readsFrom: ['core/ux', 'features/*/LAYOUT_GUARDS constants'],
      risk: 'medium',
      note: 'Core UX metinleri feature layout guard sabitlerine referans verir; cycle riski düşük ama izlenmeli.',
    },
  ];
}

export function readPackageScriptMatrix(): {
  verifyScripts: string[];
  analyzeScripts: string[];
  missingCritical: string[];
} {
  const pkgPath = join(REPO_ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const scripts = pkg.scripts ?? {};
  const verifyScripts = Object.keys(scripts).filter((k) => k.startsWith('verify:'));
  const analyzeScripts = Object.keys(scripts).filter((k) => k.startsWith('analyze:'));
  const missingCritical = VERIFY_SCRIPT_KEYS.filter((k) => !scripts[k]);
  return { verifyScripts, analyzeScripts, missingCritical };
}

export function runArchitectureDependencyAudit(): {
  storeActions: StoreActionAuditNote[];
  domainBoundaries: DomainBoundaryNote[];
  importScan: ImportScanResult;
  warnings: QualityWarning[];
} {
  const warnings: QualityWarning[] = [];
  const importScan = scanCoreToFeaturesImports();

  if (importScan.presentationImportsUi) {
    warnings.push({
      id: 'icon_registry_ui_import',
      severity: 'high',
      area: 'presentation',
      message: 'Icon registry UI React component import ediyor.',
      recommendation: 'Yalnızca semantik key + Ionicon resolve kalsın.',
    });
  } else {
    warnings.push({
      id: 'icon_registry_clean',
      severity: 'low',
      area: 'presentation',
      message: 'Icon registry UI component import etmiyor.',
      recommendation: 'Mevcut ayrımı koru.',
    });
  }

  if (importScan.postPilotUxImportsUi) {
    warnings.push({
      id: 'post_pilot_ux_ui_import',
      severity: 'high',
      area: 'postPilot',
      message: 'Post-pilot UX presentation UI component import ediyor.',
      recommendation: 'Presentation dosyasını pure string/model katmanında tut.',
    });
  }

  if (importScan.productionCoreToFeaturesCount > 0) {
    warnings.push({
      id: 'core_features_production_import',
      severity: importScan.productionCoreToFeaturesCount > 12 ? 'high' : 'medium',
      area: 'architecture',
      message: `Production core dosyalarında ${importScan.productionCoreToFeaturesCount} adet @/features import var.`,
      recommendation:
        'Tipleri core/models veya core/contracts altına taşı; verify-only importları verify dosyalarında bırak.',
    });
  }

  if (importScan.verifyCoreToFeaturesCount > 0) {
    warnings.push({
      id: 'core_features_verify_import',
      severity: 'low',
      area: 'verify',
      message: `Verify/audit core dosyalarında ${importScan.verifyCoreToFeaturesCount} adet @/features import (kabul edilebilir).`,
      recommendation: 'Verify modüllerini app barrel exportlarına dahil etme.',
    });
  }

  const scriptMatrix = readPackageScriptMatrix();
  if (scriptMatrix.missingCritical.length > 0) {
    warnings.push({
      id: 'missing_verify_scripts',
      severity: 'medium',
      area: 'verify',
      message: `Eksik kritik verify script: ${scriptMatrix.missingCritical.join(', ')}`,
      recommendation: 'package.json scripts bölümüne ekle.',
    });
  }

  return {
    storeActions: buildStoreActionAuditNotes(),
    domainBoundaries: buildDomainBoundaryNotes(),
    importScan,
    warnings,
  };
}

export { VERIFY_SCRIPT_KEYS };
