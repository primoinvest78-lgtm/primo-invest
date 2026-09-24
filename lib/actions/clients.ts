"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";
import {
  DOC_CATEGORY_TO_CENTER,
  DOC_CATEGORIES,
  DOC_REQUIREMENT_LABEL,
  DOC_RESPONSIBLE_OPTIONS,
  DOC_STATUS_TO_REQUEST,
  DOC_STATUSES,
  MARITAL_STATUS_OPTIONS,
  RELATIONSHIP_TYPES,
  clientDisplayName,
  maskCep,
  maskCnpj,
  maskCpf,
  maskCpfOrCnpj,
  maskPhone,
  onlyDigits,
  parseMoney,
  validateAll,
  type DocItem,
  type DocStatus,
  type RegistrationState,
} from "@/lib/utils/client-registration";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Estado do assistente sem os arquivos (File não atravessa a ação de servidor). */
export type RegistrationPayload = Omit<RegistrationState, "documents"> & {
  documents: (Omit<DocItem, "file"> & { file: null; hasFile: boolean })[];
};

export type DuplicateMatch = { field: "documento" | "email"; clientId: string; clientName: string };

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Variações de gravação do documento (com e sem máscara) — a base tem os dois formatos. */
function documentVariants(document: string): string[] {
  const digits = onlyDigits(document);
  if (!digits) return [];
  const masked = digits.length > 11 ? maskCnpj(digits) : maskCpf(digits);
  return Array.from(new Set([digits, masked]));
}

async function findDuplicates(
  supabase: Supabase,
  organizationId: string,
  input: { document: string; email: string },
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const variants = documentVariants(input.document);

  if (variants.length > 0) {
    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .in("document_number", variants)
      .limit(3);
    if (error) throw error;
    for (const row of data ?? []) matches.push({ field: "documento", clientId: row.id, clientName: row.full_name });
  }

  const email = input.email.trim();
  if (email) {
    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .ilike("email", escapeLike(email))
      .limit(3);
    if (error) throw error;
    for (const row of data ?? []) matches.push({ field: "email", clientId: row.id, clientName: row.full_name });
  }

  return matches;
}

/** Consulta prévia (etapas 2 e 3 do assistente) — avisa antes de chegar na revisão. */
export async function checkClientDuplicates(input: { document: string; email: string }) {
  const { organizationId } = await requireActiveMembership();
  const supabase = await createClient();
  return findDuplicates(supabase, organizationId, input);
}

// ---------------------------------------------------------------------------
// Ficha cadastral — dados sem coluna própria em `clients` (perfil
// profissional/financeiro, compliance, PJ, sócios) ficam registrados
// numa nota estruturada do cliente, sem criar tabela/migração nova.
// ---------------------------------------------------------------------------

function line(label: string, value: string | null | undefined) {
  const v = (value ?? "").toString().trim();
  return v ? `${label}: ${v}` : null;
}

function section(title: string, lines: (string | null)[]) {
  const body = lines.filter(Boolean);
  return body.length ? [`■ ${title.toUpperCase()}`, ...body].join("\n") : null;
}

function money(value: string) {
  return value ? `R$ ${value}` : "";
}

