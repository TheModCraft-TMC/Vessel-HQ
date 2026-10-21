#!/usr/bin/env node

// Next.js exports CSS Module class names exactly as written. The former webpack
// build exported camelCase aliases, so `styles.copyButton` for `.copy-button`
// silently became `undefined` after the migration. Vitest returns a proxy for
// CSS Modules, so unit tests cannot catch this; check the class names instead.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = join(repoRoot, 'web-src');
const sourceExtensions = /\.(?:js|jsx|ts|tsx)$/;
const cssModulePattern = /\.module\.css$/;

const violations = [];
const files = walk(appRoot).filter((file) => sourceExtensions.test(file));
let importCount = 0;

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('.module.css')) {
    continue;
  }

  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const cssImports = new Map();

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      cssModulePattern.test(statement.moduleSpecifier.text) &&
      statement.importClause?.name
    ) {
      const cssPath = resolveCssModule(file, statement.moduleSpecifier.text);
      cssImports.set(statement.importClause.name.text, {
        cssPath,
        classes: readClassNames(cssPath),
      });
      importCount += 1;
    }
  }

  if (cssImports.size === 0) {
    continue;
  }

  const visit = (node) => {
    const access = readStylesAccess(node);
    if (access && cssImports.has(access.object)) {
      const { cssPath, classes } = cssImports.get(access.object);
      if (!classes.has(access.className)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        violations.push(
          `${relative(repoRoot, file)}:${line + 1} reads ${access.object}.${access.className}, but ${relative(repoRoot, cssPath)} has no .${access.className} class`
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

if (violations.length > 0) {
  console.error('CSS Module class name violations:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`CSS Module class names: ${importCount} imports checked`);

function readStylesAccess(node) {
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
    return { object: node.expression.text, className: node.name.text };
  }
  if (
    ts.isElementAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    ts.isStringLiteralLike(node.argumentExpression)
  ) {
    return { object: node.expression.text, className: node.argumentExpression.text };
  }
  return null;
}

function resolveCssModule(file, specifier) {
  if (specifier.startsWith('@/')) {
    return join(appRoot, specifier.slice(2));
  }
  return resolve(dirname(file), specifier);
}

function readClassNames(cssPath) {
  const css = readFileSync(cssPath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/:global\([^)]*\)/g, '')
    .replace(/url\([^)]*\)/g, '')
    .replace(/'[^']*'|"[^"]*"/g, '');
  return new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'generated-api') {
      return [];
    }
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
