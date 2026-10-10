#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, 'web-src/app');
const REPORT_PATH = path.join(ROOT, 'reports/sonar/app-router-compliance.json');
const ENGINE_ID = 'vessel-app-router';

const rules = [
  {
    id: 'APPROUTER001',
    name: 'Route pages must not use console bridge modules',
    description: 'App Router pages must own their route composition instead of importing transitional @console/console/pages or @console/console/platform bridge modules.',
    cleanCodeAttribute: 'MODULAR',
    type: 'CODE_SMELL',
    severity: 'CRITICAL',
    impacts: [{ softwareQuality: 'MAINTAINABILITY', severity: 'HIGH' }],
  },
  {
    id: 'APPROUTER002',
    name: 'Route pages must not be forwarding shims',
    description: 'A page that only renders one imported component hides the real route implementation outside the App Router tree. Move the route composition into page.tsx.',
    cleanCodeAttribute: 'FOCUSED',
    type: 'CODE_SMELL',
    severity: 'MAJOR',
    impacts: [{ softwareQuality: 'MAINTAINABILITY', severity: 'MEDIUM' }],
  },
  {
    id: 'APPROUTER003',
    name: 'Layouts must be shared route boundaries',
    description:
      'A layout that wraps only one page and only supplies a page header is a leaf wrapper, not shared App Router infrastructure. Promote it to a shared parent or compose the header in the page.',
    cleanCodeAttribute: 'MODULAR',
    type: 'CODE_SMELL',
    severity: 'MAJOR',
    impacts: [{ softwareQuality: 'MAINTAINABILITY', severity: 'MEDIUM' }],
  },
  {
    id: 'APPROUTER004',
    name: 'Repeated collection derivation must be memoized',
    description: 'Sorting or filtering collections directly while rendering JSX repeats work on every render. Derive stable collections with useMemo before rendering.',
    cleanCodeAttribute: 'EFFICIENT',
    type: 'CODE_SMELL',
    severity: 'MAJOR',
    impacts: [{ softwareQuality: 'MAINTAINABILITY', severity: 'MEDIUM' }],
  },
].map((rule) => ({ ...rule, engineId: ENGINE_ID }));

const sourceFiles = walk(APP_ROOT).filter((file) => /\.(?:ts|tsx)$/.test(file));
const pageFiles = sourceFiles.filter((file) => path.basename(file) === 'page.tsx');
const issues = [];

for (const file of pageFiles) {
  inspectPage(file);
}

for (const file of sourceFiles.filter((candidate) => path.basename(candidate) === 'layout.tsx')) {
  inspectLayout(file);
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify({ rules, issues }, null, 2)}\n`);

if (issues.length) {
  const totals = new Map();
  for (const issue of issues) {
    totals.set(issue.ruleId, (totals.get(issue.ruleId) || 0) + 1);
    const location = issue.primaryLocation;
    console.error(`${location.filePath}:${location.textRange.startLine} ${issue.ruleId} ${location.message}`);
  }
  console.error(`App Router compliance: ${issues.length} violation(s) (${[...totals].map(([ruleId, count]) => `${ruleId}=${count}`).join(', ')})`);
  process.exitCode = 1;
} else {
  console.log(`App Router compliance: ${pageFiles.length} pages checked`);
}

function inspectPage(file) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const importedNames = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const moduleName = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (clause?.name) importedNames.set(clause.name.text, moduleName);
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      clause.namedBindings.elements.forEach((element) => importedNames.set(element.name.text, moduleName));
    }

    if (/^@console\/console\/(?:pages|platform)(?:\/|$)/.test(moduleName)) {
      addIssue('APPROUTER001', file, sourceFile, statement, `Move route composition out of transitional bridge "${moduleName}" and into this App Router route.`);
    }
  }

  const defaultFunction = sourceFile.statements.find(
    (statement) =>
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isVariableStatement(statement)) &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
  );

  if (defaultFunction && ts.isFunctionDeclaration(defaultFunction)) {
    const statements = defaultFunction.body?.statements || [];
    if (statements.length === 1 && ts.isReturnStatement(statements[0])) {
      const tagName = getReturnedJsxTag(statements[0].expression);
      const importedFrom = tagName ? importedNames.get(tagName) : undefined;
      if (tagName && importedFrom && !importedFrom.startsWith('.')) {
        addIssue('APPROUTER002', file, sourceFile, statements[0], `This page only forwards to imported component <${tagName}>; move the route implementation into page.tsx.`);
      }
    }
  }

  visit(sourceFile, false);

  function visit(node, insideMemo) {
    const isMemoCall = ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useMemo';
    const nextInsideMemo = insideMemo || isMemoCall;

    if (!nextInsideMemo && ts.isJsxExpression(node) && node.expression && containsCollectionDerivation(node.expression)) {
      addIssue('APPROUTER004', file, sourceFile, node, 'Move collection filtering/sorting out of JSX and memoize the derived value.');
      return;
    }

    ts.forEachChild(node, (child) => visit(child, nextInsideMemo));
  }
}

function inspectLayout(file) {
  const directory = path.dirname(file);
  const descendantPages = pageFiles.filter((page) => page.startsWith(`${directory}${path.sep}`));
  if (descendantPages.length !== 1) return;

  const sourceText = fs.readFileSync(file, 'utf8');
  if (!/(?:PageHeader|\w+Header)/.test(sourceText)) return;

  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  addIssue('APPROUTER003', file, sourceFile, sourceFile, 'This header layout wraps only one page. Promote it to a shared parent boundary or compose the header in the page.');
}

function getReturnedJsxTag(expression) {
  if (!expression) return undefined;
  if (ts.isParenthesizedExpression(expression)) {
    return getReturnedJsxTag(expression.expression);
  }
  if (ts.isJsxSelfClosingElement(expression)) {
    return ts.isIdentifier(expression.tagName) ? expression.tagName.text : undefined;
  }
  if (ts.isJsxElement(expression)) {
    const hasContent = expression.children.some((child) => !(ts.isJsxText(child) && child.text.trim() === ''));
    if (hasContent) return undefined;
    const tagName = expression.openingElement.tagName;
    return ts.isIdentifier(tagName) ? tagName.text : undefined;
  }
  return undefined;
}

function containsCollectionDerivation(node) {
  let found = false;
  const visitNode = (candidate) => {
    if (ts.isCallExpression(candidate) && ts.isPropertyAccessExpression(candidate.expression) && ['filter', 'sort', 'toSorted'].includes(candidate.expression.name.text)) {
      found = true;
      return;
    }
    ts.forEachChild(candidate, visitNode);
  };
  visitNode(node);
  return found;
}

function addIssue(ruleId, file, sourceFile, node, message) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  issues.push({
    ruleId,
    effortMinutes: ruleId === 'APPROUTER002' ? 60 : 30,
    primaryLocation: {
      message,
      filePath: path.relative(ROOT, file),
      textRange: {
        startLine: start.line + 1,
        startColumn: start.character,
        endLine: end.line + 1,
        endColumn: end.character,
      },
    },
  });
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
