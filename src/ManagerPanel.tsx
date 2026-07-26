// Manager tab — read-only operations manager. A pg_cron job evaluates
// `manager_rules` daily at 6pm IST, raises/updates `manager_alerts`, and logs
// one row per day to `manager_briefings` for the daily push record. This panel
// reads the active alerts and rules, and lets the admin acknowledge/snooze/
// dismiss alerts and tune the rules —
// it never messages customers or changes anything on its own.
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Severity = 'urgent' | 'warning' | 'win' | 'info';
type Cadence = 'daily' | 'weekly';
type AlertStatus = 'open' | 'acknowledged' | 'snoozed' | 'dismissed' | 'resolved';

type ManagerRule = {
  id: string;
  rule_type: string;
  label: string;
  description: string | null;
  params: Record<string, unknown>;
  severity: Severity;
  cadence: Cadence;
  cooldown_days: number;
  enabled: boolean;
  template: string;
  sort_order: number;
  updated_at: string;
};

type ManagerAlert = {
  id: string;
  rule_id: string | null;
  rule_type: string;
  fingerprint: string;
  severity: Severity;
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: AlertStatus;
  snoozed_until: string | null;
  first_raised_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  briefing_day: string | null;
};

function normalizeRule(row: Record<string, unknown>): ManagerRule {
  return {
    id: String(row.id),
    rule_type: String(row.rule_type),
    label: String(row.label),
    description: row.description ? String(row.description) : null,
    params: (row.params && typeof row.params === 'object' ? row.params : {}) as Record<string, unknown>,
    severity: (row.severity as Severity) ?? 'info',
    cadence: (row.cadence as Cadence) ?? 'daily',
    cooldown_days: Number(row.cooldown_days) || 0,
    enabled: Boolean(row.enabled),
    template: row.template ? String(row.template) : '',
    sort_order: Number(row.sort_order) || 0,
    updated_at: String(row.updated_at),
  };
}

function normalizeAlert(row: Record<string, unknown>): ManagerAlert {
  return {
    id: String(row.id),
    rule_id: row.rule_id ? String(row.rule_id) : null,
    rule_type: String(row.rule_type),
    fingerprint: String(row.fingerprint),
    severity: (row.severity as Severity) ?? 'info',
    title: String(row.title),
    body: String(row.body ?? ''),
    data: (row.data && typeof row.data === 'object' ? row.data : {}) as Record<string, unknown>,
    status: (row.status as AlertStatus) ?? 'open',
    snoozed_until: row.snoozed_until ? String(row.snoozed_until) : null,
    first_raised_at: String(row.first_raised_at),
    last_seen_at: String(row.last_seen_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    briefing_day: row.briefing_day ? String(row.briefing_day) : null,
  };
}

function niceDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function humanizeKey(key: string) {
  return key
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace(/\bPct\b/i, '%');
}

const SEVERITY_META: Record<Severity, { label: string; color: string; soft: string }> = {
  urgent: { label: 'Urgent', color: '#b91c1c', soft: '#fef2f2' },
  warning: { label: 'Watch', color: '#b45309', soft: '#fffbeb' },
  win: { label: 'Win', color: '#15803d', soft: '#f0fdf4' },
  info: { label: 'Info', color: '#374151', soft: '#f3f4f6' },
};

const GROUPS: { severity: Severity; heading: string }[] = [
  { severity: 'urgent', heading: '🚨 Urgent' },
  { severity: 'warning', heading: '👀 Watch' },
  { severity: 'win', heading: '🏆 Wins' },
  { severity: 'info', heading: 'ℹ️ Info' },
];

const CARD: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 13, padding: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,.03)',
};

const button = (primary = false): React.CSSProperties => ({
  border: primary ? '1.5px solid #111827' : '1.5px solid #e5e7eb', borderRadius: 8,
  padding: '6px 11px', background: primary ? '#111827' : '#fff', color: primary ? '#fff' : '#374151',
  fontSize: 11.5, fontWeight: 750, cursor: 'pointer', fontFamily: 'inherit',
});

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: '1.5px solid #e5e7eb', borderRadius: 9,
  padding: '8px 10px', fontSize: 12.5, fontFamily: 'inherit', color: '#111827', background: '#fff', outline: 'none',
};

const SHOWN_PER_GROUP = 7;

