import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

type WorkflowStatus = 'building' | 'live_test' | 'complete';

type RoadmapFeature = {
  id: string;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type FeatureTodo = {
  id: string;
  title: string;
  done: boolean;
  feature_id: string;
  feature: { id: string; title: string } | null;
  created_at: string;
  completed_at: string | null;
};

type TodoChange =
  | { action: 'upsert'; todo: FeatureTodo }
  | { action: 'delete'; id: string };

function announceTodoChange(change?: TodoChange) {
  window.dispatchEvent(new CustomEvent('product-todos-changed', { detail: change }));
}

function normalizeFeatureRef(value: unknown): { id: string; title: string } | null {
  const feature = Array.isArray(value) ? value[0] : value;
  if (!feature || typeof feature !== 'object' || !('id' in feature) || !('title' in feature)) return null;
  return { id: String(feature.id), title: String(feature.title) };
}

function normalizeFeatureTodo(row: Record<string, unknown>): FeatureTodo {
  return {
    id: String(row.id), title: String(row.title), done: Boolean(row.done),
    feature_id: String(row.feature_id), feature: normalizeFeatureRef(row.feature),
    created_at: String(row.created_at),
    completed_at: row.completed_at ? String(row.completed_at) : null,
  };
}

type FeatureDraft = {
  title: string;
  description: string;
  status: WorkflowStatus;
};

const COLUMNS: { status: WorkflowStatus; label: string; color: string; soft: string }[] = [
  { status: 'building', label: 'In Progress', color: '#2563eb', soft: '#eff6ff' },
  { status: 'live_test', label: 'Need Testing', color: '#b45309', soft: '#fffbeb' },
  { status: 'complete', label: 'Complete', color: '#15803d', soft: '#f0fdf4' },
];

const emptyDraft = (): FeatureDraft => ({ title: '', description: '', status: 'building' });

const demoFeatures: RoadmapFeature[] = [
  {
    id: 'demo-1', title: 'Feature roadmap', description: 'Make the shared roadmap quick and easy to use.',
    status: 'building', archived: false, created_at: '2026-07-11T07:00:00Z', updated_at: '2026-07-11T07:00:00Z',
  },
  {
    id: 'demo-2', title: 'Payment failure return screen', description: 'Check the retry path on the live website.',
    status: 'live_test', archived: false, created_at: '2026-07-10T08:00:00Z', updated_at: '2026-07-11T08:00:00Z',
  },
  {
    id: 'demo-3', title: 'Open-event booking flow', description: 'Direct booking without an approval step.',
    status: 'complete', archived: false, created_at: '2026-07-04T07:00:00Z', updated_at: '2026-07-10T07:00:00Z',
  },
];

const demoFeatureTodos: FeatureTodo[] = [
  {
    id: 'todo-1', title: 'Test payment failure on the live website', done: false,
    feature_id: 'demo-2', feature: { id: 'demo-2', title: 'Payment failure return screen' },
    created_at: '2026-07-11T08:00:00Z', completed_at: null,
  },
];

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 10,
  padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: '#111827', background: '#fff', outline: 'none',
};

const button = (primary = false): React.CSSProperties => ({
  border: primary ? '1.5px solid #111827' : '1.5px solid #e5e7eb', borderRadius: 9,
  padding: '9px 14px', background: primary ? '#111827' : '#fff', color: primary ? '#fff' : '#374151',
  fontSize: 12, fontWeight: 750, cursor: 'pointer', fontFamily: 'inherit',
});

function niceDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function normalizeStatus(value: string): WorkflowStatus {
  if (value === 'complete') return 'complete';
  if (value === 'live_test' || value === 'fixes_needed') return 'live_test';
  return 'building';
}

