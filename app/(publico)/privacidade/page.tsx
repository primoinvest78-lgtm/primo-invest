import type { Metadata } from "next";

import { DocView } from "@/components/help/doc-view";
import { loadLegal } from "@/lib/help/content";

export const metadata: Metadata = { title: "Política de Privacidade | Primo Invest" };

export default function PrivacidadePage() {
  const { meta, doc } = loadLegal("privacidade");
  return (
    <DocView
      crumb="Documentos legais"
      title={meta.title}
      doc={doc}
      notice={doc.html.includes('class="pending"') ? "Documento em revisão: os campos destacados em amarelo serão preenchidos com os dados da empresa antes da versão final." : undefined}
      prev={{ href: "/ajuda/administracao", title: "Administração" }}
      next={{ href: "/termos", title: "Termos de Uso" }}
    />
  );
}
