/**
 * One-shot bulk updater: align verify scripts to SAVE_VERSION policy helper.
 * Run: npx tsx scripts/_bulk-save-version-27-fix.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const REPO_ROOT = join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.expo']);
const POLICY_IMPORT =
  "import { EXPECTED_SAVE_VERSION_FOR_VERIFY, isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';";

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}

function ensurePolicyImport(content: string, needsExpected: boolean, needsIsCurrent: boolean): string {
  if (!needsExpected && !needsIsCurrent) return content;
  if (content.includes("from '@/core/quality/saveVersionPolicy'")) return content;

  const importLine = needsExpected && needsIsCurrent
    ? POLICY_IMPORT
    : needsExpected
      ? "import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';"
      : "import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';";

  const importMatch = content.match(/^import .+$/m);
  if (importMatch?.index != null) {
    const insertAt = content.indexOf('\n', importMatch.index) + 1;
    let next = content.slice(0, insertAt) + importLine + '\n' + content.slice(insertAt);
    return next;
  }
  return importLine + '\n' + content;
}

function transform(content: string, filePath: string): { content: string; changed: boolean } {
  let next = content;
  const original = content;

  // Module-level EXPECTED_SAVE_VERSION constants
  next = next.replace(
    /const EXPECTED_SAVE_VERSION = 26;\r?\n/g,
    "const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;\n",
  );
  next = next.replace(
    /const EXPECTED_SAVE_VERSION = 27;\r?\n/g,
    "const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;\n",
  );

  // Named module constants
  next = next.replace(
    /export const ([A-Z_]+EXPECTED_SAVE_VERSION) = 26;/g,
    'export const $1 = EXPECTED_SAVE_VERSION_FOR_VERIFY;',
  );

  // Direct comparisons
  next = next.replace(/SAVE_VERSION === 26/g, 'isCurrentSaveVersion(SAVE_VERSION)');
  next = next.replace(/SAVE_VERSION !== 26/g, '!isCurrentSaveVersion(SAVE_VERSION)');
  next = next.replace(/SAVE_VERSION === 27/g, 'isCurrentSaveVersion(SAVE_VERSION)');

  // Persist file literal checks
  next = next.replace(
    /persist\.includes\('export const SAVE_VERSION = 26'\)/g,
    "persist.includes(`export const SAVE_VERSION: number = ${EXPECTED_SAVE_VERSION_FOR_VERIFY}`)",
  );
  next = next.replace(
    /persist\.includes\("export const SAVE_VERSION = 26"\)/g,
    'persist.includes(`export const SAVE_VERSION: number = ${EXPECTED_SAVE_VERSION_FOR_VERIFY}`)',
  );
  next = next.replace(
    /source\.includes\('export const SAVE_VERSION = 26'\)/g,
    "source.includes(`export const SAVE_VERSION: number = ${EXPECTED_SAVE_VERSION_FOR_VERIFY}`)",
  );

  const needsExpected =
    next.includes('EXPECTED_SAVE_VERSION_FOR_VERIFY') ||
    /EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY/.test(next);
  const needsIsCurrent = next.includes('isCurrentSaveVersion(');

  if (needsExpected || needsIsCurrent) {
    next = ensurePolicyImport(next, needsExpected, needsIsCurrent);
  }

  if (next !== original) {
    return { content: next, changed: true };
  }
  return { content, changed: false };
}

const files = walk(join(REPO_ROOT, 'src')).concat(walk(join(REPO_ROOT, 'scripts')));
let changedCount = 0;

for (const file of files) {
  if (file.includes('_bulk-save-version-27-fix')) continue;
  if (file.includes('saveVersionPolicy.ts')) continue;
  const content = readFileSync(file, 'utf8');
  const { content: updated, changed } = transform(content, file);
  if (changed) {
    writeFileSync(file, updated, 'utf8');
    changedCount += 1;
    // eslint-disable-next-line no-console
    console.log('updated', relative(REPO_ROOT, file));
  }
}

// eslint-disable-next-line no-console
console.log(`\nDone. ${changedCount} files updated.`);
