import { Controller, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { initContract } from '@ts-rest/core';
import supertest from 'supertest';
import { z } from 'zod';
import { TsRest } from './ts-rest.decorator';
import { TsRestHandler, tsRestHandler } from './ts-rest-nest-handler';

const contract = initContract().router({
  getMember: {
    method: 'GET',
    path: '/groups/:group?/members/:id',
    responses: {
      200: z.object({ group: z.string().optional(), id: z.string() }),
    },
  },
});

for (const legacy of [false, true]) {
  describe(
    legacy ? 'legacy optional path routing' : 'optional path routing',
    () => {
      it.each(['express', 'fastify'] as const)(
        'preserves optional parameters before static segments with %s',
        async (adapter) => {
          @Controller()
          class TestController {
            @(legacy
              ? TsRest(contract.getMember)
              : TsRestHandler(contract.getMember))
            handler(@Req() request: { params: Record<string, string> }) {
              if (legacy) return { status: 200, body: request.params };
              return tsRestHandler(contract.getMember, async ({ params }) => ({
                status: 200,
                body: params,
              }));
            }
          }

          const moduleRef = await Test.createTestingModule({
            controllers: [TestController],
          }).compile();
          const app =
            adapter === 'fastify'
              ? moduleRef.createNestApplication(new FastifyAdapter())
              : moduleRef.createNestApplication();
          try {
            await app.init();
            if (adapter === 'fastify')
              await app.getHttpAdapter().getInstance().ready();
            await supertest(app.getHttpServer())
              .get('/groups/members/42')
              .expect(200, { id: '42' });
            await supertest(app.getHttpServer())
              .get('/groups/staff/members/42')
              .expect(200, { group: 'staff', id: '42' });
            await supertest(app.getHttpServer())
              .get('/groups/staff/members')
              .expect(404);
          } finally {
            await app.close();
          }
        },
      );
    },
  );
}

describe.each([false, true])(
  'optional route priority (legacy: %s)',
  (legacy) => {
    it.each(['express', 'fastify'] as const)(
      'uses native %s priority when optional paths overlap',
      async (adapter) => {
        const overlappingContract = initContract().router({
          getUser: {
            method: 'GET',
            path: '/:region?/users/:id?',
            responses: {
              200: z.object({
                region: z.string().optional(),
                id: z.string().optional(),
              }),
            },
          },
        });

        @Controller()
        class TestController {
          @(legacy
            ? TsRest(overlappingContract.getUser)
            : TsRestHandler(overlappingContract.getUser))
          handler(@Req() request: { params: Record<string, string> }) {
            if (legacy) return { status: 200, body: request.params };
            return tsRestHandler(
              overlappingContract.getUser,
              async ({ params }) => ({ status: 200, body: params }),
            );
          }
        }

        const moduleRef = await Test.createTestingModule({
          controllers: [TestController],
        }).compile();
        const app =
          adapter === 'fastify'
            ? moduleRef.createNestApplication(new FastifyAdapter())
            : moduleRef.createNestApplication();
        try {
          await app.init();
          if (adapter === 'fastify')
            await app.getHttpAdapter().getInstance().ready();
          // Express follows registration order; Fastify prioritizes static nodes.
          const expected =
            adapter === 'express' ? { region: 'users' } : { id: 'users' };
          await supertest(app.getHttpServer())
            .get('/users/users')
            .expect(200, expected);
        } finally {
          await app.close();
        }
      },
    );
  },
);
