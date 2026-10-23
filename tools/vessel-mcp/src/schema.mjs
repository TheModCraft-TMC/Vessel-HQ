// Quote untrusted remote property names; never interpolate descriptions as code.
export function schemaType(schema, depth = 0) {
  if (!schema || typeof schema !== 'object' || depth > 8 || schema.$ref) return 'unknown';
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(' | ') || 'never';
  const union = schema.anyOf ?? schema.oneOf;
  if (union) return union.map((entry) => `(${schemaType(entry, depth + 1)})`).join(' | ');
  if (Array.isArray(schema.type)) return schema.type.map((type) => schemaType({ ...schema, type }, depth + 1)).join(' | ');
  if (schema.type === 'object' || schema.properties) {
    const fields = Object.entries(schema.properties ?? {}).map(
      ([key, value]) => `${JSON.stringify(key)}${schema.required?.includes(key) ? '' : '?'}: ${schemaType(value, depth + 1)}`
    );
    if (schema.additionalProperties !== false) fields.push('[key: string]: unknown');
    return `{ ${fields.join('; ')} }`;
  }
  if (schema.type === 'array') return `Array<${schemaType(schema.items, depth + 1)}>`;
  return { string: 'string', integer: 'number', number: 'number', boolean: 'boolean', null: 'null' }[schema.type] ?? 'unknown';
}

export function declarations(tools) {
  return `declare const tools: {\n${tools.map((tool) => `  ${JSON.stringify(tool.name)}: (args: ${schemaType(tool.inputSchema)}) => Promise<${schemaType(tool.outputSchema)}>;`).join('\n')}\n};`;
}
