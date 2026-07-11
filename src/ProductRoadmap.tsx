import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type WorkflowStatus = 'idea' | 'building' | 'live_test' | 'fixes_needed' | 'complete';
type FeatureType = 'feature' | 'improvement' | 'bug' | 'copy' | 'logic' | 'technical';
type TaskKind = 'todo' | 'test' | 'bug' | 'copy' | 'logic';

type RoadmapTask = {
  id: string;
  feature_id: string;
  title: string;
  kind: TaskKind;
  done: boolean;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
};

type TestRun = {
  id: string;
  feature_id: string;
  result: 'passed' | 'fixes_needed' | 'blocked';
  environment: string;
  notes: string | null;
  tested_at: string;
};

type ReleaseRef = {
  id: number;
  released_at: string;
  title: string;
  commit_hash: string | null;
};

type RoadmapFeature = {
  id: string;
  title: string;
  description: string | null;
  area: string;
  feature_type: FeatureType;
  status: WorkflowStatus;
  target_date: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined from feature_releases via release_id — set when the card was
  // shipped through a git push (auto-synced) or linked by the backfill.
  release: ReleaseRef | null;
  tasks: RoadmapTask[];
  test_runs: TestRun[];
};

type FeatureDraft = Pick<RoadmapFeature, 'title' | 'status'> & {
  description: string;
};

const STATUS: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  idea: { label: 'Idea', color: '#6b7280', bg: '#f3f4f6' },
  building: { label: 'Building', color: '#1d4ed8', bg: '#eff6ff' },
  live_test: { label: 'Need Testing', color: '#b45309', bg: '#fffbeb' },
  fixes_needed: { label: 'Fix needed', color: '#b91c1c', bg: '#fef2f2' },
  complete: { label: 'Complete', color: '#15803d', bg: '#f0fdf4' },
};

const TYPE_LABELS: Record<FeatureType, string> = {
  feature: 'New feature', improvement: 'Improvement', bug: 'Bug', copy: 'Copy', logic: 'Logic', technical: 'Technical',
};

const emptyDraft = (): FeatureDraft => ({
  title: '', description: '', status: 'idea',
});

const demoFeatures: RoadmapFeature[] = [
  {
    id: 'demo-1', title: 'Payment failure return screen', description: 'Make the retry path clear after a failed PayU payment.',
    area: 'Payments', feature_type: 'improvement', status: 'fixes_needed',
    target_date: null, archived: false, created_at: '2026-07-09T08:00:00Z', updated_at: '2026-07-11T08:00:00Z', release: null,
    tasks: [
      { id: 'dt1', feature_id: 'demo-1', title: 'Check failed payment redirect', kind: 'test', done: true, sort_order: 0, created_at: '', completed_at: '' },
      { id: 'dt2', feature_id: 'demo-1', title: 'Fix retry button copy', kind: 'copy', done: false, sort_order: 1, created_at: '', completed_at: null },
    ],
    test_runs: [{ id: 'dr1', feature_id: 'demo-1', result: 'fixes_needed', environment: 'Live website', notes: 'Retry works; button copy is unclear.', tested_at: '2026-07-11T08:00:00Z' }],
  },
  {
    id: 'demo-2', title: 'Feature roadmap', description: 'Shared feature, testing and fixes tracker below the journey map.',
    area: 'Admin', feature_type: 'feature', status: 'building',
    target_date: null, archived: false, created_at: '2026-07-11T07:00:00Z', updated_at: '2026-07-11T07:00:00Z', release: null, tasks: [], test_runs: [],
  },
  {
    id: 'demo-3', title: 'Open-event booking flow', description: 'Direct booking without the invite approval step.',
    area: 'Booking', feature_type: 'feature', status: 'complete',
    target_date: null, archived: false, created_at: '2026-07-04T07:00:00Z', updated_at: '2026-07-10T07:00:00Z',
    release: { id: 4, released_at: '2026-07-04', title: 'Open-event flow + creator affiliate links', commit_hash: 'fe27355' }, tasks: [],
    test_runs: [{ id: 'dr2', feature_id: 'demo-3', result: 'passed', environment: 'Live website', notes: 'Full booking and payment path passed.', tested_at: '2026-07-10T07:00:00Z' }],
  },
];

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 9,
  padding: '9px 11px', fontSize: 13, fontFamily: 'inherit', color: '#111827', background: '#fff', outline: 'none',
};

