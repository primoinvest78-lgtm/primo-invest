import { createClient } from "@/lib/supabase/server";

export type DocumentRequestStatus =
  | "solicitado"
  | "recebido"
  | "em_analise"
  | "aprovado"
  | "reprovado"
  | "arquivado";

export type DocumentCenterRow = {
  id: string;
  kind: "document" | "request";
  documentId: string | null;
  requestId: string | null;
  title: string;
  clientId: string | null;
  clientName: string | null;
  category: string | null;
  mimeType: string | null;
  documentStatus: string | null;
  requestStatus: DocumentRequestStatus | null;
  expiresAt: string | null;
  dueDate: string | null;
  responsibleName: string | null;
  responsibleRole: string | null;
  origin: string;
  createdAt: string;
  updatedAt: string;
  consortiumContractId: string | null;
  contractLabel: string | null;
  decisionNotes: string | null;
  versionCount: number;
  latestFileSize: number | null;
};

export type DocumentRequestListItem = {
  id: string;
  documentId: string | null;
  title: string;
  category: string | null;
  status: DocumentRequestStatus;
  clientId: string | null;
  clientName: string | null;
  dueDate: string | null;
  responsibleName: string | null;
  responsibleRole: string | null;
  requesterName: string | null;
  decisionNotes: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  updatedAt: string;
};

const CENTER_DOCUMENT_SELECT = `id, name, document_type, category, status, expires_at, tags, created_at, updated_at,
  client:clients(id, full_name, assigned_advisor:profiles!clients_assigned_advisor_id_fkey(full_name)),
  consortium_contracts(id, administrator_name, contract_number),
  document_versions(version_number, file_size, created_at),
  document_relationships(entity_type),
  document_requests(id, title, status, due_date, category, responsible_role, decision_notes, created_at, updated_at,
    responsible:profiles!document_requests_responsible_id_fkey(full_name))`;

const REQUEST_SELECT = `id, document_id, title, category, status, due_date, decision_notes, entity_type, entity_id, created_at, updated_at,
  client:clients(id, full_name),
  responsible:profiles!document_requests_responsible_id_fkey(full_name),
  responsible_role,
  requester:profiles!document_requests_requested_by_fkey(full_name)`;

type RawCenterDocument = {
  id: string;
  name: string;
  document_type: string | null;
  category: string | null;
  status: string;
  expires_at: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
  client: { id: string; full_name: string; assigned_advisor: { full_name: string | null } | null } | null;
  consortium_contracts: { id: string; administrator_name: string | null; contract_number: string | null } | null;
  document_versions: { version_number: number; file_size: number | null; created_at: string }[];
  document_relationships: { entity_type: string }[];
  document_requests: {
    id: string;
    title: string;
    status: DocumentRequestStatus;
    due_date: string | null;
    category: string | null;
    responsible_role: string | null;
    decision_notes: string | null;
    created_at: string;
    updated_at: string;
    responsible: { full_name: string | null } | null;
  }[];
};

type RawRequest = {
  id: string;
  document_id: string | null;
  title: string;
  category: string | null;
  status: DocumentRequestStatus;
  due_date: string | null;
  decision_notes: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
  client: { id: string; full_name: string } | null;
  responsible: { full_name: string | null } | null;
  responsible_role: string | null;
  requester: { full_name: string | null } | null;
};

function originLabel(row: {
  consortium_contracts: { id: string } | null;
  document_relationships: { entity_type: string }[];
  client: unknown;
}): string {
  if (row.consortium_contracts) return "Consórcio";
  const relType = row.document_relationships[0]?.entity_type;
  if (relType === "financial_account") return "Conta";
  if (relType === "wealth_goal") return "Meta";
  if (relType === "liability") return "Passivo";
  if (relType === "opportunity") return "Oportunidade";
  if (row.client) return "Cliente";
  return "Cofre Digital";
}

/**
 * Une documentos reais (Cofre) com solicitações ainda não atendidas
 * (sem documento vinculado) numa única lista pra Central de
 * Documentos. Uma solicitação já atendida (document_id preenchido)
 * não vira uma linha separada — ela empresta seu status/responsável
 * pra linha do documento, evitando duplicar a mesma coisa na tabela.
 */
export async function getDocumentCenterRows(organizationId: string): Promise<DocumentCenterRow[]> {
  const supabase = await createClient();

  const [docsRes, requestsRes] = await Promise.all([
    supabase.from("documents").select(CENTER_DOCUMENT_SELECT).eq("organization_id", organizationId),
    supabase.from("document_requests").select(REQUEST_SELECT).eq("organization_id", organizationId).is("document_id", null),
  ]);

  if (docsRes.error) throw docsRes.error;
  if (requestsRes.error) throw requestsRes.error;

  const docs = (docsRes.data ?? []) as unknown as RawCenterDocument[];
  const openRequests = (requestsRes.data ?? []) as unknown as RawRequest[];

  const documentRows: DocumentCenterRow[] = docs.map((row) => {
    const versions = [...(row.document_versions ?? [])].sort((a, b) => b.version_number - a.version_number);
    const latest = versions[0];
    const activeRequest = [...(row.document_requests ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    return {
      id: `doc-${row.id}`,
      kind: "document",
      documentId: row.id,
      requestId: activeRequest?.id ?? null,
      title: row.name,
      clientId: row.client?.id ?? null,
      clientName: row.client?.full_name ?? null,
      category: row.category,
      mimeType: row.document_type,
      documentStatus: row.status,
      requestStatus: activeRequest?.status ?? null,
      expiresAt: row.expires_at,
      dueDate: activeRequest?.due_date ?? null,
      responsibleName: activeRequest?.responsible?.full_name ?? row.client?.assigned_advisor?.full_name ?? null,
      responsibleRole: activeRequest?.responsible_role ?? null,
      origin: originLabel(row),
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      consortiumContractId: row.consortium_contracts?.id ?? null,
      contractLabel: row.consortium_contracts
        ? [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number].filter(Boolean).join(" · ")
        : null,
      decisionNotes: activeRequest?.decision_notes ?? null,
      versionCount: versions.length,
      latestFileSize: latest?.file_size ?? null,
    };
  });

  const requestRows: DocumentCenterRow[] = openRequests.map((row) => ({
    id: `req-${row.id}`,
    kind: "request",
    documentId: null,
    requestId: row.id,
    title: row.title,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    category: row.category,
    mimeType: null,
    documentStatus: null,
    requestStatus: row.status,
    expiresAt: null,
    dueDate: row.due_date,
    responsibleName: row.responsible?.full_name ?? null,
    responsibleRole: row.responsible_role,
    origin: row.entity_type
      ? ({ financial_account: "Conta", wealth_goal: "Meta", liability: "Passivo", opportunity: "Oportunidade", consortium_contract: "Consórcio" }[
          row.entity_type
        ] ?? "Cliente")
      : row.client
        ? "Cliente"
        : "Cofre Digital",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    consortiumContractId: null,
    contractLabel: null,
    decisionNotes: row.decision_notes,
    versionCount: 0,
    latestFileSize: null,
  }));

  return [...documentRows, ...requestRows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Todas as solicitações da organização — usada na seção "Solicitações em andamento" e nos KPIs de workflow. */
export async function getDocumentRequests(organizationId: string): Promise<DocumentRequestListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_requests")
    .select(REQUEST_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawRequest[];

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    category: row.category,
    status: row.status,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    dueDate: row.due_date,
    responsibleName: row.responsible?.full_name ?? null,
    responsibleRole: row.responsible_role,
    requesterName: row.requester?.full_name ?? null,
    decisionNotes: row.decision_notes,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
