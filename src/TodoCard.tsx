import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Todo = {
  id: string;
  title: string;
  done: boolean;
  feature_id: string | null;
  feature: { id: string; title: string } | null;
  created_at: string;
  completed_at: string | null;
};

const demoTodos: Todo[] = [
  { id: 'todo-1', title: 'Test payment failure on the live website', done: false, feature_id: 'demo-2', feature: { id: 'demo-2', title: 'Payment failure return screen' }, created_at: '2026-07-11T08:00:00Z', completed_at: null },
  { id: 'todo-2', title: 'Check the new WhatsApp message', done: false, feature_id: null, feature: null, created_at: '2026-07-11T07:00:00Z', completed_at: null },
  { id: 'todo-3', title: 'Replace the event photograph', done: true, feature_id: null, feature: null, created_at: '2026-07-10T07:00:00Z', completed_at: '2026-07-11T06:00:00Z' },
];

type TodoChange =
  | { action: 'upsert'; todo: Todo }
  | { action: 'delete'; id: string };

function announceTodoChange(change?: TodoChange) {
  window.dispatchEvent(new CustomEvent('product-todos-changed', { detail: change }));
}

function normalizeFeature(value: unknown): { id: string; title: string } | null {
  const feature = Array.isArray(value) ? value[0] : value;
  if (!feature || typeof feature !== 'object' || !('id' in feature) || !('title' in feature)) return null;
  return { id: String(feature.id), title: String(feature.title) };
}

function normalizeTodo(row: Record<string, unknown>): Todo {
  return {
    id: String(row.id), title: String(row.title), done: Boolean(row.done),
    feature_id: row.feature_id ? String(row.feature_id) : null,
    feature: normalizeFeature(row.feature),
    created_at: String(row.created_at),
    completed_at: row.completed_at ? String(row.completed_at) : null,
  };
}

export default function TodoCard({ demo = false }: { demo?: boolean }) {
  const [todos, setTodos] = useState<Todo[]>(demo ? demoTodos : []);
  const [title, setTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(!demo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (demo) return;
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase
      .from('product_todos')
      .select('id, title, done, feature_id, created_at, completed_at, feature:roadmap_features(id, title)')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message.includes('product_todos') ? 'The to-do database migration has not been applied yet.' : loadError.message);
    else setTodos((data ?? []).map(row => normalizeTodo(row)));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [demo]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const change = (event as CustomEvent<TodoChange | undefined>).detail;
      if (!demo || !change) { void load(); return; }
      if (change.action === 'delete') setTodos(current => current.filter(item => item.id !== change.id));
      else setTodos(current => [change.todo, ...current.filter(item => item.id !== change.todo.id)]);
    };
    window.addEventListener('product-todos-changed', handleChange);
    return () => window.removeEventListener('product-todos-changed', handleChange);
  }, [demo]);

  const addTodo = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;
    if (demo) {
      const todo: Todo = { id: `demo-${Date.now()}`, title: cleanTitle, done: false, feature_id: null, feature: null, created_at: new Date().toISOString(), completed_at: null };
      setTodos(current => [todo, ...current]);
      announceTodoChange({ action: 'upsert', todo });
      setTitle('');
      return;
    }
    setSaving(true);
    const { error: addError } = await supabase.from('product_todos').insert({ title: cleanTitle });
    if (addError) setError(addError.message); else { setTitle(''); await load(); announceTodoChange(); }
    setSaving(false);
  };

  const toggleTodo = async (todo: Todo) => {
    const nextDone = !todo.done;
    if (demo) {
      const changed = { ...todo, done: nextDone, completed_at: nextDone ? new Date().toISOString() : null };
      setTodos(current => current.map(item => item.id === todo.id ? changed : item));
      announceTodoChange({ action: 'upsert', todo: changed });
      return;
    }
    const { error: toggleError } = await supabase.from('product_todos').update({
      done: nextDone,
      completed_at: nextDone ? new Date().toISOString() : null,
    }).eq('id', todo.id);
    if (toggleError) setError(toggleError.message); else { await load(); announceTodoChange(); }
  };

  const removeTodo = async (todo: Todo) => {
    if (demo) {
      setTodos(current => current.filter(item => item.id !== todo.id));
      announceTodoChange({ action: 'delete', id: todo.id });
      return;
    }
    const { error: removeError } = await supabase.from('product_todos').delete().eq('id', todo.id);
    if (removeError) setError(removeError.message); else { await load(); announceTodoChange(); }
  };

  const active = todos.filter(todo => !todo.done);
  const completed = todos.filter(todo => todo.done);

  const row = (todo: Todo) => (
    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 2px', borderTop: '1px solid #f1f3f5' }}>
      <input aria-label={todo.done ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`} type="checkbox" checked={todo.done} onChange={() => void toggleTodo(todo)} style={{ width: 17, height: 17, accentColor: '#111827', cursor: 'pointer' }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, lineHeight: 1.4, color: todo.done ? '#9ca3af' : '#111827', textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.title}</span>
        {todo.feature && <span style={{ display: 'block', marginTop: 2, color: '#9ca3af', fontSize: 10.5 }}>For: {todo.feature.title}</span>}
      </span>
      <button aria-label={`Delete ${todo.title}`} onClick={() => void removeTodo(todo)} style={{ border: 'none', background: 'none', color: '#c4c7cc', cursor: 'pointer', fontSize: 14, padding: '3px 5px' }}>✕</button>
    </div>
  );

  return (
    <section style={{ marginTop: 38, paddingTop: 32, borderTop: '2px solid #e5e7eb' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 15, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 14 }}>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 850, color: '#111827' }}>To-do</div>
          <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{active.length} left</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: active.length ? 6 : 13 }}>
          <input
            autoComplete="off"
            value={title}
            onChange={event => setTitle(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') void addTodo(); }}
            placeholder="Add something to do…"
            style={{ flex: 1, minWidth: 0, border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
          <button disabled={!title.trim() || saving} onClick={() => void addTodo()} style={{ border: '1.5px solid #111827', borderRadius: 9, padding: '9px 16px', background: '#111827', color: '#fff', fontSize: 12, fontWeight: 750, cursor: !title.trim() || saving ? 'default' : 'pointer', opacity: !title.trim() || saving ? .5 : 1 }}>Add</button>
        </div>

        {error && <div style={{ padding: '9px 11px', margin: '9px 0', borderRadius: 9, background: '#fef2f2', color: '#b91c1c', fontSize: 12 }}>{error}</div>}
        {loading ? <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Loading to-do list…</div> : (
          <>
            {active.map(row)}
            {active.length === 0 && <div style={{ padding: '22px 4px 13px', color: '#9ca3af', fontSize: 12.5, textAlign: 'center' }}>Nothing to do right now.</div>}
            {completed.length > 0 && (
              <>
                <button onClick={() => setShowCompleted(value => !value)} style={{ border: 'none', background: 'none', padding: '10px 2px 2px', color: '#6b7280', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                  {showCompleted ? 'Hide completed' : `Show completed (${completed.length})`}
                </button>
                {showCompleted && completed.map(row)}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