function AlertCard({ alert, onAcknowledge, onSnooze, onDismiss }: {
  alert: ManagerAlert;
  onAcknowledge: (a: ManagerAlert) => void;
  onSnooze: (a: ManagerAlert, days: number) => void;
  onDismiss: (a: ManagerAlert) => void;
}) {
  const muted = alert.status === 'snoozed';
  return (
    <div style={{ ...CARD, opacity: muted ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827', lineHeight: 1.35 }}>{alert.title}</div>
          {alert.body && <div style={{ marginTop: 5, fontSize: 12.5, color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{alert.body}</div>}
        </div>
        {alert.status === 'acknowledged' && (
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#eff6ff', color: '#2563eb' }}>✓ Acked</span>
        )}
        {alert.status === 'snoozed' && (
          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280' }}>
            😴 until {alert.snoozed_until ? niceDate(alert.snoozed_until) : '—'}
          </span>
        )}
      </div>
      <div style={{ marginTop: 9, fontSize: 10.5, color: '#9ca3af' }}>
        first raised {niceDate(alert.first_raised_at)} · last seen {niceDate(alert.last_seen_at)}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {alert.status !== 'acknowledged' && <button style={button()} onClick={() => onAcknowledge(alert)}>✓ Acknowledge</button>}
        <button style={button()} onClick={() => onSnooze(alert, 3)}>Snooze 3d</button>
        <button style={button()} onClick={() => onSnooze(alert, 7)}>Snooze 7d</button>
        <button style={{ ...button(), color: '#b91c1c' }} onClick={() => onDismiss(alert)}>✕ Dismiss</button>
      </div>
    </div>
  );
}

function TodaysBrief({ refreshKey = 0 }: { refreshKey?: number }) {
  const [alerts, setAlerts] = useState<ManagerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<Severity, boolean>>({ urgent: false, warning: false, win: false, info: false });

  const load = async () => {
    setLoading(true);
    setError('');
    const [{ data: alertData, error: alertError }, { data: ruleData, error: ruleError }] = await Promise.all([
      supabase
        .from('manager_alerts')
        .select('id, rule_id, rule_type, fingerprint, severity, title, body, data, status, snoozed_until, first_raised_at, last_seen_at, resolved_at, briefing_day')
        .in('status', ['open', 'acknowledged', 'snoozed'])
        .order('last_seen_at', { ascending: false }),
      supabase.from('manager_rules').select('id, enabled'),
    ]);
    const loadError = alertError || ruleError;
    if (loadError) {
      setError(loadError.message.includes('manager_alerts') || loadError.message.includes('manager_rules') ? 'The manager database migration has not been applied yet.' : loadError.message);
    } else {
      const enabledRuleIds = new Set((ruleData ?? []).filter(rule => Boolean(rule.enabled)).map(rule => String(rule.id)));
      setAlerts((alertData ?? []).filter(alert => alert.rule_id && enabledRuleIds.has(String(alert.rule_id))).map(normalizeAlert));
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [refreshKey]);

  const applyUpdate = async (alert: ManagerAlert, patch: Partial<ManagerAlert>, removeFromList: boolean) => {
    const previous = alerts;
    if (removeFromList) {
      setAlerts(current => current.filter(item => item.id !== alert.id));
    } else {
      setAlerts(current => current.map(item => item.id === alert.id ? { ...item, ...patch } : item));
    }
    const dbPatch: Record<string, unknown> = {};
    if ('status' in patch) dbPatch.status = patch.status;
    if ('snoozed_until' in patch) dbPatch.snoozed_until = patch.snoozed_until;
    const { error: updateError } = await supabase.from('manager_alerts').update(dbPatch).eq('id', alert.id);
    if (updateError) {
      setAlerts(previous);
      setError(updateError.message);
    }
  };

  const onAcknowledge = (alert: ManagerAlert) => void applyUpdate(alert, { status: 'acknowledged' }, false);
  const onSnooze = (alert: ManagerAlert, days: number) => {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    void applyUpdate(alert, { status: 'snoozed', snoozed_until: until }, false);
  };
  const onDismiss = (alert: ManagerAlert) => void applyUpdate(alert, { status: 'dismissed' }, true);

  const severityRank: Record<Severity, number> = { urgent: 0, warning: 1, win: 2, info: 3 };
  const sorted = [...alerts].sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());

  return (
    <div>
      {error && <div style={{ padding: '9px 12px', borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', fontSize: 12, marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>Loading brief…</div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: '26px 14px', textAlign: 'center', color: '#9ca3af', fontSize: 12.5, border: '1.5px dashed #d1d5db', borderRadius: 12 }}>
          All clear — the manager found nothing that needs you. Next check runs 6pm.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {GROUPS.map(group => {
            const items = sorted.filter(a => a.severity === group.severity);
            if (items.length === 0) return null;
            const isExpanded = expanded[group.severity];
            const shown = isExpanded ? items : items.slice(0, SHOWN_PER_GROUP);
            const hiddenCount = items.length - shown.length;
            return (
              <div key={group.severity}>
                <div style={{ fontSize: 13, fontWeight: 850, color: '#111827', marginBottom: 8 }}>{group.heading}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {shown.map(alert => (
                    <React.Fragment key={alert.id}>
                      <AlertCard alert={alert} onAcknowledge={onAcknowledge} onSnooze={onSnooze} onDismiss={onDismiss} />
                    </React.Fragment>
                  ))}
                </div>
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setExpanded(current => ({ ...current, [group.severity]: true }))}
                    style={{ border: 'none', background: 'none', padding: '9px 2px 0', color: '#6b7280', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Show {hiddenCount} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type RuleDraft = {
  enabled: boolean;
  severity: Severity;
  cadence: Cadence;
  cooldown_days: number;
  params: Record<string, unknown>;
  template: string;
};

function draftFromRule(rule: ManagerRule): RuleDraft {
  return { enabled: rule.enabled, severity: rule.severity, cadence: rule.cadence, cooldown_days: rule.cooldown_days, params: { ...rule.params }, template: rule.template };
}

function isDirty(rule: ManagerRule, draft: RuleDraft) {
  return rule.enabled !== draft.enabled
    || rule.severity !== draft.severity
    || rule.cadence !== draft.cadence
    || rule.cooldown_days !== draft.cooldown_days
    || rule.template !== draft.template
    || JSON.stringify(rule.params) !== JSON.stringify(draft.params);
}

function RuleCard({ rule, onSaved }: { rule: ManagerRule; onSaved: (updated: ManagerRule) => void }) {
  const [draft, setDraft] = useState<RuleDraft>(draftFromRule(rule));
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null);
  const [flashMsg, setFlashMsg] = useState('');

  useEffect(() => { setDraft(draftFromRule(rule)); }, [rule]);

  const dirty = isDirty(rule, draft);

  const save = async () => {
    setSaving(true);
    setFlash(null);
    const payload = {
      enabled: draft.enabled,
      severity: draft.severity,
      cadence: draft.cadence,
      cooldown_days: draft.cooldown_days,
      params: draft.params,
      template: draft.template,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('manager_rules').update(payload).eq('id', rule.id);
    setSaving(false);
    if (error) {
      setFlash('err');
      setFlashMsg(error.message);
    } else {
      setFlash('ok');
      onSaved({ ...rule, ...payload });
      setTimeout(() => setFlash(null), 2000);
    }
  };

  const paramEntries = Object.entries(draft.params);

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#111827' }}>{rule.label}</div>
          <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#9ca3af', marginTop: 2 }}>{rule.rule_type}</div>
          {rule.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5, lineHeight: 1.45 }}>{rule.description}</div>}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 11.5, color: '#374151', fontWeight: 700, cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} style={{ width: 15, height: 15, accentColor: '#111827' }} />
          Enabled
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 800, marginBottom: 4 }}>SEVERITY</div>
          <select style={field} value={draft.severity} onChange={e => setDraft({ ...draft, severity: e.target.value as Severity })}>
            <option value="urgent">Urgent</option>
            <option value="warning">Warning</option>
            <option value="win">Win</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 800, marginBottom: 4 }}>CADENCE</div>
          <select style={field} value={draft.cadence} onChange={e => setDraft({ ...draft, cadence: e.target.value as Cadence })}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 800, marginBottom: 4 }}>COOLDOWN (DAYS)</div>
          <input type="number" min={0} style={field} value={draft.cooldown_days} onChange={e => setDraft({ ...draft, cooldown_days: Number(e.target.value) || 0 })} />
        </div>
      </div>

      {paramEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
          {paramEntries.map(([key, value]) => {
            const isNumber = typeof value === 'number';
            return (
              <div key={key}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 800, marginBottom: 4 }}>{humanizeKey(key).toUpperCase()}</div>
                {isNumber ? (
                  <input
                    type="number"
                    style={field}
                    value={value as number}
                    onChange={e => setDraft({ ...draft, params: { ...draft.params, [key]: Number(e.target.value) || 0 } })}
                  />
                ) : (
                  <div style={{ ...field, background: '#f8fafc', color: '#6b7280', fontFamily: 'monospace', fontSize: 11 }}>{JSON.stringify(value)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 800, marginBottom: 4 }}>MESSAGE TEMPLATE</div>
        <textarea
          rows={3}
          style={{ ...field, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5 }}
          value={draft.template}
          onChange={e => setDraft({ ...draft, template: e.target.value })}
        />
        <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 4 }}>Placeholders like {'{n}'}, {'{event}'} get filled in automatically.</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, minHeight: 26 }}>
        {dirty && (
          <button style={button(true)} disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button>
        )}
        {flash === 'ok' && <span style={{ color: '#15803d', fontSize: 12, fontWeight: 700 }}>Saved ✓</span>}
        {flash === 'err' && <span style={{ color: '#b91c1c', fontSize: 12 }}>{flashMsg}</span>}
      </div>
    </div>
  );
}

function Rulebook({ onRuleSaved }: { onRuleSaved?: () => void }) {
  const [rules, setRules] = useState<ManagerRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      const { data, error: loadError } = await supabase
        .from('manager_rules')
        .select('id, rule_type, label, description, params, severity, cadence, cooldown_days, enabled, template, sort_order, updated_at')
        .order('sort_order', { ascending: true });
      if (loadError) {
        setError(loadError.message.includes('manager_rules') ? 'The manager database migration has not been applied yet.' : loadError.message);
      } else {
        setRules((data ?? []).map(normalizeRule));
      }
      setLoading(false);
    })();
  }, []);

  const onSaved = (updated: ManagerRule) => {
    setRules(current => current.map(r => r.id === updated.id ? updated : r));
    onRuleSaved?.();
  };

  return (
    <div>
      <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6, marginTop: 0, marginBottom: 16, maxWidth: 640 }}>
        The manager checks these rules every evening at 6pm and only reports what it finds here, plus one push
        notification — it never messages customers or changes anything on its own. Turn a rule off if it's noisy,
        or adjust its thresholds below.
      </p>
      {error && <div style={{ padding: '9px 12px', borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#b91c1c', fontSize: 12, marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 12.5 }}>Loading rulebook…</div>
      ) : rules.length === 0 && !error ? (
        <div style={{ padding: '26px 14px', textAlign: 'center', color: '#9ca3af', fontSize: 12.5, border: '1.5px dashed #d1d5db', borderRadius: 12 }}>No rules configured yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rules.map(rule => <React.Fragment key={rule.id}><RuleCard rule={rule} onSaved={onSaved} /></React.Fragment>)}
        </div>
      )}
    </div>
  );
}

