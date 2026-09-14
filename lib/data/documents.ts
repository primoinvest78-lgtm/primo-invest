import { createClient } from "@/lib/supabase/server";

export { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/utils/document-helpers";

export type VaultDocument = {
  id: string;
  name: string;
  mimeType: string | null;
  category: string | null;
  status: string;
  expiresAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string | null;
  clientId: string | null;
  clientName: string | null;
  consortiumContractId: string | null;
  contractLabel: string | null;
  uploadedByName: string | null;
  latestVersionNumber: number | null;
  latestFileSize: number | null;
  versionCount: number;
};

const VAULT_DOCUMENT_BASE_FIELDS = `id, name, document_type, category, status, expires_at, tags, created_at, updated_at,
       client:clients(id, full_name),
       consortium_contracts(id, administrator_name, contract_number),
       uploaded_by_profile:profiles!documents_uploaded_by_fkey(full_name)`;

const VAULT_DOCUMENT_SELECT = `${VAULT_DOCUMENT_BASE_FIELDS},
       document_versions(version_number, file_size, created_at)`;

type RawVaultDocument = {
  id: string;
  name: string;
  document_type: string | null;
  category: string | null;
  status: string;
  expires_at: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
  client: { id: string; full_name: string } | null;
  consortium_contracts: { id: string; administrator_name: string | null; contract_number: string | null } | null;
  uploaded_by_profile: { full_name: string | null } | null;
  document_versions: { version_number: number; file_size: number | null; created_at: string }[];
};

function mapVaultDocument(row: RawVaultDocument): VaultDocument {
  const versions = [...(row.document_versions ?? [])].sort((a, b) => b.version_number - a.version_number);
  const latest = versions[0];

  return {
    id: row.id,
    name: row.name,
    mimeType: row.document_type,
    category: row.category,
    status: row.status,
    expiresAt: row.expires_at,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientId: row.client?.id ?? null,
    clientName: row.client?.full_name ?? null,
    consortiumContractId: row.consortium_contracts?.id ?? null,
    contractLabel: row.consortium_contracts
      ? [row.consortium_contracts.administrator_name, row.consortium_contracts.contract_number].filter(Boolean).join(" · ")
      : null,
    uploadedByName: row.uploaded_by_profile?.full_name ?? null,
    latestVersionNumber: latest?.version_number ?? null,
    latestFileSize: latest?.file_size ?? null,
    versionCount: versions.length,
  };
}

export async function getVaultDocuments(organizationId: string): Promise<VaultDocument[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(VAULT_DOCUMENT_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawVaultDocument[];
  return rows.map(mapVaultDocument);
}

export type DocumentVersionDetail = {
  id: string;
  versionNumber: number;
  storagePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

export type DocumentRelationship = {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  createdAt: string;
};

export type DocumentShare = {
  id: string;
  sharedWithType: string;
  sharedWithName: string | null;
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  expiresAt: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type DocumentAccessEntry = {
  id: string;
  action: string;
  userName: string | null;
  createdAt: string;
};

export type VaultDocumentDetail = VaultDocument & {
  versions: DocumentVersionDetail[];
  relationships: DocumentRelationship[];
  shares: DocumentShare[];
  accessLog: DocumentAccessEntry[];
};

export async function getVaultDocumentDetail(
  organizationId: string,
  documentId: string,
): Promise<VaultDocumentDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `${VAULT_DOCUMENT_BASE_FIELDS},
       document_versions(id, version_number, storage_path, file_size, mime_type, created_at,
         uploaded_by_profile:profiles!document_versions_uploaded_by_fkey(full_name)),
       document_relationships(id, entity_type, entity_id, created_at),
       document_shares(id, shared_with_type, shared_with_name, can_view, can_download, can_edit, expires_at, created_at,
         created_by_profile:profiles!document_shares_created_by_fkey(full_name)),
       document_access_log(id, action, created_at, user_profile:profiles!document_access_log_user_id_fkey(full_name))`,
    )
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  type Raw = RawVaultDocument & {
    document_versions: {
      id: string;
      version_number: number;
      storage_path: string;
      file_size: number | null;
      mime_type: string | null;
      created_at: string;
      uploaded_by_profile: { full_name: string | null } | null;
    }[];
    document_relationships: { id: string; entity_type: string; entity_id: string; created_at: string }[];
    document_shares: {
      id: string;
      shared_with_type: string;
      shared_with_name: string | null;
      can_view: boolean;
      can_download: boolean;
      can_edit: boolean;
      expires_at: string | null;
      created_at: string;
      created_by_profile: { full_name: string | null } | null;
    }[];
    document_access_log: {
      id: string;
      action: string;
      created_at: string;
      user_profile: { full_name: string | null } | null;
    }[];
  };
  const row = data as unknown as Raw;

  const base = mapVaultDocument(row);
  const relationshipLabels = await resolveRelationshipLabels(supabase, row.document_relationships);

  return {
    ...base,
    versions: [...row.document_versions]
      .sort((a, b) => b.version_number - a.version_number)
      .map((v) => ({
        id: v.id,
        versionNumber: v.version_number,
        storagePath: v.storage_path,
        fileSize: v.file_size,
        mimeType: v.mime_type,
        uploadedByName: v.uploaded_by_profile?.full_name ?? null,
        createdAt: v.created_at,
      })),
    relationships: row.document_relationships.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      entityLabel: relationshipLabels.get(`${r.entity_type}:${r.entity_id}`) ?? null,
      createdAt: r.created_at,
    })),
    shares: row.document_shares.map((s) => ({
      id: s.id,
      sharedWithType: s.shared_with_type,
      sharedWithName: s.shared_with_name,
      canView: s.can_view,
      canDownload: s.can_download,
      canEdit: s.can_edit,
      expiresAt: s.expires_at,
      createdByName: s.created_by_profile?.full_name ?? null,
      createdAt: s.created_at,
    })),
    accessLog: [...row.document_access_log]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => ({ id: a.id, action: a.action, userName: a.user_profile?.full_name ?? null, createdAt: a.created_at })),
  };
}