const buttonStyle = (primary = false): React.CSSProperties => ({
  border: primary ? '1.5px solid #111827' : '1.5px solid #e5e7eb', borderRadius: 9,
  padding: '8px 13px', background: primary ? '#111827' : '#fff', color: primary ? '#fff' : '#374151',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
});

function Badge({ value }: { value: WorkflowStatus }) {
  const meta = STATUS[value];
  return <span style={{ color: meta.color, background: meta.bg, padding: '4px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 800 }}>{meta.label}</span>;
}

function niceDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export default function ProductRoadmap({ demo = false }: { demo?: boolean }) {
  const [features, setFeatures] = useState<RoadmapFeature[]>(demo ? demoFeatures : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<FeatureDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [testNotes, setTestNotes] = useState('');

  const load = async () => {
    if (demo) return;
    setLoading(true);
    setError('');
    const [featureRes, taskRes, testRes] = await Promise.all([
      supabase.from('roadmap_features').select('*, release:feature_releases(id, released_at, title, commit_hash)').order('updated_at', { ascending: false }),
      supabase.from('roadmap_tasks').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('roadmap_test_runs').select('*').order('tested_at', { ascending: false }),
    ]);
    const firstError = featureRes.error || taskRes.error || testRes.error;
    if (firstError) {
      setError(firstError.message.includes('roadmap_') ? 'The roadmap database migration has not been applied yet.' : firstError.message);
      setLoading(false);
      return;
    }
    const tasks = (taskRes.data ?? []) as RoadmapTask[];
    const runs = (testRes.data ?? []) as TestRun[];
    setFeatures(((featureRes.data ?? []) as Omit<RoadmapFeature, 'tasks' | 'test_runs'>[]).map(feature => ({
      ...feature,
      tasks: tasks.filter(task => task.feature_id === feature.id),
      test_runs: runs.filter(run => run.feature_id === feature.id),
    })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [demo]);

  const selected = editingId && editingId !== 'new' ? features.find(feature => feature.id === editingId) ?? null : null;
  const areas = useMemo(() => Array.from(new Set(features.map(feature => feature.area))).sort(), [features]);
  const activeFeatures = features.filter(feature => !feature.archived);
  const summary = [
    { status: 'idea' as const, label: 'Ideas', color: '#6b7280' },
    { status: 'building' as const, label: 'Building', color: '#2563eb' },
    { status: 'live_test' as const, label: 'Need Testing', color: '#b45309' },
    { status: 'fixes_needed' as const, label: 'Fix needed', color: '#dc2626' },
    { status: 'complete' as const, label: 'Complete', color: '#16a34a' },
  ].map(item => ({ ...item, value: activeFeatures.filter(feature => feature.status === item.status).length }));

  const visibleFeatures = features.filter(feature => {
    if (!showArchived && feature.archived) return false;
    if (showArchived && !feature.archived) return false;
    const haystack = `${feature.title} ${feature.description ?? ''} ${feature.area}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (areaFilter !== 'all' && feature.area !== areaFilter) return false;
    if (statusFilter !== 'all' && feature.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => {
    const order: Record<WorkflowStatus, number> = { fixes_needed: 0, live_test: 1, building: 2, idea: 3, complete: 4 };
    const urgency = (feature: RoadmapFeature) => order[feature.status];
    return urgency(a) - urgency(b) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const openFeature = (feature: RoadmapFeature) => {
    setEditingId(feature.id);
    setDraft({
      title: feature.title, description: feature.description ?? '', status: feature.status,
    });
    setTaskTitle('');
    setTestNotes('');
  };

  const startNew = () => { setEditingId('new'); setDraft(emptyDraft()); setTaskTitle(''); setTestNotes(''); };

  const saveFeature = async () => {
    if (!draft.title.trim()) { setError('A feature title is required.'); return; }
    if (demo) return;
    setSaving(true);
    const payload = {
      ...draft,
      title: draft.title.trim(), description: draft.description.trim() || null, updated_at: new Date().toISOString(),
    };
    if (editingId === 'new') {
      const { data, error: saveError } = await supabase.from('roadmap_features').insert(payload).select('id').single();
      if (saveError) setError(saveError.message); else { await load(); setEditingId(data.id); }
    } else if (editingId) {
      const { error: saveError } = await supabase.from('roadmap_features').update(payload).eq('id', editingId);
      if (saveError) setError(saveError.message); else await load();
    }
    setSaving(false);
  };

  const archiveFeature = async () => {
    if (!selected || demo) return;
    setSaving(true);
    const { error: archiveError } = await supabase.from('roadmap_features')
      .update({ archived: !selected.archived, updated_at: new Date().toISOString() }).eq('id', selected.id);
    if (archiveError) setError(archiveError.message); else { setEditingId(null); await load(); }
    setSaving(false);
  };

  const updateStatus = async (status: WorkflowStatus) => {
    setDraft(current => ({ ...current, status }));
    if (!selected || demo) return;
    setSaving(true);
    const { error: statusError } = await supabase.from('roadmap_features')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', selected.id);
    if (statusError) setError(statusError.message); else await load();
    setSaving(false);
  };

  const touchFeature = async (featureId: string) => {
    await supabase.from('roadmap_features').update({ updated_at: new Date().toISOString() }).eq('id', featureId);
  };

  const addTask = async () => {
    if (!selected || !taskTitle.trim() || demo) return;
    setSaving(true);
    const { error: taskError } = await supabase.from('roadmap_tasks').insert({
      feature_id: selected.id, title: taskTitle.trim(), kind: 'todo', sort_order: selected.tasks.length,
    });
    if (taskError) setError(taskError.message); else { await touchFeature(selected.id); setTaskTitle(''); await load(); }
    setSaving(false);
  };

  const toggleTask = async (task: RoadmapTask) => {
    if (demo) return;
    const { error: taskError } = await supabase.from('roadmap_tasks').update({
      done: !task.done, completed_at: task.done ? null : new Date().toISOString(),
    }).eq('id', task.id);
    if (taskError) setError(taskError.message); else { await touchFeature(task.feature_id); await load(); }
  };

  const removeTask = async (task: RoadmapTask) => {
    if (demo) return;
    const { error: taskError } = await supabase.from('roadmap_tasks').delete().eq('id', task.id);
    if (taskError) setError(taskError.message); else { await touchFeature(task.feature_id); await load(); }
  };

  const recordTest = async (testResult: 'passed' | 'fixes_needed') => {
    if (!selected || demo) return;
    setSaving(true);
    const nextStatus: WorkflowStatus = testResult === 'passed' ? 'complete' : 'fixes_needed';
    const [runRes, featureRes] = await Promise.all([
      supabase.from('roadmap_test_runs').insert({
        feature_id: selected.id, result: testResult, environment: 'Live website', notes: testNotes.trim() || null,
      }),
      supabase.from('roadmap_features').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', selected.id),
    ]);
    const testError = runRes.error || featureRes.error;
    if (testError) {
      setError(testError.message);
    } else {
      if (testResult === 'passed') {
        await supabase.from('roadmap_tasks').update({ done: true, completed_at: new Date().toISOString() })
          .eq('feature_id', selected.id).eq('title', 'Run a live test and record the result').eq('done', false);
      }
      setDraft(current => ({ ...current, status: nextStatus }));
      setTestNotes('');
      await load();
    }
    setSaving(false);
  };

  return (
    <section style={{ marginTop: 48, paddingTop: 34, borderTop: '2px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 850, color: '#111827' }}>Product roadmap</div>
        </div>
        <button style={{ ...buttonStyle(true), padding: '10px 17px', fontSize: 13 }} onClick={startNew}>＋ Add feature</button>
      </div>

      {demo && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #fcd34d', color: '#b45309', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>Roadmap preview — sample data only. Saving is disabled.</div>}
      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 10, marginBottom: 18 }}>
        {summary.map(item => (
          <button key={item.label} onClick={() => {
            setShowArchived(false);
            setStatusFilter(statusFilter === item.status ? 'all' : item.status);
          }} style={{ textAlign: 'left', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '13px 15px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 25, fontWeight: 850, color: item.color, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700, marginTop: 7 }}>{item.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 15, alignItems: 'center' }}>
        <input style={{ ...inputStyle, flex: '1 1 220px' }} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search features, notes or areas…" />
        <select style={{ ...inputStyle, flex: '0 1 160px', width: 'auto' }} value={statusFilter} onChange={event => setStatusFilter(event.target.value as WorkflowStatus | 'all')}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS) as WorkflowStatus[]).map(value => <option key={value} value={value}>{STATUS[value].label}</option>)}
        </select>
        <select style={{ ...inputStyle, flex: '0 1 150px', width: 'auto' }} value={areaFilter} onChange={event => setAreaFilter(event.target.value)}>
          <option value="all">All areas</option>
          {areas.map(area => <option key={area} value={area}>{area}</option>)}
        </select>
        <button style={buttonStyle()} onClick={() => setShowArchived(value => !value)}>{showArchived ? '← Back to active' : 'View archive'}</button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading roadmap…</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {visibleFeatures.map(feature => {
            const done = feature.tasks.filter(task => task.done).length;
            const isRisk = feature.status === 'live_test' || feature.status === 'fixes_needed';
            return (
              <button key={feature.id} onClick={() => openFeature(feature)} style={{
                textAlign: 'left', minHeight: 190, background: '#fff', border: `1.5px solid ${isRisk ? '#fca5a5' : '#e5e7eb'}`,
                borderRadius: 14, padding: 16, cursor: 'pointer', fontFamily: 'inherit', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: '#6b7280', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5 }}>{feature.area} · {TYPE_LABELS[feature.feature_type]}</span>
                  {feature.release && <span title="Created from a git push via the release log" style={{ color: '#6d28d9', background: '#f5f3ff', fontSize: 9.5, fontWeight: 800, borderRadius: 5, padding: '2px 6px', letterSpacing: .4 }}>PUSHED {niceDate(feature.release.released_at).toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{feature.title}</div>
                {feature.description && <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.45, marginTop: 6, maxHeight: 35, overflow: 'hidden' }}>{feature.description}</div>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}><Badge value={feature.status} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 15, paddingTop: 11, borderTop: '1px solid #f1f3f5', color: '#9ca3af', fontSize: 10.5 }}>
                  <span>{feature.tasks.length ? `${done}/${feature.tasks.length} tasks done` : 'No tasks yet'}</span>
                  <span style={{ flex: 1 }} />
                  <span>Updated {niceDate(feature.updated_at)}</span>
                </div>
              </button>
            );
          })}
          {visibleFeatures.length === 0 && <div style={{ gridColumn: '1 / -1', padding: 38, background: '#fff', border: '1.5px dashed #d1d5db', borderRadius: 14, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No roadmap features match these filters.</div>}
        </div>
      )}

      {editingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,24,39,.38)', display: 'flex', justifyContent: 'flex-end' }} onMouseDown={event => { if (event.target === event.currentTarget) setEditingId(null); }}>
          <div style={{ width: 620, maxWidth: '92vw', height: '100%', background: '#f8fafc', boxShadow: '-12px 0 35px rgba(0,0,0,.16)', overflowY: 'auto' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: 'rgba(255,255,255,.96)', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 16, fontWeight: 850, flex: 1 }}>{editingId === 'new' ? 'Add a feature' : 'Feature details'}</div>
              {selected && <button style={buttonStyle()} onClick={archiveFeature}>{selected.archived ? 'Restore' : 'Archive'}</button>}
              <button style={{ ...buttonStyle(), padding: '7px 11px' }} onClick={() => setEditingId(null)}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#6b7280', fontWeight: 800, marginBottom: 6 }}>FEATURE</label>
                <input style={{ ...inputStyle, fontSize: 16, fontWeight: 750 }} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="What are you building or changing?" />
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72, marginTop: 10, lineHeight: 1.5 }} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Add a short note if useful…" />

                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 800, marginTop: 16, marginBottom: 7 }}>STATUS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
                  {(Object.keys(STATUS) as WorkflowStatus[]).map(status => {
                    const meta = STATUS[status];
                    const active = draft.status === status;
                    return (
                      <button key={status} disabled={saving} onClick={() => void updateStatus(status)} style={{
                        border: `1.5px solid ${active ? meta.color : '#e5e7eb'}`, borderRadius: 9, padding: '9px 5px',
                        background: active ? meta.bg : '#fff', color: active ? meta.color : '#6b7280', cursor: saving ? 'wait' : 'pointer',
                        fontSize: 10.5, fontWeight: 800, lineHeight: 1.25, fontFamily: 'inherit',
                      }}>{meta.label}</button>
                    );
                  })}
                </div>
                {selected?.release && (
                  <div style={{ marginTop: 12, padding: '9px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 9, fontSize: 12, color: '#5b21b6', lineHeight: 1.5 }}>
                    Created from a git push on {niceDate(selected.release.released_at)}
                    {selected.release.commit_hash ? <> (commit <code style={{ fontSize: 11 }}>{selected.release.commit_hash}</code>)</> : null}
                    {selected.release.title.trim().toLowerCase() !== selected.title.trim().toLowerCase() ? <> — release log entry: “{selected.release.title}”</> : null}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}><button style={buttonStyle(true)} disabled={saving || demo} onClick={saveFeature}>{saving ? 'Saving…' : editingId === 'new' ? 'Add feature' : 'Save note'}</button></div>
              </div>

              {selected && (
                <>
                  <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 18, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 850, marginBottom: 10 }}>Checklist</div>
                    {selected.tasks.map(task => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderTop: '1px solid #f1f3f5' }}>
                        <input type="checkbox" checked={task.done} onChange={() => toggleTask(task)} />
                        <span style={{ flex: 1, fontSize: 12.5, color: task.done ? '#9ca3af' : '#111827', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
                        <button onClick={() => removeTask(task)} title="Remove task" style={{ border: 'none', background: 'none', color: '#c4c7cc', cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </div>
                    ))}
                    {selected.tasks.length === 0 && <div style={{ color: '#9ca3af', fontSize: 12, padding: '8px 0 12px' }}>No small tasks yet.</div>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      <input style={{ ...inputStyle, flex: '1 1 220px' }} value={taskTitle} onChange={event => setTaskTitle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !saving) void addTask(); }} placeholder="Add something to do…" />
                      <button style={buttonStyle(true)} disabled={!taskTitle.trim() || saving || demo} onClick={addTask}>Add</button>
                    </div>
                  </div>

                  <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 14, fontWeight: 850, marginBottom: 3 }}>Test it</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 10 }}>Add a note only if something is worth remembering.</div>
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 62 }} value={testNotes} onChange={event => setTestNotes(event.target.value)} placeholder="Optional test note…" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 9 }}>
                      <button disabled={saving || demo} onClick={() => void recordTest('passed')} style={{ ...buttonStyle(), padding: '10px 12px', color: '#15803d', borderColor: '#86efac', background: '#f0fdf4' }}>✓ Test passed</button>
                      <button disabled={saving || demo} onClick={() => void recordTest('fixes_needed')} style={{ ...buttonStyle(), padding: '10px 12px', color: '#b91c1c', borderColor: '#fca5a5', background: '#fef2f2' }}>Needs a fix</button>
                    </div>
                    {selected.test_runs.length > 0 && <div style={{ marginTop: 17, fontSize: 11, color: '#6b7280', fontWeight: 800 }}>PAST TESTS</div>}
                    <div style={{ marginTop: selected.test_runs.length > 0 ? 5 : 0 }}>
                      {selected.test_runs.map(run => (
                        <div key={run.id} style={{ padding: '11px 0', borderTop: '1px solid #f1f3f5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 850, color: run.result === 'passed' ? '#15803d' : run.result === 'fixes_needed' ? '#b91c1c' : '#92400e' }}>{run.result === 'passed' ? 'PASSED' : run.result === 'fixes_needed' ? 'FIXES NEEDED' : 'BLOCKED'}</span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{niceDate(run.tested_at)}</span>
                          </div>
                          {run.notes && <div style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.5, marginTop: 5 }}>{run.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
