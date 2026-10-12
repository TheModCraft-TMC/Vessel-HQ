#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = join(repoRoot, 'web-src');
const canonicalRoots = ['core', 'domains', 'providers', 'shared', 'ui'];
const transitionalRoots = ['design-system', 'layouts'];
const architectureRoots = [...canonicalRoots, ...transitionalRoots];
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const importPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g;

const violations = [];
const files = architectureRoots.flatMap((root) => walk(join(appRoot, root)).filter(isSourceFile));

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(importPattern)].map((match) => match[1]);

  for (const specifier of imports) {
    checkImport(file, specifier);
  }
}

checkDeprecatedFeatureRoot();
checkDomainPublicApis();
checkProviderPublicApis();

if (violations.length > 0) {
  console.error('Frontend architecture boundary violations:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`Frontend architecture boundaries: ${files.length} source files checked`);

function checkImport(file, specifier) {
  const sourcePath = toAppPath(file);
  const sourceParts = sourcePath.split('/');
  const sourceLayer = sourceParts[0];
  const targetPath = resolveInternalImport(file, specifier);
  const targetLayer = targetPath?.split('/')[0];
  const sourceDomain = sourceLayer === 'domains' ? sourceParts[1] : undefined;
  const targetDomain = getDomain(targetPath);
  const sourceProvider = getProvider(sourcePath);
  const targetProvider = getProvider(targetPath);

  if (specifier.startsWith('.') && targetPath) {
    if (architectureRoots.includes(targetLayer) && targetLayer !== sourceLayer) {
      report(sourcePath, specifier, 'cross-layer imports must use the @/ alias');
    }
  }

  if (targetLayer === 'features') {
    report(
      sourcePath,
      specifier,
      'web-src/features has been replaced by web-src/domains'
    );
  }

  if (sourceLayer === 'design-system' && targetPath) {
    if (!targetPath.startsWith('design-system/')) {
      report(
        sourcePath,
        specifier,
        'the design system cannot depend on application layers outside itself'
      );
    }
  }

  if (sourceLayer === 'ui' && targetPath) {
    if (!['shared', 'ui'].includes(targetLayer)) {
      report(sourcePath, specifier, 'ui may depend only on ui, shared, and external packages');
    }
  }

  if (targetDomain && targetDomain !== sourceDomain && sourceLayer !== 'ui') {
    const isPublicAlias = specifier === `@/domains/${targetDomain}`;
    const isRouteManifest = sourcePath === 'core/routing/registry/domain-manifests.ts' && specifier === `@/domains/${targetDomain}/route-manifest`;
    if (!isPublicAlias && !isRouteManifest) {
      const targetSection = getDomainSection(targetPath, targetDomain);
      const providerForbiddenSections = ['components', 'hooks', 'queries', 'routes', 'views'];
      const message =
        sourceLayer === 'providers' && providerForbiddenSections.includes(targetSection)
          ? 'providers cannot depend on domain views, components, hooks, queries, or routes'
          : 'domains may be consumed only through their public index';
      report(sourcePath, specifier, message);
    }
  }

  if (targetProvider && targetProvider.key !== sourceProvider?.key && sourceLayer !== 'ui') {
    const isPublicAlias = specifier === `@/providers/${targetProvider.key}`;
    if (!isPublicAlias) {
      const message =
        sourceLayer === 'domains' ? 'domains may consume a provider only through its public index' : 'provider modules may be consumed only through the provider public index';
      report(sourcePath, specifier, message);
    }
  }

  if (sourceLayer === 'providers' && targetPath) {
    if (!['domains', 'providers', 'shared'].includes(targetLayer)) {
      report(sourcePath, specifier, 'providers may depend only on shared contracts, domain public APIs, provider internals, and external packages');
    }
  }

  if (sourceLayer !== 'domains') {
    return;
  }

  if (targetLayer && !architectureRoots.includes(targetLayer)) {
    report(
      sourcePath,
      specifier,
      'domains cannot depend on source outside the canonical architecture roots'
    );
  }

  const sourceSection = sourceParts[2];
  const targetSection = getDomainSection(targetPath, sourceDomain);

  if (sourceSection === 'components' && ['hooks', 'queries', 'services', 'views'].includes(targetSection)) {
    report(sourcePath, specifier, 'presentation components must receive behavior and remote state through props');
  }

  if (sourceSection === 'services') {
    if (specifier === 'react' || specifier.startsWith('react/') || specifier.startsWith('@tanstack/react-query') || specifier === 'zustand') {
      report(sourcePath, specifier, 'services are framework-independent API and domain modules');
    }

    if (['components', 'hooks', 'queries', 'views'].includes(targetSection)) {
      report(sourcePath, specifier, 'services cannot depend on React-facing domain sections');
    }
  }

  if (sourceSection === 'models' && ['components', 'hooks', 'queries', 'services', 'views'].includes(targetSection)) {
    report(sourcePath, specifier, 'models must remain dependency-light');
  }
}

function checkDeprecatedFeatureRoot() {
  const featuresRoot = join(appRoot, 'features');
  if (existsSync(featuresRoot)) {
    violations.push(
      'features: web-src/features has been replaced by web-src/domains'
    );
  }
}

function checkDomainPublicApis() {
  const domainsRoot = join(appRoot, 'domains');
  if (!existsSync(domainsRoot)) {
    return;
  }

  for (const entry of readdirSync(domainsRoot)) {
    const domainPath = join(domainsRoot, entry);
    if (!statSync(domainPath).isDirectory()) {
      continue;
    }

    if (!hasPublicApi(domainPath)) {
      violations.push(`domains/${entry}: each domain requires an index.ts public API`);
    }
  }
}

function checkProviderPublicApis() {
  const providersRoot = join(appRoot, 'providers');
  if (!existsSync(providersRoot)) {
    return;
  }

  for (const providerClass of readdirSync(providersRoot)) {
    const providerClassPath = join(providersRoot, providerClass);
    if (!statSync(providerClassPath).isDirectory()) {
      continue;
    }

    for (const provider of readdirSync(providerClassPath)) {
      const providerPath = join(providerClassPath, provider);
      if (!statSync(providerPath).isDirectory()) {
        continue;
      }

      if (!hasPublicApi(providerPath)) {
        violations.push(`providers/${providerClass}/${provider}: each provider requires an index.ts public API`);
      }
    }
  }
}

function resolveInternalImport(file, specifier) {
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

function getDomain(targetPath) {
  const match = targetPath?.match(/^domains\/([^/]+)(?:\/|$)/);
  return match?.[1];
}

function getDomainSection(targetPath, domain) {
  if (!domain) {
    return undefined;
  }

  const match = targetPath?.match(new RegExp(`^domains/${escapeRegExp(domain)}/([^/]+)(?:/|$)`));
  return stripSourceExtension(match?.[1]);
}

function getProvider(targetPath) {
  const match = targetPath?.match(/^providers\/([^/]+)\/([^/]+)(?:\/|$)/);
  if (!match) {
    return undefined;
  }

  return {
    className: match[1],
    name: match[2],
    key: `${match[1]}/${match[2]}`,
  };
}

function hasPublicApi(directory) {
  return existsSync(join(directory, 'index.ts')) || existsSync(join(directory, 'index.tsx'));
}

function stripSourceExtension(value) {
  return value?.replace(/\.(?:js|jsx|ts|tsx)$/, '');
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
