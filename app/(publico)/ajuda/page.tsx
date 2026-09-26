import type { Metadata } from "next";

import { HelpSearch } from "@/components/help/help-search";
import { HELP_GROUPS, loadSearchIndex } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Central de Ajuda | Primo Invest",
  description: "Manual de uso de cada módulo do Primo Invest.",
};

export default function AjudaPage() {
  return <HelpSearch entries={loadSearchIndex()} groups={HELP_GROUPS.map((g) => g.title)} />;
}