export async function getVaultShareCount(organizationId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("document_shares")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) throw error;
  return count ?? 0;
}

export const RELATIONSHIP_ENTITY_TYPES = [
  "financial_account",
  "wealth_goal",
  "liability",
  "opportunity",
] as const;

/**
 * Resolve os nomes reais das entidades relacionadas, agrupando por
 * tipo pra evitar 1 query por relacionamento. entity_id não é FK
 * (aponta pra tabelas diferentes conforme o tipo), então a resolução
 * é feita aqui, na leitura, e não pelo banco.
 */
async function resolveRelationshipLabels(
  supabase: Awaited<ReturnType<typeof createClient>>,
  relationships: { entity_type: string; entity_id: string }[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (relationships.length === 0) return labels;

  const idsByType = new Map<string, string[]>();
  for (const r of relationships) {
    const list = idsByType.get(r.entity_type) ?? [];
    list.push(r.entity_id);
    idsByType.set(r.entity_type, list);
  }

  const accountIds = idsByType.get("financial_account");
  if (accountIds?.length) {
    const { data } = await supabase.from("financial_accounts").select("id, account_name, institution_name").in("id", accountIds);
    for (const row of data ?? []) labels.set(`financial_account:${row.id}`, row.account_name ?? row.institution_name ?? "Conta");
  }

  const goalIds = idsByType.get("wealth_goal");
  if (goalIds?.length) {
    const { data } = await supabase.from("wealth_goals").select("id, name").in("id", goalIds);
    for (const row of data ?? []) labels.set(`wealth_goal:${row.id}`, row.name);
  }

  const liabilityIds = idsByType.get("liability");
  if (liabilityIds?.length) {
    const { data } = await supabase.from("liabilities").select("id, name").in("id", liabilityIds);
    for (const row of data ?? []) labels.set(`liability:${row.id}`, row.name);
  }

  const opportunityIds = idsByType.get("opportunity");
  if (opportunityIds?.length) {
    const { data } = await supabase.from("opportunities").select("id, title").in("id", opportunityIds);
    for (const row of data ?? []) labels.set(`opportunity:${row.id}`, row.title);
  }

  return labels;
}

/** Clientes sem nenhum documento cadastrado — real, pra "Documentos pendentes". */
export async function getClientsWithoutDocuments(
  organizationId: string,
): Promise<{ id: string; fullName: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, documents(id)")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error) throw error;

  type Raw = { id: string; full_name: string; documents: { id: string }[] };
  const rows = (data ?? []) as unknown as Raw[];

  return rows.filter((r) => (r.documents ?? []).length === 0).map((r) => ({ id: r.id, fullName: r.full_name }));
}
