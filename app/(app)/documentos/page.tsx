import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

import { ExecutivePage } from "@/components/dashboard/executive-page";
import { getDocumentCenterRows, getDocumentRequests } from "@/lib/data/document-center";
import { getVaultDocuments } from "@/lib/data/documents";
import { computeCenterKpis } from "@/lib/utils/document-center-helpers";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function DocumentosPage() {
  const { organizationId } = await requireActiveMembership();
  const [documents, centerRows, requests] = await Promise.all([
    getVaultDocuments(organizationId),
    getDocumentCenterRows(organizationId),
    getDocumentRequests(organizationId),
  ]);

  const kpis = computeCenterKpis(centerRows);
  const openRequests = requests.filter((r) => r.status !== "arquivado").length;

  return (
    <ExecutivePage
      badge="Documentos"
      title="Documentos"
      subtitle="Controle documental institucional"
      context="O Cofre Digital guarda os arquivos com segurança; a Central de Documentos gerencia pendências, prazos, aprovações e o fluxo de solicitação de documentos."
    >
      <Link href="/documentos/cofre" className="card-premium block rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <p className="mt-3 text-h2 font-bold text-foreground">Cofre Digital</p>
        <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
          {documents.length} {documents.length === 1 ? "documento armazenado" : "documentos armazenados"} com segurança.
        </p>
      </Link>

      <Link href="/documentos/documentos" className="card-premium block rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <FileText className="h-5 w-5" />
        </div>
        <p className="mt-3 text-h2 font-bold text-foreground">Central de Documentos</p>
        <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
          {kpis.pendentes + kpis.vencidos} {kpis.pendentes + kpis.vencidos === 1 ? "pendência crítica" : "pendências críticas"}
          {" · "}
          {openRequests} {openRequests === 1 ? "solicitação em andamento" : "solicitações em andamento"}.
        </p>
      </Link>
    </ExecutivePage>
  );
}
