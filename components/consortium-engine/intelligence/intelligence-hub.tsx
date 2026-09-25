"use client";

import { useState } from "react";

import { scrollToId } from "@/components/ui/panel-action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentsPanel, NumberAnalysisPanel } from "@/components/consortium-engine/intelligence/analysis-panels";
import { AssistantPanel } from "@/components/consortium-engine/intelligence/assistant-panel";
import { AutomationPanel } from "@/components/consortium-engine/intelligence/automation-panel";
import { DocumentPanel } from "@/components/consortium-engine/intelligence/document-panel";
import { FindingsPanel } from "@/components/consortium-engine/intelligence/findings-panel";
import { OperationalDashboard } from "@/components/consortium-engine/intelligence/operational-dashboard";
import { SimulationPanel } from "@/components/consortium-engine/intelligence/simulation-panel";
import type { NumberAnalysis } from "@/lib/consortium-intelligence/number-analysis";
import type { CreditOperation } from "@/lib/data/consortium-credit";
import type { EngineAssembly, EngineEvent, EngineGroup, EngineRule } from "@/lib/data/consortium-engine";
import type { AutomationRow, FindingRow, SimulationRow } from "@/lib/data/consortium-intelligence";

export function IntelligenceHub(props: {
  role: string;
  groups: EngineGroup[];
  selectedGroupId: string | null;
  assemblies: EngineAssembly[];
  rules: EngineRule[];
  findings: FindingRow[];
  simulations: SimulationRow[];
  automation: AutomationRow[];
  events: EngineEvent[];
  credits: CreditOperation[];
  analysis: NumberAnalysis | null;
}) {
  const [tab, setTab] = useState("achados");
  const open = props.findings.filter((f) => f.status === "OPEN" || f.status === "ACKNOWLEDGED");
  const assemblyOptions = props.assemblies.map((a) => {
    const g = props.groups.find((x) => x.id === a.groupId);
    return { value: a.id, label: `Assembleia nº ${a.assemblyNumber} · ${g?.groupCode ?? "?"} · ${a.assemblyDate}` };
  });

  return (
    <div className="space-y-6">
      <OperationalDashboard
        assemblies={props.assemblies}
        groups={props.groups}
        findings={open}
        events={props.events}
        credits={props.credits}
        automation={props.automation}
        onShowFindings={() => {
          setTab("achados");
          requestAnimationFrame(() => scrollToId("inteligencia-abas"));
        }}
      />

      <Tabs id="inteligencia-abas" value={tab} onValueChange={(v) => v && setTab(String(v))} className="scroll-mt-24">
        <div className="overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="achados">Achados ({open.length})</TabsTrigger>
            <TabsTrigger value="assistente">Assistente</TabsTrigger>
            <TabsTrigger value="simulacao">Simulação</TabsTrigger>
            <TabsTrigger value="automacao">Automação</TabsTrigger>
            <TabsTrigger value="numeros">Números</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="agentes">Agentes</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="achados">
          <FindingsPanel findings={props.findings} role={props.role} />
        </TabsContent>
        <TabsContent value="assistente">
          <AssistantPanel assemblies={assemblyOptions} />
        </TabsContent>
        <TabsContent value="simulacao">
          <SimulationPanel assemblies={assemblyOptions} simulations={props.simulations} />
        </TabsContent>
        <TabsContent value="automacao">
          <AutomationPanel assemblies={assemblyOptions} runs={props.automation} />
        </TabsContent>
        <TabsContent value="numeros">
          <NumberAnalysisPanel groups={props.groups} selectedGroupId={props.selectedGroupId} analysis={props.analysis} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentPanel />
        </TabsContent>
        <TabsContent value="agentes">
          <AgentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
