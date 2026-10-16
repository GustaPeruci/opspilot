import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { hashPassword } from '../src/identity/password';

describe('Work items (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId = '';
  let organizationId = '';
  let otherId = '';
  const email = `work-${randomUUID()}@example.test`;
  const password = 'strong-work-password-123';
  let token = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
    userId = user.id;
    const own = await prisma.organization.create({ data: { name: 'Operations', slug: `work-${randomUUID()}` } });
    const other = await prisma.organization.create({ data: { name: 'Foreign', slug: `foreign-${randomUUID()}` } });
    organizationId = own.id;
    otherId = other.id;
    await prisma.membership.create({
      data: { userId, organizationId, role: 'MEMBER', status: 'ACTIVE' },
    });
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (organizationId) await prisma.organization.delete({ where: { id: organizationId } });
    if (otherId) await prisma.organization.delete({ where: { id: otherId } });
    await app?.close();
  });

  it('creates, lists, transitions and isolates work items', async () => {
    const base = `/organizations/${organizationId}/work-items`;
    await request(app.getHttpServer()).get(base).expect(401);
    await request(app.getHttpServer()).post(base).set('Authorization', `Bearer ${token}`)
      .send({ title: '' }).expect(400);
    const created = await request(app.getHttpServer()).post(base)
      .set('Authorization', `Bearer ${token}`).send({ title: 'Review order' }).expect(201);
    const id: string = created.body.id;
    await request(app.getHttpServer()).get(base)
      .set('Authorization', `Bearer ${token}`).expect(200)
      .expect((res) => expect(res.body.some((item: { id: string }) => item.id === id)).toBe(true));
    await request(app.getHttpServer()).get(`/organizations/${otherId}/work-items/${id}`)
      .set('Authorization', `Bearer ${token}`).expect(403);
    await request(app.getHttpServer()).patch(`${base}/${id}/status`)
      .set('Authorization', `Bearer ${token}`).send({ status: 'DONE' }).expect(409);
    await request(app.getHttpServer()).patch(`${base}/${id}/status`)
      .set('Authorization', `Bearer ${token}`).send({ status: 'IN_PROGRESS' }).expect(200);
    await request(app.getHttpServer()).patch(`${base}/${id}/status`)
      .set('Authorization', `Bearer ${token}`).send({ status: 'DONE' }).expect(200);
    await request(app.getHttpServer()).patch(`${base}/${id}/status`)
      .set('Authorization', `Bearer ${token}`).send({ status: 'TODO' }).expect(409);
  });

  it('allows viewers to read but not create work items', async () => {
    await prisma.membership.update({
      where: { userId_organizationId: { userId, organizationId } },
      data: { role: 'VIEWER' },
    });
    const base = `/organizations/${organizationId}/work-items`;
    await request(app.getHttpServer()).get(base).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app.getHttpServer()).post(base)
      .set('Authorization', `Bearer ${token}`).send({ title: 'Forbidden' }).expect(403);
  });
});
