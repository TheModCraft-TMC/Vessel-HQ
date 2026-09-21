#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = join(repoRoot, 'app');
const architectureRoots = ['core', 'design-system', 'features', 'layouts'];
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const importPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g;
const legacyImportPolicies = loadLegacyImportPolicies();
const legacyImportCounts = new Map();
const legacyImportModulesSeen = new Map();

const violations = [];
const files = architectureRoots.flatMap((root) => walk(join(appRoot, root)).filter(isSourceFile));

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(importPattern)].map((match) => match[1]);

  for (const specifier of imports) {
    checkImport(file, specifier);
  }
}

checkFeaturePublicApis();
checkLegacyImportBudgets();

if (violations.length > 0) {
  console.error('Frontend architecture boundary violations:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`Frontend architecture boundaries: ${files.length} source files checked`);
for (const [feature, count] of legacyImportCounts) {
  console.log(`Transitional ${feature} legacy imports: ${count}`);
}

function checkImport(file, specifier) {
  const sourcePath = toAppPath(file);
  const sourceParts = sourcePath.split('/');
  const sourceLayer = sourceParts[0];
  const targetPath = resolveInternalImport(file, specifier);

  if (specifier.startsWith('.') && targetPath) {
    const targetLayer = targetPath.split('/')[0];
    if (architectureRoots.includes(targetLayer) && targetLayer !== sourceLayer) {
      report(sourcePath, specifier, 'cross-layer imports must use the @/ alias');
    }
  }

  if (sourceLayer === 'design-system' && targetPath) {
    if (!targetPath.startsWith('design-system/')) {
      report(sourcePath, specifier, 'the design system cannot depend on application layers or legacy app code');
    }
  }

  if (sourceLayer === 'core' || sourceLayer === 'layouts') {
    if (isPrivateFeatureImport(specifier)) {
      report(sourcePath, specifier, 'core and layouts may consume a feature only through its public index');
    }
  }

  if (sourceLayer !== 'features') {
    return;
  }

  const sourceFeature = sourceParts[1];
  const targetLayer = targetPath?.split('/')[0];
  if (targetLayer && !['core', 'design-system', 'features', 'layouts'].includes(targetLayer)) {
    const policy = legacyImportPolicies.get(sourceFeature);
    if (policy?.modules.has(specifier)) {
      legacyImportCounts.set(sourceFeature, (legacyImportCounts.get(sourceFeature) ?? 0) + 1);
      const modulesSeen = legacyImportModulesSeen.get(sourceFeature) ?? new Set();
      modulesSeen.add(specifier);
      legacyImportModulesSeen.set(sourceFeature, modulesSeen);
    } else {
      report(sourcePath, specifier, 'migrated features cannot add dependencies on the transitional legacy tree');
    }
  }

  const targetFeature = getFeature(targetPath);
  if (targetFeature && targetFeature !== sourceFeature) {
    const isPublicAlias = specifier === `@/features/${targetFeature}`;
    if (!isPublicAlias) {
      report(sourcePath, specifier, 'features may consume another feature only through its public index');
    }
  }

  const sourceSection = sourceParts[2];
  const targetSection = getFeatureSection(targetPath, sourceFeature);

  if (sourceSection === 'components' && ['hooks', 'pages', 'queries', 'services'].includes(targetSection)) {
    report(sourcePath, specifier, 'presentation components must receive behavior and remote state through props');
  }

  if (sourceSection === 'services') {
    if (specifier === 'react' || specifier.startsWith('react/') || specifier.startsWith('@tanstack/react-query') || specifier === 'zustand') {
      report(sourcePath, specifier, 'services are framework-independent API and domain modules');
    }

    if (['components', 'hooks', 'pages', 'queries'].includes(targetSection)) {
      report(sourcePath, specifier, 'services cannot depend on React-facing feature sections');
    }
  }

  if (sourceSection === 'models' && ['components', 'hooks', 'pages', 'queries', 'services'].includes(targetSection)) {
    report(sourcePath, specifier, 'models must remain dependency-light');
  }
}

function checkFeaturePublicApis() {
  const featuresRoot = join(appRoot, 'features');
  if (!existsSync(featuresRoot)) {
    return;
  }

  for (const entry of readdirSync(featuresRoot)) {
    const featurePath = join(featuresRoot, entry);
    if (!statSync(featurePath).isDirectory()) {
      continue;
    }

    if (!existsSync(join(featurePath, 'index.ts')) && !existsSync(join(featurePath, 'index.tsx'))) {
      violations.push(`features/${entry}: each feature requires an index.ts public API`);
    }
  }
}

function loadLegacyImportPolicies() {
  const policies = new Map();
  const featuresRoot = join(appRoot, 'features');
  if (!existsSync(featuresRoot)) {
    return policies;
  }

  for (const entry of readdirSync(featuresRoot)) {
    const policyPath = join(featuresRoot, entry, 'legacy-imports.json');
    if (!existsSync(policyPath)) {
      continue;
    }

    const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
    policies.set(entry, {
      maxImports: policy.maxImports,
      modules: new Set(policy.modules),
    });
  }

  return policies;
}

function checkLegacyImportBudgets() {
  for (const [feature, policy] of legacyImportPolicies) {
    const actual = legacyImportCounts.get(feature) ?? 0;
    if (actual !== policy.maxImports) {
      violations.push(`features/${feature}: transitional legacy import budget is ${policy.maxImports}, but ${actual} remain; update the budget in the same change`);
    }

    const modulesSeen = legacyImportModulesSeen.get(feature) ?? new Set();
    const unusedModules = [...policy.modules].filter((module) => !modulesSeen.has(module));
    if (unusedModules.length > 0) {
      violations.push(`features/${feature}: remove unused legacy allowlist modules: ${unusedModules.join(', ')}`);
    }
  }
}

function resolveInternalImport(file, specifier) {
  if (specifier.startsWith('@@/')) {
    return `react/components/${specifier.slice(3)}`;
  }

  if (specifier.startsWith('@/')) {
    return specifier.slice(2);
  }

  if (specifier.startsWith('.')) {
    const absoluteTarget = resolve(dirname(file), specifier);
    const appRelative = relative(appRoot, absoluteTarget);
    if (!appRelative.startsWith(`..${sep}`) && appRelative !== '..') {
      return appRelative.split(sep).join('/');
    }
  }

  return undefined;
}

function isPrivateFeatureImport(specifier) {
  return /^@\/features\/[^/]+\/.+/.test(specifier);
}

function getFeature(targetPath) {
  const match = targetPath?.match(/^features\/([^/]+)(?:\/|$)/);
  return match?.[1];
}

function getFeatureSection(targetPath, feature) {
  const match = targetPath?.match(new RegExp(`^features/${escapeRegExp(feature)}/([^/]+)(?:/|$)`));
  return match?.[1];
}

function walk(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function isSourceFile(file) {
  const extension = file.slice(file.lastIndexOf('.'));
  return sourceExtensions.has(extension);
}

function toAppPath(file) {
  return relative(appRoot, file).split(sep).join('/');
}

function report(sourcePath, specifier, message) {
  violations.push(`${sourcePath} imports "${specifier}": ${message}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
