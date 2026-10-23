import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { AiService } from '../ai/ai.service';
import { AiQuotaService } from '../ai/ai-quota.service';
import { MAX_TRANSLATE_CHARS } from './dto/translate.dto';

/**
 * POST /plan/translate: erst prüfen, dann abbuchen, dann übersetzen — und
 * nichts davon, wenn die Anfrage nicht stimmt. Über die echte Route mit der
 * echten ValidationPipe, wie sie main.ts setzt.
 */
describe('POST /plan/translate', () => {
  const translate = jest.fn();
  const consume = jest.fn<Promise<boolean>, [string]>();
  let available = true;
  let app: INestApplication;

  beforeEach(async () => {
    translate.mockReset().mockResolvedValue({ translations: ['Goals'] });
    consume.mockReset().mockResolvedValue(true);
    available = true;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        { provide: PlanService, useValue: {} },
        {
          provide: AiService,
          useValue: {
            get available() {
              return available;
            },
            translate,
            suggestSectionTitle: jest.fn(),
          },
        },
        {
          provide: AiQuotaService,
          useValue: { limit: 100, consume, state: jest.fn() },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
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

  const post = (body: unknown) =>
    request(app.getHttpServer() as never)
      .post('/plan/translate')
      .send(body as object);

  it('translates and books one unit of the daily quota', async () => {
    const res = await post({
      target: 'en',
      items: [{ text: 'Ziele', kind: 'text' }],
    }).expect(201);

    expect(res.body).toEqual({ translations: ['Goals'] });
    expect(consume).toHaveBeenCalledWith('user_1');
    expect(translate).toHaveBeenCalledWith(
      [{ text: 'Ziele', kind: 'text' }],
      'en',
    );
  });

  it('answers 429 when the quota is used up, without calling the model', async () => {
    consume.mockResolvedValue(false);

    await post({
      target: 'de',
      items: [{ text: 'Goals', kind: 'text' }],
    }).expect(429);
    expect(translate).not.toHaveBeenCalled();
  });

  it('answers 503 without a key, before booking anything', async () => {
    available = false;

    await post({
      target: 'de',
      items: [{ text: 'Goals', kind: 'text' }],
    }).expect(503);
    expect(consume).not.toHaveBeenCalled();
  });

  it('rejects other languages, unknown kinds and empty lists', async () => {
    await post({ target: 'fr', items: [{ text: 'x', kind: 'text' }] }).expect(
      400,
    );
    await post({ target: 'en', items: [{ text: 'x', kind: 'html' }] }).expect(
      400,
    );
    await post({ target: 'en', items: [] }).expect(400);
    expect(consume).not.toHaveBeenCalled();
  });

  it('rejects a request above the character limit — the client splits large plans', async () => {
    const half = 'a'.repeat(MAX_TRANSLATE_CHARS / 2 + 1);

    await post({
      target: 'en',
      items: [
        { text: half, kind: 'text' },
        { text: half, kind: 'text' },
      ],
    }).expect(413);
    expect(consume).not.toHaveBeenCalled();
  });
});
