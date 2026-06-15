import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BUILD_PREP_APP_CONFIG_PATH,
  BUILD_PREP_EAS_CONFIG_PATH,
  BUILD_PREP_ENV_EXAMPLE_PATH,
  BUILD_PREP_EXPECTED_SAVE_VERSION,
  BUILD_PREP_FOUNDATION_DOC,
  BUILD_PREP_ICON_PATHS,
  BUILD_PREP_PRIVACY_CHECKLIST,
  BUILD_PREP_REQUIRED_EAS_PROFILES,
  BUILD_PREP_SAVE_VERSION_CONFUSION_PATTERNS,
  BUILD_PREP_SECRET_PATTERNS,
  BUILD_PREP_SAFE_PLACEHOLDER_MARKERS,
  BUILD_PREP_STORE_METADATA_CHECKLIST,
  BUILD_PREP_VERSIONING_POLICY_SECTION,
} from './buildPrepConstants';

export type BuildPrepFindingSeverity = 'pass' | 'warn' | 'fail';

export type BuildPrepFinding = {
  id: string;
  severity: BuildPrepFindingSeverity;
  message: string;
};

export type BuildPrepAuditResult = {
  findings: BuildPrepFinding[];
  passCount: number;
  warnCount: number;
  failCount: number;
  health: 'pass' | 'warn' | 'fail';
};

const REPO_ROOT = join(__dirname, '..', '..', '..');

function repoPath(rel: string): string {
  return join(REPO_ROOT, rel);
}

