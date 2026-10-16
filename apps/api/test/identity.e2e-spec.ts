import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { hashPassword } from '../src/identity/password';

describe('Identity integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let ownOrgId: string;
  let otherOrgId: string;
  const email = `e2e-${randomUUID()}@example.test`;
  const password = 'strong-e2e-password-123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
    userId = user.id;
    const own = await prisma.organization.create({ data: { name: 'Own', slug: `own-${randomUUID()}` } });
    const other = await prisma.organization.create({ data: { name: 'Other', slug: `other-${randomUUID()}` } });
    ownOrgId = own.id;
    otherOrgId = other.id;
    await prisma.membership.create({
      data: { userId, organizationId: ownOrgId, role: 'VIEWER', status: 'ACTIVE' },
    });
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (ownOrgId) await prisma.organization.delete({ where: { id: ownOrgId } });
    if (otherOrgId) await prisma.organization.delete({ where: { id: otherOrgId } });
    await app?.close();
  });

  it('rejects unauthenticated and malformed requests', async () => {
    await request(app.getHttpServer()).get(`/organizations/${ownOrgId}`).expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'short' }).expect(400);
    await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'wrong-long-password' }).expect(401);
  });

  it('authenticates, isolates tenants and revokes on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login').send({ email, password }).expect(200);
    const token: string = login.body.accessToken;
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    await request(app.getHttpServer())
      .get(`/organizations/${ownOrgId}`).set('Authorization', `Bearer ${token}`)
      .expect(200).expect((res) => expect(res.body.id).toBe(ownOrgId));

    await request(app.getHttpServer())
      .get(`/organizations/${otherOrgId}`).set('Authorization', `Bearer ${token}`)
      .expect(403);

    await prisma.membership.update({
      where: { userId_organizationId: { userId, organizationId: ownOrgId } },
      data: { status: 'SUSPENDED' },
    });
    await request(app.getHttpServer())
      .get(`/organizations/${ownOrgId}`).set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);

    await request(app.getHttpServer())
      .get(`/organizations/${ownOrgId}`).set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
