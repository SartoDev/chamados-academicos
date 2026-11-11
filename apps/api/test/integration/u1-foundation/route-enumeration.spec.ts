import { RequestMethod, type Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { API_PREFIX } from '../../../src/app.setup.js';
import type { Role } from '../../../src/auth/actor.js';
import { IS_PUBLIC_KEY } from '../../../src/auth/decorators/public.decorator.js';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator.js';
import { createTestApp, type TestApp } from './support/test-app.js';

const NEST_NOT_FOUND_FALLBACK = '_ALL *path';

interface DiscoveredRoute {
  key: string;
  isPublic: boolean;
  roles: readonly Role[];
}

function joinPath(...segments: Array<string | string[] | undefined>): string {
  const parts = segments
    .flatMap((segment) => (Array.isArray(segment) ? segment : [segment]))
    .map((segment) => (segment ?? '').replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment.length > 0);
  return `/${parts.join('/')}`;
}

/** Every handler registered by the NestJS controllers, with its access markers. */
function discoverRoutes(testApp: TestApp): DiscoveredRoute[] {
  const reflector = testApp.app.get(Reflector);
  const routes: DiscoveredRoute[] = [];
  for (const moduleRef of testApp.app.get(ModulesContainer).values()) {
    for (const wrapper of moduleRef.controllers.values()) {
      const controller = wrapper.metatype as Type<unknown> | null;
      if (!controller) {
        continue;
      }
      const prototype = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(prototype)) {
        const handler = prototype[name];
        if (name === 'constructor' || typeof handler !== 'function') {
          continue;
        }
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        if (method === undefined) {
          continue;
        }
        const path = joinPath(
          API_PREFIX,
          Reflect.getMetadata(PATH_METADATA, controller) as string,
          Reflect.getMetadata(PATH_METADATA, handler) as string,
        );
        const targets = [handler as () => unknown, controller];
        routes.push({
          key: `${RequestMethod[method]} ${path}`,
          isPublic:
            reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, targets) === true,
          roles: reflector.getAllAndOverride<readonly Role[] | undefined>(ROLES_KEY, targets) ?? [],
        });
      }
    }
  }
  return routes;
}

interface RouterLayer {
  route?: { path: string; methods: Record<string, boolean> };
  handle?: { stack?: RouterLayer[] };
}

/** Every route actually registered in Express, to prove no route escapes the discovery. */
function expressRoutes(testApp: TestApp): string[] {
  const instance = testApp.app.getHttpAdapter().getInstance() as {
    router: { stack: RouterLayer[] };
  };
  const keys: string[] = [];
  const walk = (stack: RouterLayer[]) => {
    for (const layer of stack) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) {
          keys.push(`${method.toUpperCase()} ${layer.route.path}`);
        }
      } else if (layer.handle?.stack) {
        walk(layer.handle.stack);
      }
    }
  };
  walk(instance.router.stack);
  return keys;
}

describe('route enumeration (BR2.4, AC5.1.4, AC4.1.8)', () => {
  let testApp: TestApp;
  let routes: DiscoveredRoute[];

  beforeAll(async () => {
    testApp = await createTestApp();
    routes = discoverRoutes(testApp);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('discovers exactly the routes registered in the HTTP server', () => {
    const registered = expressRoutes(testApp);
    // NestJS registers one catch-all under the global prefix to answer unknown routes with 404;
    // it is framework plumbing, not an application route, and it never reaches a handler.
    const applicationRoutes = registered.filter((key) => key !== NEST_NOT_FOUND_FALLBACK);

    expect(registered.filter((key) => key === NEST_NOT_FOUND_FALLBACK)).toHaveLength(1);
    expect(routes.length).toBeGreaterThan(0);
    expect(new Set(applicationRoutes)).toEqual(new Set(routes.map((route) => route.key)));
  });

  it('has login and logout as the only public routes', () => {
    const publicRoutes = routes.filter((route) => route.isPublic).map((route) => route.key);

    expect(publicRoutes.sort()).toEqual(['POST /api/v1/auth/login', 'POST /api/v1/auth/logout']);
  });

  it('declares a non-empty role list on every non-public route', () => {
    const unmarked = routes.filter((route) => !route.isPublic && route.roles.length === 0);

    expect(unmarked.map((route) => route.key)).toEqual([]);
  });

  it('offers no public sign-up or password recovery route', () => {
    const selfService = routes.filter(
      (route) =>
        route.isPublic &&
        /(register|sign-?up|forgot|recover|reset|password|users)/i.test(route.key),
    );

    expect(selfService).toEqual([]);
  });
});