// Global on/off for the 6pm brief. Writes manager_settings.daily_briefings_enabled
// (is_admin_strict RLS); the pg_cron wrapper run_daily_manager_brief() early-returns
// when this is off, so no brief is generated and no push fires.
function BriefingToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('manager_settings').select('daily_briefings_enabled').maybeSingle();
      if (!cancelled) setEnabled(data ? Boolean(data.daily_briefings_enabled) : true);
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = async (next: boolean) => {
    const prev = enabled;
    setEnabled(next);
    setSaving(true);
    const { error } = await supabase.from('manager_settings').update({ daily_briefings_enabled: next, updated_at: new Date().toISOString() }).eq('id', true);
    setSaving(false);
    if (error) { setEnabled(prev); alert('Could not update: ' + error.message); }
  };

  if (enabled === null) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: enabled ? '#f9fafb' : '#fef2f2', border: '1.5px solid ' + (enabled ? '#e5e7eb' : '#fecaca'), borderRadius: 12, marginBottom: 24 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Daily 6pm briefing</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
          {enabled ? 'On — the evening brief lands here and sends one push.' : 'Off — no evening brief and no push. Turn it back on anytime.'}
        </div>
      </div>
      <button type="button" role="switch" aria-checked={enabled} aria-label="Daily 6pm briefing" disabled={saving} onClick={() => void toggle(!enabled)}
        style={{ position: 'relative', width: 46, height: 26, borderRadius: 999, border: 'none', cursor: saving ? 'wait' : 'pointer', background: enabled ? '#111827' : '#d1d5db', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: enabled ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </button>
    </div>
  );
}

export default function ManagerPanel() {
  const [rulesVersion, setRulesVersion] = useState(0);

  return (
    <div>
      <div style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 850, color: '#111827', marginBottom: 4 }}>Manager</div>
      <div style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 24 }}>
        Your read-only operations manager — checks the business every evening at 6pm and reports here + one push.
      </div>

      <BriefingToggle />

      <section>
        <div style={{ fontSize: 16, fontWeight: 850, color: '#111827', marginBottom: 12 }}>Today's brief</div>
        <TodaysBrief refreshKey={rulesVersion} />
      </section>

      <section style={{ marginTop: 34, paddingTop: 28, borderTop: '2px solid #e5e7eb' }}>
        <div style={{ fontSize: 16, fontWeight: 850, color: '#111827', marginBottom: 12 }}>Rulebook</div>
        <Rulebook onRuleSaved={() => setRulesVersion(current => current + 1)} />
      </section>
    </div>
  );
}
