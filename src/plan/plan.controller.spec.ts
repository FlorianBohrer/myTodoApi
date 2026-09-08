import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

/**
 * Die Reorder-Route teilt sich das Präfix mit PUT /plan/:id. Steht sie an der
 * falschen Stelle, landet ein Reorder-Request stillschweigend in updatePlan
 * mit der id 'reorder' — deshalb geht der Test über die echte Route und nicht
 * über einen direkten Methodenaufruf.
 *
 * Die Mocks liegen als eigenständige jest.fn() daneben, statt als Methoden am
 * Service-Objekt: sonst schlägt unbound-method bei jedem expect() an.
 */
describe('PlanController', () => {
  const reorder = jest.fn<Promise<void>, [string, string[]]>();
  const updatePlan = jest.fn();
  let app: INestApplication;

  beforeEach(async () => {
    reorder.mockReset().mockResolvedValue(undefined);
    updatePlan.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        {
          provide: PlanService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            createPlan: jest.fn(),
            deletePlan: jest.fn(),
            updatePlan,
            reorder,
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    // Der globale ClerkAuthGuard läuft hier nicht mit; CurrentUserId liest
    // request.auth und würde sonst 401 werfen.
    app.use(
      (req: { auth?: { userId: string } }, _res: unknown, next: () => void) => {
        req.auth = { userId: 'user_1' };
        next();
      },
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('routes PUT /plan/reorder to reorder, not to update', async () => {
    const ids = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ];

    await request(app.getHttpServer() as never)
      .put('/plan/reorder')
      .send({ ids })
      .expect(200);

    expect(reorder).toHaveBeenCalledTimes(1);
    expect(reorder.mock.calls[0][0]).toBe('user_1');
    expect(reorder.mock.calls[0][1]).toEqual(ids);
    expect(updatePlan).not.toHaveBeenCalled();
  });

  it('still routes PUT /plan/:id to update', async () => {
    updatePlan.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      userId: 'user_1',
      title: 'Trip',
      categoryId: null,
      content: [],
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer() as never)
      .put('/plan/33333333-3333-4333-8333-333333333333')
      .send({ title: 'Trip' })
      .expect(200);

    expect(updatePlan).toHaveBeenCalledTimes(1);
    expect(reorder).not.toHaveBeenCalled();
  });
});