function readRepo(rel: string): string {
  const full = repoPath(rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function add(
  findings: BuildPrepFinding[],
  id: string,
  severity: BuildPrepFindingSeverity,
  message: string,
): void {
  findings.push({ id, severity, message });
}

function parseJsonSafe<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function looksLikeSecret(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  const lower = trimmed.toLowerCase();
  if (BUILD_PREP_SAFE_PLACEHOLDER_MARKERS.some((m) => lower.includes(m.toLowerCase()))) {
    return false;
  }
  return BUILD_PREP_SECRET_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function scanForSecrets(content: string, label: string): BuildPrepFinding[] {
  const findings: BuildPrepFinding[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/=\s*['"]?([^'"\n#]+)/);
    if (!match) continue;
    const value = match[1]?.trim() ?? '';
    if (looksLikeSecret(value)) {
      findings.push({
        id: `secret_${label}`,
        severity: 'fail',
        message: `Secret-looking value in ${label}: ${line.trim().slice(0, 80)}`,
      });
      break;
    }
  }
  return findings;
}

type ExpoConfig = {
  expo?: {
    name?: string;
    slug?: string;
    version?: string;
    icon?: string;
    ios?: { bundleIdentifier?: string; buildNumber?: string; supportsTablet?: boolean };
    android?: { package?: string; versionCode?: number; adaptiveIcon?: { foregroundImage?: string } };
    plugins?: unknown[];
    extra?: { eas?: { projectId?: string } };
  };
};

type EasConfig = {
  build?: Record<string, Record<string, unknown>>;
};

export function runBuildPrepAudit(): BuildPrepAuditResult {
  const findings: BuildPrepFinding[] = [];

  const appConfigExists = existsSync(repoPath(BUILD_PREP_APP_CONFIG_PATH));
  add(
    findings,
    'app_config_exists',
    appConfigExists ? 'pass' : 'fail',
    appConfigExists ? 'app.json present.' : 'app.json missing.',
  );

  const easExists = existsSync(repoPath(BUILD_PREP_EAS_CONFIG_PATH));
  add(
    findings,
    'eas_config_exists',
    easExists ? 'pass' : 'warn',
    easExists ? 'eas.json present.' : 'eas.json missing — run eas init.',
  );

  const appRaw = readRepo(BUILD_PREP_APP_CONFIG_PATH);
  const appConfig = parseJsonSafe<ExpoConfig>(appRaw);
  add(
    findings,
    'app_config_parse',
    appConfig ? 'pass' : 'fail',
    appConfig ? 'app.json parses safely.' : 'app.json JSON parse failed.',
  );

  const easRaw = readRepo(BUILD_PREP_EAS_CONFIG_PATH);
  const easConfig = parseJsonSafe<EasConfig>(easRaw);
  add(
    findings,
    'eas_config_parse',
    easConfig ? 'pass' : easExists ? 'fail' : 'warn',
    easConfig
      ? 'eas.json parses safely.'
      : easExists
        ? 'eas.json JSON parse failed.'
        : 'eas.json not present.',
  );

  const expo = appConfig?.expo;
  const bundleId = expo?.ios?.bundleIdentifier;
  const androidPackage = expo?.android?.package;
  add(
    findings,
    'ios_bundle_id',
    bundleId ? 'pass' : 'warn',
    bundleId ? `iOS bundleIdentifier: ${bundleId}` : 'iOS bundleIdentifier missing.',
  );
  add(
    findings,
    'android_package',
    androidPackage ? 'pass' : 'warn',
    androidPackage
      ? `Android package: ${androidPackage}`
      : 'Android package missing.',
  );

  const appVersion = expo?.version;
  const iosBuild = expo?.ios?.buildNumber;
  const androidVersionCode = expo?.android?.versionCode;
  add(
    findings,
    'app_version',
    appVersion ? 'pass' : 'warn',
    appVersion ? `App version (semver): ${appVersion}` : 'expo.version missing.',
  );
  add(
    findings,
    'ios_build_number',
    iosBuild ? 'pass' : 'warn',
    iosBuild ? `iOS buildNumber: ${iosBuild}` : 'ios.buildNumber missing.',
  );
  add(
    findings,
    'android_version_code',
    typeof androidVersionCode === 'number' ? 'pass' : 'warn',
    typeof androidVersionCode === 'number'
      ? `Android versionCode: ${androidVersionCode}`
      : 'android.versionCode missing.',
  );

  const iconPath = expo?.icon ?? './assets/images/icon.png';
  const iconExists = existsSync(repoPath(iconPath.replace(/^\.\//, '')));
  add(
    findings,
    'app_icon',
    iconExists ? 'pass' : 'warn',
    iconExists ? `App icon exists: ${iconPath}` : `App icon missing: ${iconPath}`,
  );

  for (const rel of BUILD_PREP_ICON_PATHS) {
    if (!existsSync(repoPath(rel))) {
      add(findings, `asset_${rel}`, 'warn', `Asset missing: ${rel}`);
    }
  }

  const splashConfigured =
    appRaw.includes('expo-splash-screen') || appRaw.includes('splash');
  add(
    findings,
    'splash_config',
    splashConfigured ? 'pass' : 'warn',
    splashConfigured
      ? 'Splash screen plugin/config present.'
      : 'Splash screen not configured.',
  );

  const envExampleExists = existsSync(repoPath(BUILD_PREP_ENV_EXAMPLE_PATH));
  add(
    findings,
    'env_example',
    envExampleExists ? 'pass' : 'warn',
    envExampleExists
      ? '.env.example present.'
      : '.env.example missing — env policy in docs only.',
  );

  const storeChecklistExists = existsSync(repoPath(BUILD_PREP_STORE_METADATA_CHECKLIST));
  add(
    findings,
    'store_metadata_checklist',
    storeChecklistExists ? 'pass' : 'warn',
    storeChecklistExists
      ? `${BUILD_PREP_STORE_METADATA_CHECKLIST} present.`
      : 'Store metadata checklist missing.',
  );

  const privacyChecklistExists = existsSync(repoPath(BUILD_PREP_PRIVACY_CHECKLIST));
  add(
    findings,
    'privacy_checklist',
    privacyChecklistExists ? 'pass' : 'warn',
    privacyChecklistExists
      ? `${BUILD_PREP_PRIVACY_CHECKLIST} present.`
      : 'Privacy/data safety checklist missing.',
  );

  const foundationDoc = readRepo(BUILD_PREP_FOUNDATION_DOC);
  const saveVersionDocOk =
    foundationDoc.includes(BUILD_PREP_VERSIONING_POLICY_SECTION) &&
    foundationDoc.includes('SAVE_VERSION') &&
    foundationDoc.includes(String(BUILD_PREP_EXPECTED_SAVE_VERSION));
  add(
    findings,
    'save_version_distinction',
    saveVersionDocOk ? 'pass' : 'fail',
    saveVersionDocOk
      ? 'SAVE_VERSION vs app version documented in foundation doc.'
      : 'SAVE_VERSION vs app version distinction not documented correctly.',
  );

  for (const pattern of BUILD_PREP_SAVE_VERSION_CONFUSION_PATTERNS) {
    if (pattern.test(foundationDoc)) {
      add(
        findings,
        'save_version_confusion',
        'fail',
        `Foundation doc equates SAVE_VERSION with app version (${pattern}).`,
      );
    }
  }

  if (easConfig?.build) {
    for (const profile of BUILD_PREP_REQUIRED_EAS_PROFILES) {
      const hasProfile = Boolean(easConfig.build[profile]);
      add(
        findings,
        `eas_profile_${profile}`,
        hasProfile ? 'pass' : 'warn',
        hasProfile ? `EAS profile "${profile}" present.` : `EAS profile "${profile}" missing.`,
      );
    }
  }

  const projectId = expo?.extra?.eas?.projectId;
  add(
    findings,
    'eas_project_id',
    projectId ? 'pass' : 'warn',
    projectId ? 'extra.eas.projectId configured.' : 'extra.eas.projectId missing — run eas init.',
  );

  if (typeof expo?.ios?.supportsTablet === 'boolean') {
    add(
      findings,
      'tablet_policy',
      'pass',
      `iOS supportsTablet: ${expo.ios.supportsTablet} (documented in foundation doc).`,
    );
  } else {
    add(findings, 'tablet_policy', 'warn', 'ios.supportsTablet not set — tablet policy undocumented.');
  }

  findings.push(...scanForSecrets(appRaw, 'app.json'));
  if (envExampleExists) {
    findings.push(...scanForSecrets(readRepo(BUILD_PREP_ENV_EXAMPLE_PATH), '.env.example'));
  }

  const passCount = findings.filter((f) => f.severity === 'pass').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  const failCount = findings.filter((f) => f.severity === 'fail').length;
  const health: BuildPrepAuditResult['health'] =
    failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

  return { findings, passCount, warnCount, failCount, health };
}

export function buildBuildPrepConsoleSummary(result: BuildPrepAuditResult): string {
  const lines = ['Build prep audit:', ''];
  for (const finding of result.findings) {
    const tag = finding.severity.toUpperCase();
    lines.push(`${tag} ${finding.message}`);
  }
  lines.push('');
  lines.push(
    `Summary: ${result.passCount} PASS, ${result.warnCount} WARN, ${result.failCount} FAIL | Health: ${result.health.toUpperCase()}`,
  );
  return lines.join('\n');
}
