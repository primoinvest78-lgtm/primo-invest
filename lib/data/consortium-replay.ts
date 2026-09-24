import {
  compareRuns,
  runBids,
  runDraw,
  type BidInput,
  type DrawRule,
  type EligibilitySnapshot,
  type LotteryResult,
  type RunOutput,
} from "@/lib/consortium-engine/index.ts";
import type { DrawInput } from "@/lib/consortium-engine/draw.ts";
import { latestSnapshot, type AssemblySnapshot, type AssemblyWorkspace, type DrawRunRecord } from "@/lib/data/consortium-engine";

/**
 * Replay — reconstrói o input do motor SÓ a partir dos snapshots
 * congelados e reexecuta. Compartilhado por actions, monitoramento e
 * ferramentas da inteligência (uma única implementação).
 */

export type SnapshotSet = { eligibility: AssemblySnapshot; rule: AssemblySnapshot; lottery: AssemblySnapshot; resources: AssemblySnapshot };

export function snapshotsById(ws: AssemblyWorkspace, ids: Record<string, string>): SnapshotSet | null {
  const find = (id: string | undefined) => ws.snapshots.find((s) => s.id === id);
  const eligibility = find(ids.eligibility);
  const rule = find(ids.rule);
  const lottery = find(ids.lottery);
  const resources = find(ids.resources);
  if (!eligibility || !rule || !lottery || !resources) return null;
  return { eligibility, rule, lottery, resources };
}

export function latestSet(ws: AssemblyWorkspace): SnapshotSet | null {
  const eligibility = latestSnapshot(ws.snapshots, "ELIGIBILITY");
  const rule = latestSnapshot(ws.snapshots, "RULE");
  const lottery = latestSnapshot(ws.snapshots, "LOTTERY");
  const resources = latestSnapshot(ws.snapshots, "RESOURCES");
  if (!eligibility || !rule || !lottery || !resources) return null;
  return { eligibility, rule, lottery, resources };
}

/** Monta o input do motor SÓ a partir dos snapshots — nunca do estado atual. */
export function drawInputFromSnapshots(set: SnapshotSet): DrawInput {
  const rulePayload = set.rule.payload as { rule: DrawRule; ruleHash: string };
  const context = set.resources.payload as Pick<DrawInput, "assembly" | "group" | "resources">;
  return {
    assembly: context.assembly,
    group: context.group,
    rule: rulePayload.rule,
    frozenRuleHash: rulePayload.ruleHash,
    lottery: (set.lottery.payload as { lottery: LotteryResult }).lottery,
    eligibility: (set.eligibility.payload as { snapshot: EligibilitySnapshot }).snapshot,
    resources: context.resources,
  };
}

export function currentRun(ws: AssemblyWorkspace, phase: "DRAW" | "BIDS"): DrawRunRecord | null {
  return ws.runs.find((r) => r.phase === phase && r.status === "CURRENT") ?? null;
}

export function bidsInputFor(ws: AssemblyWorkspace, set: SnapshotSet, drawRun: { contemplations: { quotaNumber: number }[]; resultHash: string; remaining: number }, bids: BidInput[]) {
  const draw = drawInputFromSnapshots(set);
  return {
    assembly: { id: draw.assembly.id, number: draw.assembly.number, date: draw.assembly.date },
    group: { id: draw.group.id, numbering: draw.group.numbering },
    rule: draw.rule,
    lottery: draw.lottery,
    eligibility: draw.eligibility,
    drawContemplatedQuotas: drawRun.contemplations.map((c) => c.quotaNumber),
    drawResultHash: drawRun.resultHash,
    remainingResources: drawRun.remaining,
    creditAmount: draw.resources.creditAmount ?? 0,
    bids,
  };
}

export type ReproductionReport = {
  runId: string;
  phase: "DRAW" | "BIDS";
  identical: boolean;
  hashDiffs: string[];
  added: number[];
  removed: number[];
  storedResultHash: string;
  reproducedResultHash: string;
};

export function reproduceInWorkspace(ws: AssemblyWorkspace, runId: string): ReproductionReport | null {
  const stored = ws.runs.find((r) => r.id === runId);
  if (!stored) return null;
  const set = snapshotsById(ws, stored.snapshotIds);
  if (!set) return null;
  let out: RunOutput;
  if (stored.phase === "DRAW") {
    out = runDraw(drawInputFromSnapshots(set));
  } else {
    const parent = ws.runs.find((r) => r.id === stored.parentRunId);
    const bidsSnap = ws.snapshots.find((s) => s.id === stored.snapshotIds.bids);
    if (!parent || !bidsSnap) return null;
    out = runBids(
      bidsInputFor(
        ws,
        set,
        { contemplations: parent.result.contemplations, resultHash: parent.hashes.resultHash, remaining: parent.result.remainingResources },
        (bidsSnap.payload as { bids: BidInput[] }).bids,
      ),
    );
  }
  const cmp = compareRuns({ hashes: stored.hashes, contemplations: stored.result.contemplations }, out);
  return {
    runId,
    phase: stored.phase,
    identical: cmp.identical,
    hashDiffs: cmp.hashDiffs,
    added: cmp.added,
    removed: cmp.removed,
    storedResultHash: stored.hashes.resultHash,
    reproducedResultHash: out.hashes.resultHash,
  };
}

