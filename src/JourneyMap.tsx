// Admin "Map" tab — interactive user-journey maps (React Flow).
//
// Every card (node) is a step in a user journey: a screen the user sees, an
// action they take, something automatic, or a WhatsApp/email that fires.
// Admins can drag cards, draw arrows between them, edit labels/notes, mark a
// step "verified" after testing it, and save. Maps persist in the
// journey_maps table (RLS: is_admin() only). The generated baselines live in
// journeyMapSeeds.ts; "Reset map" restores them.
//
// Loaded lazily from AdminPanel so React Flow never ships in the
// customer-facing bundle.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from './supabase';
import { JOURNEY_MAP_SEEDS, type JourneyKind } from './journeyMapSeeds';
import ProductRoadmap from './ProductRoadmap';
import TodoCard from './TodoCard';

type JourneyNodeData = { label: string; note?: string; kind: JourneyKind; verified?: boolean };
type JourneyNode = Node<JourneyNodeData, 'journey'>;

type MapRow = {
  id: string;
  name: string;
  sort_order: number;
  nodes: JourneyNode[];
  edges: Edge[];
  updated_at?: string;
};

const KIND_META: Record<JourneyKind, { tag: string; bg: string; border: string; tagColor: string; text: string }> = {
  screen:   { tag: '📱 Screen',    bg: '#eff6ff', border: '#93c5fd', tagColor: '#1d4ed8', text: '#111827' },
  action:   { tag: '👆 User does', bg: '#fffbeb', border: '#fcd34d', tagColor: '#b45309', text: '#111827' },
  system:   { tag: '⚙️ Automatic', bg: '#f4f4f5', border: '#d4d4d8', tagColor: '#52525b', text: '#111827' },
  whatsapp: { tag: '💬 WhatsApp',  bg: '#f0fdf4', border: '#86efac', tagColor: '#15803d', text: '#111827' },
  email:    { tag: '✉️ Email',     bg: '#f5f3ff', border: '#c4b5fd', tagColor: '#6d28d9', text: '#111827' },
  status:   { tag: '🏷️ Status',    bg: '#111111', border: '#111111', tagColor: '#a1a1aa', text: '#ffffff' },
  issue:    { tag: '⚠️ Issue',     bg: '#fef2f2', border: '#fca5a5', tagColor: '#b91c1c', text: '#111827' },
};

const KIND_LABELS: Record<JourneyKind, string> = {
  screen: 'Screen the user sees',
  action: 'Something the user does',
  system: 'Automatic (backend/cron)',
  whatsapp: 'WhatsApp message',
  email: 'Email',
  status: 'Booking status',
  issue: 'Issue / to fix',
};

function JourneyNodeCard({ data, selected }: NodeProps<JourneyNode>) {
  const meta = KIND_META[data.kind] ?? KIND_META.system;
  return (
    <div style={{
      width: 210,
      background: meta.bg,
      border: `1.5px solid ${selected ? '#111111' : meta.border}`,
      borderRadius: 12,
      padding: '9px 11px',
      boxShadow: selected ? '0 4px 14px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.07)',
      position: 'relative',
      fontFamily: 'inherit',
    }}>
      {/* Handle declaration order matters: edges saved without an explicit
          handle id attach to the FIRST handle of their type, so the default
          flow direction (top in, bottom out) must be declared first. */}
      <Handle type="target" position={Position.Top} id="t" style={{ opacity: 0.35 }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ opacity: 0.35 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0.35 }} />
      <Handle type="source" position={Position.Left} id="ls" style={{ opacity: 0.35 }} />
      <Handle type="target" position={Position.Right} id="rt" style={{ opacity: 0.35 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, color: meta.tagColor, textTransform: 'uppercase' }}>
          {meta.tag}
        </span>
        {data.verified && (
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#15803d', background: '#dcfce7',
            border: '1px solid #86efac', borderRadius: 20, padding: '1px 6px',
          }}>✓ verified</span>
        )}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, color: meta.text }}>{data.label}</div>
      {data.note && (
        <div style={{ fontSize: 10.5, lineHeight: 1.35, marginTop: 4, color: data.kind === 'status' ? '#d4d4d8' : '#6b7280' }}>
          {data.note}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0.35 }} />
    </div>
  );
}

const nodeTypes = { journey: JourneyNodeCard };

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#9ca3af' },
  style: { stroke: '#9ca3af', strokeWidth: 1.6 },
  labelStyle: { fontSize: 10, fontWeight: 600, fill: '#6b7280' },
  labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
};

// Seed rows are stored without React Flow runtime fields; normalize on load so
// old saves and fresh seeds both render.
function normalizeNodes(nodes: unknown): JourneyNode[] {
  return ((nodes as JourneyNode[]) ?? []).map(node => ({ ...node, type: 'journey' as const }));
}
function normalizeEdges(edges: unknown): Edge[] {
  return ((edges as Edge[]) ?? []).map(edge => ({ ...defaultEdgeOptions, ...edge }));
}

