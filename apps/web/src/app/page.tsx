'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
type WorkItem = { id: string; title: string; description: string | null; status: Status; createdAt: string };
const labels: Record<Status, string> = { TODO: 'A fazer', IN_PROGRESS: 'Em andamento', DONE: 'Concluída', CANCELED: 'Cancelada' };
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API_URL + path, {
    ...init,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sessão inválida ou expirada. Faça login novamente.');
    if (response.status === 403) throw new Error('Você não possui permissão para esta operação.');
    if (response.status === 409) throw new Error('Transição inválida ou tarefa alterada por outro usuário.');
    throw new Error(`Falha na requisição (HTTP ${response.status}).`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export default function Home() {
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [token, setToken] = useState('');
  const [items, setItems] = useState<WorkItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Status | ''>('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);

  const load = useCallback(async () => {
    if (!token || !organizationId) return;
    try {
      const data = await api<WorkItem[]>(`/organizations/${encodeURIComponent(organizationId)}/work-items`, token);
      setItems(data);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar tarefas'); }
  }, [organizationId, token]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    total: items.length,
    todo: items.filter(x => x.status === 'TODO').length,
    progress: items.filter(x => x.status === 'IN_PROGRESS').length,
    done: items.filter(x => x.status === 'DONE').length,
  }), [items]);

  const visible = useMemo(() => items.filter(item =>
    (!filter || item.status === filter) &&
    (item.title + ' ' + (item.description ?? '')).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')),
  ), [items, filter, search]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await fetch(API_URL + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), cache: 'no-store',
      });
      if (!result.ok) throw new Error('Credenciais inválidas ou conta temporariamente bloqueada.');
      const body = await result.json() as { accessToken: string };
      setPassword(''); setToken(body.accessToken);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha no login'); }
    finally { setBusy(false); }
  }

  async function logout() {
    try { if (token) await api<void>('/auth/logout', token, { method: 'POST' }); }
    catch { /* Clear local session even if network logout fails. */ }
    setToken(''); setItems([]); setPassword(''); setError('');
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !organizationId || !token) return;
    setBusy(true);
    try {
      await api<WorkItem>(`/organizations/${encodeURIComponent(organizationId)}/work-items`, token, {
        method: 'POST', body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      setTitle(''); setDescription(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao criar tarefa'); }
    finally { setBusy(false); }
  }

  async function transition(id: string, status: Status) {
    setBusy(true);
    try {
      await api<WorkItem>(`/organizations/${encodeURIComponent(organizationId)}/work-items/${encodeURIComponent(id)}/status`, token, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao atualizar tarefa'); }
    finally { setBusy(false); }
  }

  return <div className="op-shell">
    <aside className="op-sidebar">
      <div className="op-brand"><span className="op-mark">O</span> OpsPilot</div>
      <nav className="op-nav" aria-label="Navegação"><a href="#overview" aria-current="page">Overview</a><a href="#work-items">Work items</a></nav>
      <div className="op-sidebar-note">FORGE DESIGN SYSTEM v1.2<br/>OPSPILOT / OPERATIONS</div>
    </aside>
    <main className="op-main" id="overview">
      <header className="op-heading">
        <div><div className="fg-eyebrow">Operations / Workspace</div><h1>Operations overview</h1><p className="op-subtitle">Acompanhe e gerencie o fluxo de trabalho da sua organização.</p></div>
        <button className="fg-button" onClick={() => setDark(!dark)} type="button" aria-label="Alternar tema">{dark ? 'Tema claro' : 'Tema escuro'}</button>
      </header>

      <section className="op-cards" aria-label="Indicadores">
        {([['Total', counts.total], ['A fazer', counts.todo], ['Em andamento', counts.progress], ['Concluídas', counts.done]] as const).map(([label, value]) =>
          <div className="fg-panel op-stat" key={label}><div className="op-stat-label">{label}</div><div className="op-stat-value fg-number">{value}</div></div>)}
      </section>

      {!token ? <section className="fg-panel op-panel" aria-label="Autenticação">
        <h2 className="fg-section-title">Acessar workspace</h2>
        <p className="op-muted">Entre com uma conta provisionada na API. Esta interface não utiliza dados simulados.</p>
        <form className="op-config" onSubmit={login}>
          <label>E-mail<input className="fg-input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Senha<input className="fg-input" type="password" autoComplete="current-password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} required /></label>
          <label>ID da organização<input className="fg-input" value={organizationId} onChange={e => setOrganizationId(e.target.value.trim())} required placeholder="UUID da organização" /></label>
          <button className="fg-button fg-button--primary" disabled={busy} type="submit">Entrar</button>
        </form>
        <div className="op-info">Configure a API em NEXT_PUBLIC_API_URL e crie a organização com o script de bootstrap do backend.</div>
      </section> : <section className="fg-panel op-panel" id="work-items">
        <div className="op-toolbar">
          <h2>Work items</h2>
          <div className="op-controls">
            <input className="fg-input" aria-label="Buscar tarefas" placeholder="Buscar tarefas..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="fg-input" aria-label="Filtrar status" value={filter} onChange={e => setFilter(e.target.value as Status | '')}>
              <option value="">Todos os status</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <button className="fg-button" onClick={() => void load()} disabled={busy}>Atualizar</button>
            <button className="fg-button" onClick={() => void logout()}>Sair</button>
          </div>
        </div>
        <form className="op-form" onSubmit={create}>
          <label>Título<input className="fg-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={160} required placeholder="Nova tarefa" /></label>
          <label>Descrição<input className="fg-input" value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} placeholder="Opcional" /></label>
          <button className="fg-button fg-button--primary" disabled={busy || !title.trim()}>Criar tarefa</button>
        </form>
        <div className="op-table-wrap"><table className="fg-table"><thead><tr><th>Tarefa</th><th>Criada em</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          {visible.map(item => <tr key={item.id}><td><strong>{item.title}</strong>{item.description && <div className="op-muted">{item.description}</div>}</td>
            <td className="fg-number">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
            <td><span className={`op-status op-status--${item.status}`}>{labels[item.status]}</span></td>
            <td><div className="op-actions">
              {item.status === 'TODO' && <button className="fg-button fg-button--sm" disabled={busy} onClick={() => void transition(item.id, 'IN_PROGRESS')}>Iniciar</button>}
              {item.status === 'IN_PROGRESS' && <button className="fg-button fg-button--sm" disabled={busy} onClick={() => void transition(item.id, 'DONE')}>Concluir</button>}
              {(item.status === 'TODO' || item.status === 'IN_PROGRESS') && <button className="fg-button fg-button--sm" disabled={busy} onClick={() => void transition(item.id, 'CANCELED')}>Cancelar</button>}
            </div></td></tr>)}
          {!visible.length && <tr><td colSpan={4} className="op-muted">Nenhuma tarefa encontrada.</td></tr>}
        </tbody></table></div>
      </section>}
      {error && <div className="op-error" role="alert">{error}</div>}
      <p className="op-muted" style={{ marginTop: 24, fontSize: 12 }}>OpsPilot · Forge Design System · Dados fornecidos pela API da organização.</p>
    </main>
  </div>;
}
