import { promises as fs } from 'node:fs';
import path from 'node:path';

// This is a compatibility/security guard for native client modules, not a
// JavaScript sandbox. Installed native code remains administrator-trusted.
export async function validateSources(root, entries) {
  const { default: ts } = await import('typescript');
  const allowedBare = new Set([
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'lucide-react',
    '@xyflow/react',
    '@xyflow/react/dist/style.css',
    '@/core/native-extensions/sdk',
  ]);
  function checkImport(specifier, file) {
    if (typeof specifier !== 'string') throw new Error(`Nonliteral module loading forbidden: ${file}`);
    if (allowedBare.has(specifier) || /^@\/ui\/[a-zA-Z0-9_/-]+$/.test(specifier)) return;
    if (!specifier.startsWith('.') || specifier.includes('\\') || specifier.includes('?') || specifier.includes('#'))
      throw new Error(`Unsupported client import ${specifier}: ${file}`);
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    if (!resolved.startsWith('ui/')) throw new Error(`Import escapes extension UI: ${file}`);
    const candidates = [resolved, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}/index.ts`, `${resolved}/index.tsx`];
    if (!candidates.some((name) => entries[name]?.type === 'file')) throw new Error(`Unresolved extension import ${specifier}: ${file}`);
  }
  for (const [file, entry] of Object.entries(entries)) {
    if (entry.type !== 'file' || !/\.(tsx|ts)$/.test(file)) continue;
    const source = ts.createSourceFile(
      file,
      await fs.readFile(path.join(root, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    if (source.parseDiagnostics.length) throw new Error(`Invalid extension TypeScript: ${file}`);
    function visit(node) {
      if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'use server') throw new Error(`Server directives forbidden: ${file}`);
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) checkImport(ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined, file);
      }
      if (ts.isImportEqualsDeclaration(node)) throw new Error(`CommonJS imports forbidden: ${file}`);
      if (ts.isImportTypeNode(node)) checkImport(ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal) ? node.argument.literal.text : undefined, file);
      if (ts.isIdentifier(node) && ['require', 'eval', 'Function'].includes(node.text)) throw new Error(`Dynamic code execution forbidden: ${file}`);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (node.arguments.length !== 1) throw new Error(`Invalid module loading: ${file}`);
        checkImport(ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : undefined, file);
      }
      if (ts.isMetaProperty(node)) throw new Error(`Import metadata forbidden: ${file}`);
      if (ts.isPropertyAccessExpression(node) && ['require', 'eval', 'Function'].includes(node.name.text)) throw new Error(`Dynamic code execution forbidden: ${file}`);
      if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) && ['require', 'eval', 'Function'].includes(node.argumentExpression.text))
        throw new Error(`Dynamic code execution forbidden: ${file}`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