// Strip runtime/selection state before persisting.
function serializeNodes(nodes: JourneyNode[]) {
  return nodes.map(({ id, type, position, data }) => ({
    id, type, position: { x: Math.round(position.x), y: Math.round(position.y) }, data,
  }));
}
function serializeEdges(edges: Edge[]) {
  return edges.map(({ id, source, target, label, sourceHandle, targetHandle }) => ({
    id, source, target,
    ...(label ? { label } : {}),
    ...(sourceHandle ? { sourceHandle } : {}),
    ...(targetHandle ? { targetHandle } : {}),
  }));
}

function JourneyMapInner({ demo, showRoadmap }: { demo?: boolean; showRoadmap?: boolean }) {
  const [maps, setMaps] = useState<MapRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const currentMap = maps.find(m => m.id === currentId) ?? null;
  const selectedNode = nodes.find(nd => nd.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find(ed => ed.id === selectedEdgeId) ?? null;

  // ── Load (and first-time seed) ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (demo) {
        const rows: MapRow[] = JOURNEY_MAP_SEEDS.map((s, i) => ({
          id: `demo-${i}`, name: s.name, sort_order: s.sort_order,
          nodes: normalizeNodes(s.nodes), edges: normalizeEdges(s.edges),
        }));
        setMaps(rows);
        setLoading(false);
        return;
      }
      const { data, error: loadErr } = await supabase
        .from('journey_maps')
        .select('id, name, sort_order, nodes, edges, updated_at')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (loadErr) {
        setError(`Could not load maps: ${loadErr.message}`);
        setLoading(false);
        return;
      }
      let rows = (data ?? []) as MapRow[];
      if (rows.length === 0) {
        // First open: seed the generated maps so there's something to explore.
        const { data: seeded, error: seedErr } = await supabase
          .from('journey_maps')
          .insert(JOURNEY_MAP_SEEDS.map(s => ({
            name: s.name, sort_order: s.sort_order, nodes: s.nodes, edges: s.edges,
          })))
          .select('id, name, sort_order, nodes, edges, updated_at');
        if (cancelled) return;
        if (seedErr) {
          setError(`Could not create the starter maps: ${seedErr.message}`);
          setLoading(false);
          return;
        }
        rows = (seeded ?? []) as MapRow[];
      }
      rows = rows.map(r => ({ ...r, nodes: normalizeNodes(r.nodes), edges: normalizeEdges(r.edges) }));
      setMaps(rows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [demo]);

  // Open the first map once loaded.
  useEffect(() => {
    if (!currentId && maps.length > 0) openMap(maps[0].id, maps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps, currentId]);

  const openMap = (id: string, source?: MapRow[]) => {
    const row = (source ?? maps).find(m => m.id === id);
    if (!row) return;
    setCurrentId(id);
    setNodes(row.nodes);
    setEdges(row.edges);
    setDirty(false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
  };

  const switchMap = (id: string) => {
    if (id === currentId) return;
    if (dirty && !window.confirm('You have unsaved changes on this map. Discard them?')) return;
    openMap(id);
  };

  // ── Canvas change handlers ──────────────────────────────────────────────────
  const onNodesChange = useCallback((changes: NodeChange<JourneyNode>[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
    if (changes.some(c => c.type === 'position' || c.type === 'remove' || c.type === 'add')) setDirty(true);
    for (const c of changes) {
      if (c.type === 'remove') setSelectedNodeId(prev => (prev === c.id ? null : prev));
      if (c.type === 'select') setSelectedNodeId(prev => (c.selected ? c.id : prev === c.id ? null : prev));
    }
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
    if (changes.some(c => c.type === 'remove' || c.type === 'add')) setDirty(true);
    for (const c of changes) {
      if (c.type === 'remove') setSelectedEdgeId(prev => (prev === c.id ? null : prev));
      if (c.type === 'select') setSelectedEdgeId(prev => (c.selected ? c.id : prev === c.id ? null : prev));
    }
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, ...defaultEdgeOptions }, eds));
    setDirty(true);
  }, []);

  // ── Node/edge editing (side panel) ──────────────────────────────────────────
  const patchSelectedNode = (patch: Partial<JourneyNodeData>) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(nd => (nd.id === selectedNodeId ? { ...nd, data: { ...nd.data, ...patch } } : nd)));
    setDirty(true);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setEdges(eds => eds.filter(ed => ed.source !== selectedNodeId && ed.target !== selectedNodeId));
    setNodes(nds => nds.filter(nd => nd.id !== selectedNodeId));
    setSelectedNodeId(null);
    setDirty(true);
  };

  const patchSelectedEdgeLabel = (label: string) => {
    if (!selectedEdgeId) return;
    setEdges(eds => eds.map(ed => (ed.id === selectedEdgeId ? { ...ed, label } : ed)));
    setDirty(true);
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges(eds => eds.filter(ed => ed.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    setDirty(true);
  };

  const addNode = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const position = rect
      ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 })
      : { x: 0, y: 0 };
    const id = `n-${Date.now().toString(36)}`;
    const newNode: JourneyNode = {
      id,
      type: 'journey',
      position,
      data: { label: 'New step', note: '', kind: 'system', verified: false },
      selected: true,
    };
    setNodes(nds => [...nds.map(nd => ({ ...nd, selected: false })), newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setDirty(true);
  };

  // ── Map-level actions ───────────────────────────────────────────────────────
  const saveMap = async () => {
    if (!currentMap || demo) return;
    setSaving(true);
    setError('');
    const payload = {
      nodes: serializeNodes(nodes),
      edges: serializeEdges(edges),
      updated_at: new Date().toISOString(),
    };
    const { error: saveErr } = await supabase.from('journey_maps').update(payload).eq('id', currentMap.id);
    setSaving(false);
    if (saveErr) {
      setError(`Could not save: ${saveErr.message}`);
      return;
    }
    setMaps(ms => ms.map(m => (m.id === currentMap.id ? { ...m, nodes, edges } : m)));
    setDirty(false);
  };

  const resetSeed = maps.length ? JOURNEY_MAP_SEEDS.find(s => s.name === currentMap?.name) : undefined;
  const resetToGenerated = () => {
    if (!resetSeed) return;
    if (!window.confirm('Replace this map with the freshly generated version? Your custom edits to THIS map will be lost when you press Save.')) return;
    setNodes(normalizeNodes(resetSeed.nodes));
    setEdges(normalizeEdges(resetSeed.edges));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setDirty(true);
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
  };

  const addMap = async () => {
    const name = window.prompt('Name for the new map (e.g. "Refund flow"):')?.trim();
    if (!name) return;
    if (demo) return;
    const { data, error: insErr } = await supabase
      .from('journey_maps')
      .insert({ name, sort_order: (maps[maps.length - 1]?.sort_order ?? 0) + 1, nodes: [], edges: [] })
      .select('id, name, sort_order, nodes, edges, updated_at')
      .single();
    if (insErr || !data) {
      setError(`Could not create map: ${insErr?.message ?? 'unknown error'}`);
      return;
    }
    const row = { ...(data as MapRow), nodes: [], edges: [] };
    setMaps(ms => [...ms, row]);
    openMap(row.id, [...maps, row]);
  };

  const renameMap = async () => {
    if (!currentMap || demo) return;
    const name = window.prompt('Rename this map:', currentMap.name)?.trim();
    if (!name || name === currentMap.name) return;
    const { error: renErr } = await supabase.from('journey_maps').update({ name }).eq('id', currentMap.id);
    if (renErr) {
      setError(`Could not rename: ${renErr.message}`);
      return;
    }
    setMaps(ms => ms.map(m => (m.id === currentMap.id ? { ...m, name } : m)));
  };

  const deleteMap = async () => {
    if (!currentMap || demo) return;
    if (!window.confirm(`Delete the map "${currentMap.name}"? This cannot be undone.`)) return;
    const { error: delErr } = await supabase.from('journey_maps').delete().eq('id', currentMap.id);
    if (delErr) {
      setError(`Could not delete: ${delErr.message}`);
      return;
    }
    const remaining = maps.filter(m => m.id !== currentMap.id);
    setMaps(remaining);
    setCurrentId(null);
    setNodes([]);
    setEdges([]);
    setDirty(false);
    if (remaining.length) openMap(remaining[0].id, remaining);
  };

  // ── Styles (match AdminPanel's inline-style look) ───────────────────────────
  const btn = (primary?: boolean, disabled?: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 10,
    border: primary ? 'none' : '1.5px solid #e0e0e0',
    background: primary ? '#111111' : '#ffffff',
    color: primary ? '#ffffff' : '#374151',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    whiteSpace: 'nowrap',
  });
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '7px 13px',
    borderRadius: 20,
    border: active ? '1.5px solid #111111' : '1.5px solid #e0e0e0',
    background: active ? '#111111' : '#ffffff',
    color: active ? '#ffffff' : '#374151',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });
  const field: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 12.5,
    background: '#fafafa',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading maps…</div>;

  return (
    <div>
      {/* Map picker + actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {maps.map(m => (
          <button key={m.id} style={chip(m.id === currentId)} onClick={() => switchMap(m.id)}>{m.name}</button>
        ))}
        <button style={btn()} onClick={addMap}>＋ New map</button>
        <div style={{ flex: 1 }} />
        <button style={btn()} onClick={addNode}>＋ Add step</button>
        {resetSeed && <button style={btn()} onClick={resetToGenerated}>↺ Reset map</button>}
        <button style={btn()} onClick={renameMap}>✎</button>
        <button style={btn()} onClick={deleteMap}>🗑</button>
        <button style={btn(true, !dirty || saving)} disabled={!dirty || saving} onClick={saveMap}>
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved ✓'}
        </button>
      </div>

      {/* Legend + hint */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        {(Object.keys(KIND_META) as JourneyKind[]).map(k => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: '#6b7280' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: KIND_META[k].bg, border: `1.5px solid ${KIND_META[k].border}` }} />
            {KIND_META[k].tag.replace(/^\S+\s/, '')}
          </span>
        ))}
        <span style={{ fontSize: 10.5, color: '#9ca3af' }}>
          Tap a card to edit it · drag from a card's edge to draw an arrow · pinch/scroll to zoom
        </span>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
          {error}
        </div>
      )}
      {demo && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #fcd34d', color: '#b45309', fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
          Preview mode — showing the generated maps; saving is disabled.
        </div>
      )}

      {/* Canvas + editor panel */}
      <div ref={wrapperRef} style={{ position: 'relative', height: 'min(72vh, 760px)', border: '1.5px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', background: '#fafafa' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={22} color="#e5e7eb" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            style={{ width: 140, height: 100 }}
            nodeColor={(nd) => KIND_META[(nd.data as JourneyNodeData)?.kind ?? 'system']?.border ?? '#d4d4d8'}
          />
        </ReactFlow>

        {(selectedNode || selectedEdge) && (
          <div style={{
            position: 'absolute', right: 10, bottom: 10, width: 'min(300px, calc(100% - 20px))',
            background: '#ffffff', border: '1.5px solid #e0e0e0', borderRadius: 14,
            boxShadow: '0 8px 26px rgba(0,0,0,0.13)', padding: 14, zIndex: 10,
          }}>
            {selectedNode && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>Edit step</span>
                  <button
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af' }}
                    onClick={() => setNodes(nds => nds.map(nd => ({ ...nd, selected: false })))}
                  >✕</button>
                </div>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Type</label>
                <select
                  style={{ ...field, marginBottom: 10 }}
                  value={selectedNode.data.kind}
                  onChange={ev => patchSelectedNode({ kind: ev.target.value as JourneyKind })}
                >
                  {(Object.keys(KIND_LABELS) as JourneyKind[]).map(k => (
                    <option key={k} value={k}>{KIND_LABELS[k]}</option>
                  ))}
                </select>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Title</label>
                <textarea
                  style={{ ...field, marginBottom: 10, resize: 'vertical' }}
                  rows={2}
                  value={selectedNode.data.label}
                  onChange={ev => patchSelectedNode({ label: ev.target.value })}
                />
                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Note (what exactly happens)</label>
                <textarea
                  style={{ ...field, marginBottom: 10, resize: 'vertical' }}
                  rows={3}
                  value={selectedNode.data.note ?? ''}
                  onChange={ev => patchSelectedNode({ note: ev.target.value })}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!selectedNode.data.verified}
                    onChange={ev => patchSelectedNode({ verified: ev.target.checked })}
                  />
                  Tested & verified end-to-end
                </label>
                <button style={{ ...btn(), color: '#b91c1c', borderColor: '#fca5a5', width: '100%' }} onClick={deleteSelectedNode}>
                  Delete this step
                </button>
              </>
            )}
            {!selectedNode && selectedEdge && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>Edit arrow</span>
                  <button
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af' }}
                    onClick={() => setEdges(eds => eds.map(ed => ({ ...ed, selected: false })))}
                  >✕</button>
                </div>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 4 }}>Label (when does this happen?)</label>
                <input
                  style={{ ...field, marginBottom: 12 }}
                  value={typeof selectedEdge.label === 'string' ? selectedEdge.label : ''}
                  onChange={ev => patchSelectedEdgeLabel(ev.target.value)}
                  placeholder="e.g. unpaid for 1 h"
                />
                <button style={{ ...btn(), color: '#b91c1c', borderColor: '#fca5a5', width: '100%' }} onClick={deleteSelectedEdge}>
                  Delete this arrow
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* These are intentionally separate sections below the canvas, so they
          cannot alter map state, controls, dimensions or gesture handling. */}
      {(showRoadmap || demo) && <TodoCard demo={demo} />}
      {(showRoadmap || demo) && <ProductRoadmap demo={demo} />}
    </div>
  );
}

export default function JourneyMap({ demo, showRoadmap }: { demo?: boolean; showRoadmap?: boolean }) {
  return (
    <ReactFlowProvider>
      <JourneyMapInner demo={demo} showRoadmap={showRoadmap} />
    </ReactFlowProvider>
  );
}
