import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkItemsService } from './work-items.service';

describe('WorkItemsService', () => {
  const findMany = jest.fn();
  const findFirst = jest.fn();
  const create = jest.fn();
  const updateMany = jest.fn();
  const service = new WorkItemsService({
    workItem: { findMany, findFirst, create, updateMany },
  } as never);

  beforeEach(() => {
    for (const mock of [findMany, findFirst, create, updateMany]) mock.mockReset();
  });

  it('scopes list and item lookups to the organization', async () => {
    findMany.mockResolvedValue([]);
    findFirst.mockResolvedValue(null);
    await service.list('org-a');
    expect(findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-a' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    await expect(service.get('org-b', 'item-a')).rejects.toThrow(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith({
      where: { organizationId: 'org-b', id: 'item-a' },
    });
  });

  it('rejects invalid status changes', async () => {
    findFirst.mockResolvedValue({ id: 'item-a', organizationId: 'org-a', status: 'DONE' });
    await expect(service.transition('org-a', 'item-a', 'TODO')).rejects.toThrow(ConflictException);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('updates with both tenant and previous status predicates', async () => {
    findFirst.mockResolvedValue({ id: 'item-a', organizationId: 'org-a', status: 'TODO' });
    updateMany.mockResolvedValue({ count: 1 });
    await service.transition('org-a', 'item-a', 'IN_PROGRESS');
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'item-a', organizationId: 'org-a', status: 'TODO' },
      data: { status: 'IN_PROGRESS' },
    });
  });

  it('detects concurrent changes', async () => {
    findFirst.mockResolvedValue({ id: 'item-a', organizationId: 'org-a', status: 'TODO' });
    updateMany.mockResolvedValue({ count: 0 });
    await expect(service.transition('org-a', 'item-a', 'IN_PROGRESS')).rejects.toThrow(ConflictException);
  });
});
