import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('./operations-utils.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exports = {};
const module = { exports };
new Function('module', 'exports', js)(module, exports);
const { filterItems, summarize, nextStatuses } = module.exports;
const items = [
  { id: '1', title: 'Revisar pedido', description: 'Cliente', status: 'TODO', createdAt: '' },
  { id: '2', title: 'Entregar documentação', description: null, status: 'DONE', createdAt: '' },
];
test('search is case-insensitive and status-scoped', () => {
  assert.deepEqual(filterItems(items, 'PEDIDO', 'TODO').map(x => x.id), ['1']);
  assert.deepEqual(filterItems(items, 'cliente', '').map(x => x.id), ['1']);
  assert.deepEqual(filterItems(items, '', 'IN_PROGRESS'), []);
});
test('dashboard counters represent source items', () => {
  assert.deepEqual(summarize(items), { total: 2, todo: 1, progress: 0, done: 1 });
});
test('terminal statuses cannot transition', () => {
  assert.deepEqual(nextStatuses.DONE, []);
  assert.deepEqual(nextStatuses.CANCELED, []);
  assert.deepEqual(nextStatuses.TODO, ['IN_PROGRESS', 'CANCELED']);
});