function buildRegistrationSheet(s: RegistrationPayload): string {
  const relationship = RELATIONSHIP_TYPES.find((r) => r.value === s.relationshipType)?.label;
  const marital = MARITAL_STATUS_OPTIONS.find((m) => m.value === s.pf.maritalStatus)?.label;

  const parts: (string | null)[] = [
    section("Classificação", [
      line("Tipo de cliente", s.personType === "pf" ? "Pessoa física" : "Pessoa jurídica"),
      line("Relacionamento", relationship),
    ]),
  ];

  if (s.personType === "pf") {
    parts.push(
      section("Identificação", [
        line("Nome social", s.pf.socialName),
        line("Sexo", s.pf.sex),
        line("Nacionalidade", s.pf.nationality),
        line("Naturalidade", s.pf.birthplace),
        line("Estado civil", marital),
        line("Profissão", s.pf.profession),
        line(
          "Documento",
          s.pf.idDocNumber
            ? [s.pf.idDocType, s.pf.idDocNumber, s.pf.idDocIssuer, s.pf.idDocUf].filter(Boolean).join(" · ")
            : "",
        ),
        line("Data de emissão", s.pf.idDocIssueDate),
      ]),
    );
  } else {
    parts.push(
      section("Empresa", [
        line("Nome fantasia", s.pj.tradeName),
        line("Data de constituição", s.pj.foundationDate),
        line("Natureza jurídica", s.pj.legalNature),
        line("CNAE", s.pj.cnae),
        line("Atividade principal", s.pj.mainActivity),
        line("Site", s.pj.website),
        line("Faturamento", money(s.pj.revenue)),
        line("Patrimônio", money(s.pj.netWorth)),
        line("Fonte dos recursos", s.pj.fundsOrigin),
      ]),
      section("Representante legal", [
        line("Nome", s.pj.repName),
        line("CPF", s.pj.repCpf && maskCpf(s.pj.repCpf)),
        line("Cargo", s.pj.repRole),
        line("E-mail", s.pj.repEmail),
        line("Telefone", s.pj.repPhone && maskPhone(s.pj.repPhone)),
      ]),
      section(
        "Sócios / beneficiários",
        s.pj.partners.map((p) =>
          [p.name, p.document && (onlyDigits(p.document).length > 11 ? maskCnpj(p.document) : maskCpf(p.document)), p.share && `${p.share}%`, p.role]
            .filter(Boolean)
            .join(" · "),
        ),
      ),
    );
  }

  parts.push(
    section("Residência", [line("Tipo de residência", s.address.residenceType)]),
    section("Perfil profissional e financeiro", [
      line("Situação profissional", s.profile.professionalStatus),
      line("Empresa", s.profile.company),
      line("CNPJ da empresa", s.profile.companyCnpj && maskCnpj(s.profile.companyCnpj)),
      line("Cargo", s.profile.role),
      line("Tempo de atividade", s.profile.activityTime),
      line("Renda mensal", money(s.profile.monthlyIncome)),
      line("Outras rendas", money(s.profile.otherIncome)),
      line("Renda familiar", money(s.profile.familyIncome)),
      line("Patrimônio estimado", money(s.profile.estimatedNetWorth)),
      line("Fontes de renda", s.profile.incomeSources.join(", ")),
      line("Fonte dos recursos", s.profile.fundsOrigins.join(", ")),
    ]),
    section("Conformidade", [
      line("Classificação de risco", s.compliance.riskClassification),
      line("Origem dos recursos", s.compliance.fundsOriginDetail),
      line("Beneficiário final", s.compliance.beneficialOwner),
      line("Observações", s.compliance.notes),
    ]),
  );

  if (s.personType === "pf" && s.family.hasSpouse) {
    const sp = s.family.spouse;
    parts.push(
      section(s.pf.maritalStatus === "uniao_estavel" ? "Companheiro(a)" : "Cônjuge", [
        line("Nome", sp.name),
        line("CPF", sp.cpf && maskCpf(sp.cpf)),
        line("Nascimento", sp.birthDate),
        line("Profissão", sp.profession),
        line("Telefone", sp.phone && maskPhone(sp.phone)),
        line("E-mail", sp.email),
        line("Regime de bens", sp.propertyRegime),
      ]),
    );
  }

  return (
    parts.filter(Boolean).join("\n\n") ||
    "Cadastro inicial concluído sem informações complementares."
  );
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message ?? "");
}

