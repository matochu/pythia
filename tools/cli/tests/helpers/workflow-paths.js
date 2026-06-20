import { mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Synthetic feature ids for tmp workspaces — not tied to any real repo workflow. */
export const TEST_FEATURE_ID = 'feat-test';
export const TEST_FEATURE_ID_MIG = 'feat-mig-test';
export const TEST_FEATURE_ID_SYNC = 'feat-sync-test';

/** Minimal `.pythia/manifest.json` + `.pythia/package.json` for path-anchor tests. */
export function seedPythiaProjectRegistration(root) {
  mkdirSync(join(root, '.pythia'), { recursive: true });
  writeFileSync(
    join(root, '.pythia/manifest.json'),
    JSON.stringify({
      frameworkVersion: '0.0.0',
      migratedVersion: '0.0.0',
      surfaces: [],
      installedSkills: [],
      generated: {},
    }),
    'utf8',
  );
  writeFileSync(
    join(root, '.pythia/package.json'),
    JSON.stringify({ name: 'test-pythia', version: '0.0.0', type: 'module' }),
    'utf8',
  );
}

/** `.pythia/workflows/features/<featureId>/` under a tmp workspace root. */
export function featureWorkflowDir(root, featureId = TEST_FEATURE_ID) {
  return join(root, '.pythia', 'workflows', 'features', featureId);
}

/** Install a plan fixture under the standard feature layout; returns absolute plan path. */
export function installWorkflowPlan(root, { featureId = TEST_FEATURE_ID, planName, fixturePath }) {
  const plansDir = join(featureWorkflowDir(root, featureId), 'plans');
  mkdirSync(plansDir, { recursive: true });
  const planPath = join(plansDir, planName);
  cpSync(fixturePath, planPath);
  return planPath;
}

/** Install a context file under `<feature>/contexts/`. */
export function installWorkflowContext(root, { featureId = TEST_FEATURE_ID, fileName, content }) {
  const ctxDir = join(featureWorkflowDir(root, featureId), 'contexts');
  mkdirSync(ctxDir, { recursive: true });
  const ctxPath = join(ctxDir, fileName);
  if (content != null) writeFileSync(ctxPath, content, 'utf8');
  return { ctxDir, ctxPath };
}

/** Install a feature doc at `<feature>/<featureId>.md`. */
export function installFeatureDoc(root, { featureId = TEST_FEATURE_ID, content }) {
  const featDir = featureWorkflowDir(root, featureId);
  mkdirSync(featDir, { recursive: true });
  const featPath = join(featDir, `${featureId}.md`);
  if (content != null) writeFileSync(featPath, content, 'utf8');
  return { featDir, featPath };
}
