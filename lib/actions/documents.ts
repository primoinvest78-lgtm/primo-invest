"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export async function recordClientDocument(input: {
  clientId: string;
  name: string;
  documentType: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
}) {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      uploaded_by: userId,
      name: input.name,
      document_type: input.documentType,
      storage_path: input.storagePath,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: document.id,
    version_number: 1,
    storage_path: input.storagePath,
    file_size: input.fileSize,
    mime_type: input.mimeType,
    uploaded_by: userId,
  });

  if (versionError) throw versionError;

  revalidatePath(`/clientes/${input.clientId}`);
}

export async function deleteClientDocument(
  documentId: string,
  clientId: string,
  storagePaths: string[],
) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage.from("documents").remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  if (error) throw error;

  revalidatePath(`/clientes/${clientId}`);
}
