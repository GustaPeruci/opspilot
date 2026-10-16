import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IdentityModule } from '../identity/identity.module';
import { WorkItemsController } from './work-items.controller';
import { WorkItemsService } from './work-items.service';

@Module({
  imports: [IdentityModule],
  controllers: [WorkItemsController],
  providers: [PrismaService, WorkItemsService],
})
export class OperationsModule {}
