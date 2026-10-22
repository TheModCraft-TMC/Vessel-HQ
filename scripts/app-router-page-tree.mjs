import fs from 'node:fs';
import path from 'node:path';

// Render only page.tsx files and their ancestors. No PATH-resolved executable
// or shell is needed, and symlink directories are not followed.
export function renderPageTree(directory, label = 'web-src/app') {
  const children = collect(directory);
  const lines = [label];
  render(children, '');
  return lines.join('\n');

  function render(entries, prefix) {
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${entry.name}`);
      render(entry.children, `${prefix}${last ? '    ' : '│   '}`);
    });
  }
}

function collect(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((entry) => {
      if (entry.isDirectory()) {
        const children = collect(path.join(directory, entry.name));
        return children.length ? [{ name: entry.name, children }] : [];
      }
      return entry.isFile() && entry.name === 'page.tsx' ? [{ name: entry.name, children: [] }] : [];
    });
}
