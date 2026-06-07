// @ts-nocheck — build utility; imports expo-router internal modules without public types.
/**
 * Regenerate Expo Router typed routes (.expo/types/router.d.ts).
 * Çalıştır: npx tsx scripts/regenerate-expo-router-types.ts
 *
 * EXPO_ROUTER_APP_ROOT must point at src/app — otherwise Metro context scans the
 * whole repo and produces corrupt paths like /../core/... in router.d.ts.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { EXPO_ROUTER_CTX_IGNORE } from 'expo-router/_ctx-shared';
import { getTypedRoutesDeclarationFile } from 'expo-router/build/typed-routes/generate';
import requireContext from 'expo-router/build/testing-library/require-context-ponyfill';

const REPO_ROOT = resolve(__dirname, '..');
const APP_ROOT = resolve(REPO_ROOT, 'src', 'app');
const OUTPUT_DIR = resolve(REPO_ROOT, '.expo', 'types');
const OUTPUT_FILE = join(OUTPUT_DIR, 'router.d.ts');

function main(): void {
  if (!existsSync(APP_ROOT)) {
    console.error(`Expo Router app root missing: ${APP_ROOT}`);
    process.exit(1);
  }

  process.env.EXPO_ROUTER_APP_ROOT = APP_ROOT;

  const ctx = requireContext(APP_ROOT, true, EXPO_ROUTER_CTX_IGNORE);
  const declaration = getTypedRoutesDeclarationFile(ctx);

  if (!declaration || declaration.length < 100) {
    console.error('Expo Router typed routes generation returned empty output.');
    process.exit(1);
  }

  if (declaration.includes('/../')) {
    console.error(
      'Generated router.d.ts contains parent-relative paths (/../) — app root may be wrong.',
    );
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, declaration, 'utf8');

  const routeCount = (declaration.match(/pathname:/g) ?? []).length;
  // eslint-disable-next-line no-console
  console.log(
    `Regenerated ${OUTPUT_FILE} from ${APP_ROOT} (${routeCount} pathname entries)`,
  );
}

main();