function buildRegistrationProfileRow(
  s: RegistrationPayload,
  ids: { organizationId: string; clientId: string; userId: string },
) {
  const isPf = s.personType === "pf";
  return {
    organization_id: ids.organizationId,
    client_id: ids.clientId,
    created_by: ids.userId,
    person_type: s.personType,
    relationship_type: s.relationshipType,
    sex: isPf ? s.pf.sex || null : null,
    nationality: isPf ? s.pf.nationality.trim() || null : null,
    birthplace: isPf ? s.pf.birthplace.trim() || null : null,
    marital_status: isPf ? s.pf.maritalStatus || null : null,
    property_regime: isPf && s.family.hasSpouse ? s.family.spouse.propertyRegime || null : null,
    profession: isPf ? s.pf.profession.trim() || null : null,
    id_document_type: isPf && s.pf.idDocNumber ? s.pf.idDocType : null,
    id_document_number: isPf ? s.pf.idDocNumber.trim() || null : null,
    id_document_issuer: isPf ? s.pf.idDocIssuer.trim() || null : null,
    id_document_uf: isPf ? s.pf.idDocUf || null : null,
    id_document_issue_date: isPf ? s.pf.idDocIssueDate || null : null,
    residence_type: s.address.residenceType || null,
    legal_nature: isPf ? null : s.pj.legalNature.trim() || null,
    cnae: isPf ? null : s.pj.cnae.trim() || null,
    main_activity: isPf ? null : s.pj.mainActivity.trim() || null,
    website: isPf ? null : s.pj.website.trim() || null,
    annual_revenue: isPf ? null : parseMoney(s.pj.revenue),
    company_net_worth: isPf ? null : parseMoney(s.pj.netWorth),
    legal_representative: isPf
      ? null
      : {
          name: s.pj.repName.trim(),
          cpf: maskCpf(s.pj.repCpf),
          role: s.pj.repRole.trim() || null,
          email: s.pj.repEmail.trim() || null,
          phone: s.pj.repPhone ? maskPhone(s.pj.repPhone) : null,
        },
    partners: isPf
      ? []
      : s.pj.partners.map((p) => ({
          name: p.name.trim(),
          document: p.document ? maskCpfOrCnpj(p.document) : null,
          share: p.share ? Number(p.share.replace(",", ".")) : null,
          role: p.role.trim() || null,
        })),
    professional_status: s.profile.professionalStatus || null,
    employer_name: s.profile.company.trim() || null,
    employer_cnpj: s.profile.companyCnpj ? maskCnpj(s.profile.companyCnpj) : null,
    job_title: s.profile.role.trim() || null,
    activity_time: s.profile.activityTime.trim() || null,
    monthly_income: parseMoney(s.profile.monthlyIncome),
    other_income: parseMoney(s.profile.otherIncome),
    family_income: parseMoney(s.profile.familyIncome),
    estimated_net_worth: parseMoney(s.profile.estimatedNetWorth),
    income_sources: s.profile.incomeSources.length ? s.profile.incomeSources : null,
    funds_origins: isPf
      ? s.profile.fundsOrigins.length
        ? s.profile.fundsOrigins
        : null
      : s.pj.fundsOrigin
        ? [s.pj.fundsOrigin]
        : null,
    risk_classification: s.compliance.riskClassification || null,
    funds_origin_detail: s.compliance.fundsOriginDetail.trim() || null,
    beneficial_owner: s.compliance.beneficialOwner.trim() || null,
    compliance_notes: s.compliance.notes.trim() || null,
  };
}

