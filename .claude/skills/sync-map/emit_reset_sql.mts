// emit_reset_sql.mts — emit "Reset map" UPDATE SQL for the admin Journey-Map tab.
//
// Reproduces EXACTLY what JourneyMap.tsx's Reset-to-generated + Save writes into
// the journey_maps table, so the live admin Map tab can be synced from here (the
// admin UI is login-gated and not drivable). Serialization mirrors
// serializeNodes / serializeEdges in src/JourneyMap.tsx:
//   node -> { id, type:'journey', position:{ x:round, y:round }, data }
//   edge -> { id, source, target, label?, sourceHandle?, targetHandle? }
// Rows are keyed on the map NAME (stable across resets) and dollar-quoted so no
// SQL escaping is ever needed.
//
// Usage (run from repo root so node_modules resolves):
//   node_modules/.bin/tsx .claude/skills/sync-map/emit_reset_sql.mts all           > out.sql
//   node_modules/.bin/tsx .claude/skills/sync-map/emit_reset_sql.mts "Invite"      > out.sql
//   node_modules/.bin/tsx .claude/skills/sync-map/emit_reset_sql.mts "Invite" "Behind"

import { JOURNEY_MAP_SEEDS } from '../../../src/journeyMapSeeds.ts';

const args = process.argv.slice(2);
const wantAll = args.length === 0 || args.includes('all');
const seeds = JOURNEY_MAP_SEEDS.filter(
  (s) => wantAll || args.some((a) => s.name.toLowerCase().includes(a.toLowerCase())),
);
if (seeds.length === 0) {
  console.error('No seed map matched:', args.join(' '));
  console.error('Available:', JOURNEY_MAP_SEEDS.map((s) => s.name).join(' | '));
  process.exit(1);
}

const stmts: string[] = [];
for (const s of seeds) {
  const nodes = s.nodes.map(({ id, type, position, data }: any) => ({
    id,
    type,
    position: { x: Math.round(position.x), y: Math.round(position.y) },
    data,
  }));
  const edges = s.edges.map(({ id, source, target, label, sourceHandle, targetHandle }: any) => ({
    id,
    source,
    target,
    ...(label ? { label } : {}),
    ...(sourceHandle ? { sourceHandle } : {}),
    ...(targetHandle ? { targetHandle } : {}),
  }));
  const nJson = JSON.stringify(nodes);
  const eJson = JSON.stringify(edges);
  if ([nJson, eJson, s.name].some((x) => x.includes('$j$') || x.includes('$n$'))) {
    throw new Error(`dollar-tag collision in map "${s.name}" — pick different quote tags`);
  }
  stmts.push(
    `UPDATE journey_maps SET ` +
      `nodes = $j$${nJson}$j$::jsonb, ` +
      `edges = $j$${eJson}$j$::jsonb, ` +
      `updated_at = now() ` +
      `WHERE name = $n$${s.name}$n$;`,
  );
}
process.stdout.write(stmts.join('\n') + '\n');
process.stderr.write(
  `emitted ${stmts.length} UPDATE(s): ${seeds.map((s) => `${s.name} [${s.nodes.length}n/${s.edges.length}e]`).join(' | ')}\n`,
);
