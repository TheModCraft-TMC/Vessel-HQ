import { pathToFileURL } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';

// Preserve `pnpm swagger-cli validate <file>` used by make generate-api without
// the retired swagger-cli / js-yaml 3 / argparse 1 / sprintf-js dependency chain.
export async function validateOpenApi(file) {
  return SwaggerParser.validate(file);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, file, ...rest] = process.argv.slice(2);
  if (command !== 'validate' || !file || rest.length) {
    console.error('Usage: pnpm swagger-cli validate <OpenAPI file>');
    process.exitCode = 1;
  } else {
    try {
      await validateOpenApi(file);
      console.log(`${file} is valid`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
