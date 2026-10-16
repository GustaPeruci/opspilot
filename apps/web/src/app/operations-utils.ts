export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
export type WorkItem = { id: string; title: string; description: string | null; status: Status; createdAt: string };
export const labels: Record<Status, string> = {
  TODO: 'A fazer', IN_PROGRESS: 'Em andamento', DONE: 'Concluída', CANCELED: 'Cancelada',
};
export const activeStatuses: Status[] = ['TODO', 'IN_PROGRESS'];
export const nextStatuses: Record<Status, readonly Status[]> = {
  TODO: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['DONE', 'CANCELED'],
  DONE: [],
  CANCELED: [],
};
export function filterItems(items: WorkItem[], query: string, status: Status | ''): WorkItem[] {
  const normalized = query.trim().toLocaleLowerCase('pt-BR');
  return items.filter(item => (!status || item.status === status) &&
    (item.title + ' ' + (item.description ?? '')).toLocaleLowerCase('pt-BR').includes(normalized));
}
export function summarize(items: WorkItem[]) {
  return {
    total: items.length,
    todo: items.filter(x => x.status === 'TODO').length,
    progress: items.filter(x => x.status === 'IN_PROGRESS').length,
    done: items.filter(x => x.status === 'DONE').length,
  };
}