export default function ProductRoadmap({ demo = false }: { demo?: boolean }) {
  const [features, setFeatures] = useState<RoadmapFeature[]>(demo ? demoFeatures : []);
  const [featureTodos, setFeatureTodos] = useState<FeatureTodo[]>(demo ? demoFeatureTodos : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<FeatureDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [todoTitle, setTodoTitle] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = async () => {
    if (demo) return;
    setLoading(true);
    setError('');
    const [featureResult, todoResult] = await Promise.all([
      supabase.from('roadmap_features')
        .select('id, title, description, status, archived, created_at, updated_at')
        .eq('archived', false)
        .order('created_at', { ascending: false }),
      supabase.from('product_todos')
        .select('id, title, done, feature_id, created_at, completed_at, feature:roadmap_features(id, title)')
        .not('feature_id', 'is', null)
        .order('created_at', { ascending: false }),
    ]);
    const loadError = featureResult.error || todoResult.error;
    if (loadError) {
      setError(loadError.message.includes('roadmap_') || loadError.message.includes('product_todos') ? 'The local roadmap database migration has not been applied yet.' : loadError.message);
    } else {
      setFeatures((featureResult.data ?? []).map(row => ({ ...row, status: normalizeStatus(row.status) })) as RoadmapFeature[]);
      setFeatureTodos((todoResult.data ?? []).map(row => normalizeFeatureTodo(row)));
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [demo]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const change = (event as CustomEvent<TodoChange | undefined>).detail;
      if (!demo || !change) { void load(); return; }
      if (change.action === 'delete') setFeatureTodos(current => current.filter(item => item.id !== change.id));
      else if (change.todo.feature_id) setFeatureTodos(current => [change.todo, ...current.filter(item => item.id !== change.todo.id)]);
    };
    window.addEventListener('product-todos-changed', handleChange);
    return () => window.removeEventListener('product-todos-changed', handleChange);
  }, [demo]);

  const openFeature = (feature: RoadmapFeature) => {
    setEditingId(feature.id);
    setDraft({ title: feature.title, description: feature.description ?? '', status: feature.status });
    setTodoTitle('');
  };

  const startNew = () => {
    setEditingId('new');
    setDraft(emptyDraft());
    setTodoTitle('');
  };

  const selected = editingId && editingId !== 'new' ? features.find(feature => feature.id === editingId) ?? null : null;
  const selectedTodos = selected ? featureTodos.filter(todo => todo.feature_id === selected.id) : [];

  const addFeatureTodo = async () => {
    if (!selected || !todoTitle.trim() || saving) return;
    const cleanTitle = todoTitle.trim();
    if (demo) {
      const todo: FeatureTodo = {
        id: `demo-feature-todo-${Date.now()}`, title: cleanTitle, done: false,
        feature_id: selected.id, feature: { id: selected.id, title: selected.title },
        created_at: new Date().toISOString(), completed_at: null,
      };
      setFeatureTodos(current => [todo, ...current]);
      setTodoTitle('');
      announceTodoChange({ action: 'upsert', todo });
      return;
    }
    setSaving(true);
    const { data, error: addError } = await supabase.from('product_todos')
      .insert({ title: cleanTitle, feature_id: selected.id })
      .select('id, title, done, feature_id, created_at, completed_at, feature:roadmap_features(id, title)')
      .single();
    if (addError) setError(addError.message);
    else { setTodoTitle(''); await load(); announceTodoChange({ action: 'upsert', todo: normalizeFeatureTodo(data) }); }
    setSaving(false);
  };

  const toggleFeatureTodo = async (todo: FeatureTodo) => {
    const nextDone = !todo.done;
    const changed = { ...todo, done: nextDone, completed_at: nextDone ? new Date().toISOString() : null };
    if (demo) {
      setFeatureTodos(current => current.map(item => item.id === todo.id ? changed : item));
      announceTodoChange({ action: 'upsert', todo: changed });
      return;
    }
    const { error: toggleError } = await supabase.from('product_todos')
      .update({ done: nextDone, completed_at: changed.completed_at }).eq('id', todo.id);
    if (toggleError) setError(toggleError.message);
    else { await load(); announceTodoChange({ action: 'upsert', todo: changed }); }
  };

  const removeFeatureTodo = async (todo: FeatureTodo) => {
    if (demo) {
      setFeatureTodos(current => current.filter(item => item.id !== todo.id));
      announceTodoChange({ action: 'delete', id: todo.id });
      return;
    }
    const { error: removeError } = await supabase.from('product_todos').delete().eq('id', todo.id);
    if (removeError) setError(removeError.message);
    else { await load(); announceTodoChange({ action: 'delete', id: todo.id }); }
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const toggleSelected = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkMarkTested = async () => {
    if (selectedIds.size === 0 || bulkSaving) return;
    const ids = [...selectedIds];
    if (demo) {
      setFeatures(current => current.map(feature => ids.includes(feature.id) ? { ...feature, status: 'complete' } : feature));
      exitSelectMode();
      return;
    }
    setBulkSaving(true);
    setError('');
    const { error: bulkError } = await supabase.from('roadmap_features')
      .update({ status: 'complete', updated_at: new Date().toISOString() })
      .in('id', ids);
    if (bulkError) setError(bulkError.message);
    else { exitSelectMode(); await load(); }
    setBulkSaving(false);
  };

  const saveFeature = async () => {
    if (!draft.title.trim()) { setError('Add a feature name first.'); return; }
    if (demo) { setEditingId(null); return; }
    setSaving(true);
    setError('');
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      status: draft.status,
      updated_at: new Date().toISOString(),
    };
    const result = editingId === 'new'
      ? await supabase.from('roadmap_features').insert(payload)
      : await supabase.from('roadmap_features').update(payload).eq('id', editingId);
    if (result.error) setError(result.error.message);
    else { setEditingId(null); await load(); }
    setSaving(false);
  };

  const removeFeature = async () => {
    if (!editingId || editingId === 'new' || demo) { setEditingId(null); return; }
    setSaving(true);
    const { error: removeError } = await supabase.from('roadmap_features')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', editingId);
    if (removeError) setError(removeError.message);
    else { setEditingId(null); await load(); }
    setSaving(false);
  };

  return (
    <section style={{ marginTop: 38, paddingTop: 32, borderTop: '2px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{ flex: 1, fontSize: 24, lineHeight: 1.15, fontWeight: 850, color: '#111827' }}>Product roadmap</div>
        <button style={{ ...button(true), padding: '10px 17px', fontSize: 13 }} onClick={startNew}>＋ Add feature</button>
      </div>

      {demo && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #fcd34d', color: '#b45309', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>Preview — sample data only.</div>}
      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading roadmap…</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, alignItems: 'start' }}>
          {COLUMNS.map(column => {
            const items = features.filter(feature => feature.status === column.status);
            const canSelect = column.status === 'live_test';
            const inSelectMode = canSelect && selectMode;
            const allSelected = items.length > 0 && items.every(feature => selectedIds.has(feature.id));
            return (
              <div key={column.status} style={{ minWidth: 0, background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: column.color }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 850, color: '#111827' }}>{column.label}</span>
                  {canSelect && items.length > 0 && (
                    <button onClick={() => (inSelectMode ? exitSelectMode() : setSelectMode(true))} style={{
                      border: 'none', background: 'none', color: column.color, fontSize: 11, fontWeight: 850,
                      cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                    }}>{inSelectMode ? 'Cancel' : 'Select'}</button>
                  )}
                  <span style={{ minWidth: 23, textAlign: 'center', borderRadius: 99, padding: '2px 7px', background: column.soft, color: column.color, fontSize: 11, fontWeight: 850 }}>{items.length}</span>
                </div>
                {inSelectMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <button onClick={() => setSelectedIds(allSelected ? new Set() : new Set(items.map(feature => feature.id)))} style={{
                      border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit', borderRadius: 8, padding: '5px 9px',
                    }}>{allSelected ? 'Clear all' : 'Select all'}</button>
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>{selectedIds.size} selected</span>
                  </div>
                )}
                <div style={{ display: 'grid', gap: 8, maxHeight: 620, overflowY: 'auto' }}>
                  {items.map(feature => {
                    const checked = selectedIds.has(feature.id);
                    return (
                      <button
                        key={feature.id}
                        onClick={() => (inSelectMode ? toggleSelected(feature.id) : openFeature(feature))}
                        style={{
                          textAlign: 'left', width: '100%', background: inSelectMode && checked ? column.soft : '#fff',
                          border: `1.5px solid ${inSelectMode && checked ? column.color : '#e5e7eb'}`, borderRadius: 11,
                          padding: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,.03)',
                          display: inSelectMode ? 'flex' : 'block', alignItems: 'flex-start', gap: 9,
                        }}>
                        {inSelectMode && <input type="checkbox" readOnly checked={checked} aria-label={`Select ${feature.title}`} style={{ width: 16, height: 16, marginTop: 1, accentColor: column.color, pointerEvents: 'none' }} />}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{feature.title}</div>
                          {feature.description && <div style={{ color: '#6b7280', fontSize: 11.5, lineHeight: 1.4, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feature.description}</div>}
                          <div style={{ color: '#9ca3af', fontSize: 10.5, marginTop: 9 }}>Added {niceDate(feature.created_at)}</div>
                        </div>
                      </button>
                    );
                  })}
                  {items.length === 0 && <div style={{ padding: '22px 10px', border: '1.5px dashed #d1d5db', borderRadius: 11, textAlign: 'center', color: '#9ca3af', fontSize: 11.5 }}>Nothing here</div>}
                </div>
                {inSelectMode && (
                  <button
                    disabled={selectedIds.size === 0 || bulkSaving}
                    onClick={() => void bulkMarkTested()}
                    style={{
                      width: '100%', marginTop: 10, border: `1.5px solid ${column.color}`, borderRadius: 10, padding: '10px 12px',
                      background: selectedIds.size === 0 ? '#fff' : column.color, color: selectedIds.size === 0 ? '#9ca3af' : '#fff',
                      fontSize: 12.5, fontWeight: 850, cursor: selectedIds.size === 0 || bulkSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>
                    {bulkSaving ? 'Marking…' : selectedIds.size === 0 ? 'Mark as tested' : `Mark ${selectedIds.size} as tested`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,.38)', display: 'grid', placeItems: 'center', padding: 18 }} onMouseDown={event => { if (event.target === event.currentTarget) setEditingId(null); }}>
          <div role="dialog" aria-label={editingId === 'new' ? 'Add feature' : 'Edit feature'} style={{ width: 460, maxWidth: '100%', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: '#fff', borderRadius: 15, boxShadow: '0 18px 55px rgba(0,0,0,.22)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 850 }}>{editingId === 'new' ? 'Add feature' : 'Edit feature'}</div>
              <button aria-label="Close" onClick={() => setEditingId(null)} style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 17 }}>✕</button>
            </div>

            <label style={{ display: 'block', fontSize: 11, color: '#6b7280', fontWeight: 800, marginBottom: 6 }}>FEATURE NAME</label>
            <input autoFocus style={{ ...field, fontSize: 15, fontWeight: 700 }} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="What are you working on?" />
            <textarea style={{ ...field, resize: 'vertical', minHeight: 68, marginTop: 9, lineHeight: 1.45 }} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Short note — optional" />

            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 800, marginTop: 15, marginBottom: 7 }}>STATUS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 7 }}>
              {COLUMNS.map(column => {
                const active = draft.status === column.status;
                return (
                  <button key={column.status} onClick={() => setDraft({ ...draft, status: column.status })} style={{
                    border: `1.5px solid ${active ? column.color : '#e5e7eb'}`, borderRadius: 9, padding: '10px 5px',
                    background: active ? column.soft : '#fff', color: active ? column.color : '#6b7280', cursor: 'pointer',
                    fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
                  }}>{column.label}</button>
                );
              })}
            </div>

            {selected && (
              <div style={{ marginTop: 17, paddingTop: 15, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12.5, color: '#111827', fontWeight: 850, marginBottom: 7 }}>To-do</div>
                {selectedTodos.map(todo => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 1px', borderTop: '1px solid #f1f3f5' }}>
                    <input type="checkbox" aria-label={todo.done ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`} checked={todo.done} onChange={() => void toggleFeatureTodo(todo)} style={{ width: 16, height: 16, accentColor: '#111827' }} />
                    <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: todo.done ? '#9ca3af' : '#111827', textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.title}</span>
                    <button aria-label={`Delete ${todo.title}`} onClick={() => void removeFeatureTodo(todo)} style={{ border: 'none', background: 'none', color: '#c4c7cc', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
                  <input style={{ ...field, flex: 1 }} value={todoTitle} onChange={event => setTodoTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void addFeatureTodo(); }} placeholder="Add something to do…" />
                  <button style={button(true)} disabled={!todoTitle.trim() || saving} onClick={() => void addFeatureTodo()}>Add</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
              {editingId !== 'new' && <button style={{ ...button(), color: '#b91c1c' }} disabled={saving} onClick={removeFeature}>Remove</button>}
              <span style={{ flex: 1 }} />
              <button style={button()} disabled={saving} onClick={() => setEditingId(null)}>Cancel</button>
              <button style={button(true)} disabled={saving} onClick={saveFeature}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
