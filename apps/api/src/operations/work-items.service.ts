import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkItemStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

const TRANSITIONS: Record<WorkItemStatus, readonly WorkItemStatus[]> = {
  TODO: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['DONE', 'CANCELED'],
  DONE: [],
  CANCELED: [],
};

@Injectable()
export class WorkItemsService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.workItem.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async get(organizationId: string, id: string) {
    const item = await this.prisma.workItem.findFirst({
      where: { organizationId, id },
    });
    if (!item) throw new NotFoundException('Work item not found');
    return item;
  }

  create(organizationId: string, title: string, description?: string) {
    return this.prisma.workItem.create({
      data: { organizationId, title: title.trim(), description: description?.trim() },
    });
  }

  async transition(organizationId: string, id: string, next: WorkItemStatus) {
    const item = await this.get(organizationId, id);
    if (!TRANSITIONS[item.status].includes(next)) {
      throw new ConflictException('Invalid work item transition');
    }
    const result = await this.prisma.workItem.updateMany({
      where: { id, organizationId, status: item.status },
      data: { status: next },
    });
    if (result.count !== 1) throw new ConflictException('Work item changed concurrently');
    return this.get(organizationId, id);
  }
}