function docDescription(doc: RegistrationPayload["documents"][number]): string {
  const category = DOC_CATEGORIES.find((c) => c.value === doc.category)?.label;
  const validator = DOC_RESPONSIBLE_OPTIONS.find((r) => r.value === doc.validatedBy)?.label;
  const status = DOC_STATUSES.find((st) => st.value === doc.status)?.label;
  return [
    `Cadastro inicial · ${DOC_REQUIREMENT_LABEL[doc.requirement]}`,
    category && `Categoria: ${category}`,
    doc.type && `Tipo: ${doc.type}`,
    status && `Status informado: ${status}`,
    doc.expiresAt && `Validade: ${doc.expiresAt}`,
    validator && `Validação: ${validator}`,
    doc.notes && `Observações: ${doc.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Vínculo familiar — reaproveita cliente já existente (mesmo CPF) em vez
// de duplicar, no mesmo modelo de addHouseholdMember.
// ---------------------------------------------------------------------------

async function ensureRelatedClient(
  supabase: Supabase,
  ctx: { organizationId: string; householdId: string; status: string; created: string[] },
  person: { name: string; cpf: string; birthDate: string; email?: string; phone?: string },
): Promise<string> {
  const variants = documentVariants(person.cpf);
  if (variants.length > 0) {
    const { data: existing, error } = await supabase
      .from("clients")
      .select("id, household_id")
      .eq("organization_id", ctx.organizationId)
      .in("document_number", variants)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (existing) {
      if (!existing.household_id) {
        const { error: updateError } = await supabase
          .from("clients")
          .update({ household_id: ctx.householdId })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      }
      return existing.id as string;
    }
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: ctx.organizationId,
      household_id: ctx.householdId,
      full_name: person.name.trim(),
      document_number: person.cpf ? maskCpf(person.cpf) : null,
      birth_date: person.birthDate || null,
      email: person.email?.trim() || null,
      phone: person.phone ? maskPhone(person.phone) : null,
      status: ctx.status,
    })
    .select("id")
    .single();
  if (error) throw error;
  ctx.created.push(data.id);
  return data.id as string;
}

// ---------------------------------------------------------------------------
// Cadastro
// ---------------------------------------------------------------------------

export type CreateClientResult =
  | {
      ok: true;
      clientId: string;
      requests: { key: string; requestId: string }[];
      organizationId: string;
    }
  | { ok: false; error: string; duplicates?: DuplicateMatch[] };

export async function createClientRegistration(
  payload: RegistrationPayload,
  options: { allowDuplicate?: boolean } = {},
): Promise<CreateClientResult> {
  const { organizationId, userId } = await requireActiveMembership();
  const supabase = await createClient();

  const invalid = validateAll({ ...payload, documents: payload.documents.map((d) => ({ ...d, file: null })) });
  if (invalid.length > 0) {
    return { ok: false, error: "Existem campos obrigatórios inválidos ou incompletos. Revise as etapas destacadas." };
  }

  const isPf = payload.personType === "pf";
  const document = isPf ? maskCpf(payload.pf.cpf) : maskCnpj(payload.pj.cnpj);
  const email = payload.contact.email.trim().toLowerCase();

  const duplicates = await findDuplicates(supabase, organizationId, { document, email });
  if (duplicates.length > 0 && !options.allowDuplicate) {
    return {
      ok: false,
      error: "Já existe cliente cadastrado com este documento ou e-mail.",
      duplicates,
    };
  }
  // CPF/CNPJ duplicado nunca é liberado, só e-mail compartilhado (ex.: casal).
  if (duplicates.some((d) => d.field === "documento")) {
    return { ok: false, error: "Já existe cliente cadastrado com este CPF/CNPJ.", duplicates };
  }

  const status = payload.relationshipType === "prospect" ? "prospect" : "active";
  const fullName = clientDisplayName({ ...payload, documents: [] });
  const mobile = maskPhone(payload.contact.mobile);
  const whatsapp = payload.contact.whatsappSameAsMobile ? mobile : maskPhone(payload.contact.whatsapp);

  // Rastreia o que foi criado pra desfazer em caso de falha no meio do caminho.
  const created = {
    clientIds: [] as string[],
    householdId: null as string | null,
  };

  try {
    const needsHousehold =
      isPf && (payload.family.hasSpouse || payload.family.members.length > 0);

    if (needsHousehold) {
      const { data: household, error } = await supabase
        .from("households")
        .insert({ organization_id: organizationId, name: `Família ${fullName}` })
        .select("id")
        .single();
      if (error) throw error;
      created.householdId = household.id;
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        organization_id: organizationId,
        household_id: created.householdId,
        assigned_advisor_id: userId,
        full_name: fullName,
        preferred_name: (isPf ? payload.pf.socialName : payload.pj.tradeName).trim() || null,
        document_number: document,
        birth_date: (isPf ? payload.pf.birthDate : payload.pj.foundationDate) || null,
        email,
        phone: mobile,
        status,
        notes: payload.notes.trim() || null,
      })
      .select("id")
      .single();
    if (clientError) throw clientError;
    const clientId = client.id as string;
    created.clientIds.push(clientId);

    // Contatos
    const contacts = [
      { contact_type: "email", value: email, label: "Principal", is_primary: true },
      { contact_type: "phone", value: mobile, label: isPf ? "Celular" : "Telefone", is_primary: true },
      ...(whatsapp ? [{ contact_type: "whatsapp", value: whatsapp, label: "WhatsApp", is_primary: false }] : []),
      ...payload.extraContacts.map((c) => ({
        contact_type: c.type,
        value: c.type === "email" ? c.value.trim() : maskPhone(c.value),
        label: [c.label, c.notes].filter((v) => v.trim()).join(" — ") || null,
        is_primary: false,
      })),
      ...(!isPf && payload.pj.repEmail
        ? [{ contact_type: "email", value: payload.pj.repEmail.trim(), label: `Representante legal — ${payload.pj.repName}`, is_primary: false }]
        : []),
      ...(!isPf && payload.pj.repPhone
        ? [{ contact_type: "phone", value: maskPhone(payload.pj.repPhone), label: `Representante legal — ${payload.pj.repName}`, is_primary: false }]
        : []),
    ].map((c) => ({ ...c, organization_id: organizationId, client_id: clientId }));

    const { error: contactsError } = await supabase.from("client_contacts").insert(contacts);
    if (contactsError) throw contactsError;

    // Endereço
    const a = payload.address;
    const { error: addressError } = await supabase.from("client_addresses").insert({
      organization_id: organizationId,
      client_id: clientId,
      address_type: isPf ? "residential" : "commercial",
      postal_code: maskCep(a.postalCode),
      street: a.street.trim(),
      number: a.number.trim(),
      complement: a.complement.trim() || null,
      neighborhood: a.neighborhood.trim(),
      city: a.city.trim(),
      state: a.state,
      country: a.country.trim() || "Brasil",
      is_primary: true,
    });
    if (addressError) throw addressError;

    // Núcleo familiar
    if (created.householdId) {
      const ctx = { organizationId, householdId: created.householdId, status, created: created.clientIds };
      const links: { client_id: string; relationship: string }[] = [
        { client_id: clientId, relationship: "Titular" },
      ];

      if (payload.family.hasSpouse) {
        const sp = payload.family.spouse;
        const spouseId = await ensureRelatedClient(supabase, ctx, {
          name: sp.name,
          cpf: sp.cpf,
          birthDate: sp.birthDate,
          email: sp.email,
          phone: sp.phone,
        });
        links.push({
          client_id: spouseId,
          relationship: payload.pf.maritalStatus === "uniao_estavel" ? "Companheiro(a)" : "Cônjuge",
        });
      }

      for (const member of payload.family.members) {
        const memberId = await ensureRelatedClient(supabase, ctx, {
          name: member.name,
          cpf: member.cpf,
          birthDate: member.birthDate,
        });
        links.push({ client_id: memberId, relationship: member.relationship });
      }

      const unique = links.filter((l, i) => links.findIndex((x) => x.client_id === l.client_id) === i);
      const { error: linkError } = await supabase
        .from("household_members")
        .insert(unique.map((l) => ({ ...l, household_id: created.householdId })));
      if (linkError) throw linkError;
    }

    // Tipo de relacionamento → tags existentes (unique por organização:
    // busca antes de criar, nunca duplica).
    const tagNames = [...(RELATIONSHIP_TYPES.find((r) => r.value === payload.relationshipType)?.tags ?? [])];
    tagNames.push(isPf ? "Pessoa física" : "Pessoa jurídica");
    if (tagNames.length > 0) {
      const { data: existingTags, error: tagsError } = await supabase
        .from("tags")
        .select("id, name")
        .eq("organization_id", organizationId)
        .in("name", tagNames);
      if (tagsError) throw tagsError;

      const tagIds = (existingTags ?? []).map((t) => t.id as string);
      const missing = tagNames.filter((n) => !(existingTags ?? []).some((t) => t.name === n));
      if (missing.length > 0) {
        const { data: newTags, error: newTagsError } = await supabase
          .from("tags")
          .upsert(
            missing.map((name) => ({ organization_id: organizationId, name, color: "#1105D9" })),
            { onConflict: "organization_id,name" },
          )
          .select("id");
        if (newTagsError) throw newTagsError;
        for (const t of newTags ?? []) {
          tagIds.push(t.id);
        }
      }

      const { error: clientTagsError } = await supabase
        .from("client_tags")
        .insert(tagIds.map((tagId) => ({ client_id: clientId, tag_id: tagId })));
      if (clientTagsError) throw clientTagsError;
    }

    // Ficha cadastral
    const { error: noteError } = await supabase.from("notes").insert({
      organization_id: organizationId,
      client_id: clientId,
      user_id: userId,
      title: "Ficha cadastral — cadastro inicial",
      content: buildRegistrationSheet(payload),
      is_private: false,
    });
    if (noteError) throw noteError;

    // Ficha estruturada (supabase/migrations/20260924000000_client_registration_profiles.sql).
    // Enquanto a tabela não for criada no banco, a nota acima já guarda tudo.
    const { error: profileError } = await supabase
      .from("client_registration_profiles")
      .insert(buildRegistrationProfileRow(payload, { organizationId, clientId, userId }));
    if (profileError && !isMissingTableError(profileError)) throw profileError;

    // Documentos → solicitações na Central de Documentos (document_requests).
    const includedDocs = payload.documents.filter((d) => d.included);
    const requests: { key: string; requestId: string }[] = [];
    if (includedDocs.length > 0) {
      const rows = includedDocs.map((doc) => {
        // Arquivo anexado sem status explícito conta como recebido.
        const effective: DocStatus = doc.hasFile && doc.status === "pendente" ? "recebido" : doc.status;
        const mapped = DOC_STATUS_TO_REQUEST[effective];
        return {
          organization_id: organizationId,
          client_id: clientId,
          title: doc.name,
          category: DOC_CATEGORY_TO_CENTER[doc.category],
          description: docDescription({ ...doc, status: effective }),
          responsible_role: doc.submittedBy || null,
          requested_by: userId,
          status: mapped.status,
          decision_notes: mapped.decisionNote,
        };
      });

      const { data: inserted, error: requestsError } = await supabase
        .from("document_requests")
        .insert(rows)
        .select("id, title");
      if (requestsError) throw requestsError;

      (inserted ?? []).forEach((row, i) => {
        requests.push({ key: includedDocs[i].key, requestId: row.id as string });
      });
    }

    revalidatePath("/clientes");
    revalidatePath("/documentos/documentos");
    revalidatePath("/dashboard");

    return { ok: true, clientId, requests, organizationId };
  } catch (error) {
    console.error("[clientes] falha ao cadastrar cliente", error);
    // Desfaz o que foi criado — filhos primeiro, pra não deixar cadastro pela metade.
    const ids = created.clientIds;
    if (ids.length > 0) {
      await supabase.from("document_requests").delete().in("client_id", ids);
      await supabase.from("notes").delete().in("client_id", ids);
      await supabase.from("client_registration_profiles").delete().in("client_id", ids);
      await supabase.from("client_tags").delete().in("client_id", ids);
      await supabase.from("client_contacts").delete().in("client_id", ids);
      await supabase.from("client_addresses").delete().in("client_id", ids);
      if (created.householdId) await supabase.from("household_members").delete().eq("household_id", created.householdId);
      await supabase.from("clients").delete().in("id", ids);
    }
    if (created.householdId) {
      // Cliente já existente vinculado ao núcleo (mesmo CPF) volta a ficar sem núcleo.
      await supabase.from("clients").update({ household_id: null }).eq("household_id", created.householdId);
      await supabase.from("households").delete().eq("id", created.householdId);
    }
    return { ok: false, error: "Não foi possível concluir o cadastro. Nenhum dado foi gravado — tente novamente." };
  }
}

/**
 * Anexa um arquivo já enviado ao armazenamento (bucket "documents") à
 * solicitação criada no cadastro: grava documents + document_versions
 * (mesmo formato do Cofre Digital) e vincula à solicitação.
 */
export async function attachRegistrationDocument(input: {
  clientId: string;
  requestId: string;
  name: string;
  category: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  expiresAt: string | null;
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
      document_type: input.mimeType || "outro",
      storage_path: input.storagePath,
      category: input.category,
      expires_at: input.expiresAt,
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

  const { error: linkError } = await supabase
    .from("document_requests")
    .update({ document_id: document.id })
    .eq("id", input.requestId)
    .eq("organization_id", organizationId);
  if (linkError) throw linkError;

  revalidatePath(`/clientes/${input.clientId}`);
  revalidatePath("/documentos/cofre");
}
