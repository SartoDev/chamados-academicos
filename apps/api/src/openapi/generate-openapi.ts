import 'reflect-metadata';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module.js';
import { API_PREFIX } from '../app.setup.js';
import { SESSION_COOKIE_NAME } from '../auth/session-cookie.js';
import { ErrorEnvelopeDto, FieldErrorDto } from '../common/http/error-envelope.dto.js';

/**
 * Generates apps/api/openapi.json from the NestJS decorators (source of truth of the HTTP
 * API after the code exists). With --check it only compares and fails when the committed file
 * is outdated. Preview mode builds the module graph without instantiating providers, so no
 * configuration or database is needed.
 */
const OUTPUT_FILE = fileURLToPath(new URL('../../openapi.json', import.meta.url));

async function buildDocument(): Promise<string> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });
  app.setGlobalPrefix(API_PREFIX);
  const config = new DocumentBuilder()
    .setTitle('Sistema de Chamados Acadêmicos API')
    .setDescription('API-U1 Foundation: authentication, users and catalogs.')
    .setVersion('1.0.0')
    .addCookieAuth(SESSION_COOKIE_NAME)
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorEnvelopeDto, FieldErrorDto],
  });
  await app.close();
  return `${JSON.stringify(document, null, 2)}\n`;
}

async function main(): Promise<void> {
  const generated = await buildDocument();
  if (process.argv.includes('--check')) {
    const current = existsSync(OUTPUT_FILE) ? readFileSync(OUTPUT_FILE, 'utf8') : '';
    if (current !== generated) {
      console.error(
        'openapi.json is outdated. Run "npm run openapi:generate" and commit the file.',
      );
      process.exitCode = 1;
      return;
    }
    console.log('openapi.json is up to date.');
    return;
  }
  writeFileSync(OUTPUT_FILE, generated, 'utf8');
  console.log(`OpenAPI document written to ${OUTPUT_FILE}`);
}

main().catch((error: unknown) => {
  console.error('OpenAPI generation failed', error);
  process.exitCode = 1;
});
