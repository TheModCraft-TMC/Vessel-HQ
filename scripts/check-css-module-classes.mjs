#!/usr/bin/env node

// Next.js exports CSS Module class names exactly as written. The former webpack
// build exported camelCase aliases, so `styles.copyButton` for `.copy-button`
// silently became `undefined` after the migration. Vitest returns a proxy for
// CSS Modules, so unit tests cannot catch this; check the class names instead.
//
// This is a source guard for statically named reads (`styles.foo`,
// `styles['foo']`) on default or namespace imports. Dynamic keys,
// destructuring, re-exports and escaped identifiers are not checked.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import postcss from 'postcss';
import ts from 'typescript';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = join(repoRoot, 'web-src');
const sourceExtensions = /\.(?:js|jsx|ts|tsx)$/;
const cssModulePattern = /\.module\.css$/;
const aliases = readPathAliases(join(appRoot, 'tsconfig.json'));

const violations = [];
const files = walk(appRoot).filter((file) => sourceExtensions.test(file));
let importCount = 0;

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('.module.css')) {
    continue;
  }

  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  // Bind identifiers so a local variable or parameter named `styles` is not
  // mistaken for the imported CSS object.
  const checker = createChecker(file, sourceFile);
  const cssImports = new Map();

  for (const statement of sourceFile.statements) {
    const binding = readCssModuleImport(statement);
    if (!binding) {
      continue;
    }

    importCount += 1;
    const specifier = statement.moduleSpecifier.text;
    const cssPath = resolveCssModule(file, specifier);
    if (!cssPath) {
      violations.push(`${location(sourceFile, statement)} imports ${specifier}, which does not resolve to a file`);
      continue;
    }

    cssImports.set(checker.getSymbolAtLocation(binding), {
      cssPath,
      classes: readClassNames(cssPath),
    });
  }

  if (cssImports.size === 0) {
    continue;
  }

  const visit = (node) => {
    const access = readStylesAccess(node);
    const symbol = access && checker.getSymbolAtLocation(access.object);
    if (symbol && cssImports.has(symbol)) {
      const { cssPath, classes } = cssImports.get(symbol);
      if (!classes.has(access.className)) {
        violations.push(`${location(sourceFile, node)} reads ${access.object.text}.${access.className}, but ${relative(repoRoot, cssPath)} has no .${access.className} class`);
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

function createChecker(file, sourceFile) {
  const options = { noResolve: true, noLib: true };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === file ? sourceFile : undefined);
  return ts.createProgram([file], options, host).getTypeChecker();
}

function readCssModuleImport(statement) {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !cssModulePattern.test(statement.moduleSpecifier.text)) {
    return null;
  }

  const clause = statement.importClause;
  if (clause?.name) {
    return clause.name;
  }
  if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
    return clause.namedBindings.name;
  }
  return null;
}

function readStylesAccess(node) {
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
    return { object: node.expression, className: node.name.text };
  }
  if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && ts.isStringLiteralLike(node.argumentExpression)) {
    return { object: node.expression, className: node.argumentExpression.text };
  }
  return null;
}

function resolveCssModule(file, specifier) {
  const candidates = specifier.startsWith('.')
    ? [resolve(dirname(file), specifier)]
    : aliases.flatMap(({ prefix, targets }) => (specifier.startsWith(prefix) ? targets.map((target) => join(target, specifier.slice(prefix.length))) : []));
  return candidates.find((candidate) => existsSync(candidate));
}

function readPathAliases(tsconfigPath) {
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (error) {
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  }
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, dirname(tsconfigPath));
  const baseDirectory = options.pathsBasePath ?? options.baseUrl ?? dirname(tsconfigPath);
  // Only `prefix/*` aliases can point at a CSS Module; longest prefix first.
  return Object.entries(options.paths ?? {})
    .filter(([pattern]) => pattern.endsWith('/*'))
    .map(([pattern, targets]) => ({
      prefix: pattern.slice(0, -1),
      targets: targets.filter((target) => target.endsWith('/*')).map((target) => resolve(baseDirectory, target.slice(0, -1))),
    }))
    .sort((left, right) => right.prefix.length - left.prefix.length);
}

function readClassNames(cssPath) {
  // Only selectors declare classes; declaration values such as
  // `--example: .missing` must not hide a typo.
  const classes = new Set();
  postcss.parse(readFileSync(cssPath, 'utf8'), { from: cssPath }).walkRules((rule) => {
    const selector = rule.selector.replace(/:global\([^)]*\)/g, '').replace(/'[^']*'|"[^"]*"/g, '');
    for (const match of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
      classes.add(match[1]);
    }
  });
  return classes;
}

function location(sourceFile, node) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${relative(repoRoot, sourceFile.fileName)}:${line + 1}`;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'generated-api', '.next'].includes(entry.name)) {
      return [];
    }
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
