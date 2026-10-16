import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { IdentityModule } from './identity/identity.module';
import { OperationsModule } from './operations/operations.module';

@Module({ imports: [IdentityModule, OperationsModule], controllers: [HealthController] })
export class AppModule {}
