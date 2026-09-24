import Link from "next/link";
import { notFound } from "next/navigation";

import { RuleWorkspace } from "@/components/consortium-engine/rule-workspace";
import { diffRules } from "@/lib/consortium-engine/rule-diff.ts";
import { computeRuleHash, validateRuleConfig } from "@/lib/consortium-engine/rules.ts";
import { getEngineRule, listAssemblies, listEngineEvents, listEngineGroups, listEngineRules } from "@/lib/data/consortium-engine";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function RegraMotorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organizationId, role } = await requireActiveMembership();
  const rule = await getEngineRule(organizationId, id);
  if (!rule) notFound();
  const [allRules, groups, assemblies, events] = await Promise.all([
    listEngineRules(organizationId),
    listEngineGroups(organizationId),
    listAssemblies(organizationId),
    listEngineEvents(organizationId, { entityId: id, limit: 40 }),
  ]);
  const versions = allRules.filter((r) => r.ruleKey === rule.ruleKey).sort((a, b) => b.version - a.version);
  const previous = versions.find((v) => v.version < rule.version) ?? null;
  const diff = previous ? diffRules(previous, rule) : [];
  const usedBy = assemblies
    .filter((a) => versions.some((v) => v.id === a.ruleId))
    .map((a) => ({ ...a, version: versions.find((v) => v.id === a.ruleId)!.version }));
  const hashCheck = rule.ruleHash ? computeRuleHash(rule) === rule.ruleHash : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:p-6">
        <Link href="/consorcios/motor" className="text-label font-bold uppercase text-primary hover:underline">
          Motor de apuração
        </Link>
        <h1 className="text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          {rule.name} <span className="text-secondary-foreground/60">v{rule.version}</span>
        </h1>
        <p className="text-body text-secondary-foreground/75">
          {rule.ruleKey} · {rule.administratorName} {rule.regulationReference ? `· ${rule.regulationReference}` : ""}
        </p>
      </section>
      <RuleWorkspace
        rule={rule}
        role={role}
        groups={groups}
        versions={versions}
        previous={previous}
        diff={diff}
        usedBy={usedBy}
        events={events}
        validationErrors={validateRuleConfig(rule.config)}
        hashCheck={hashCheck}
      />
    </div>
  );
}
