"use client";

import { motion } from "motion/react";
import {
  Briefcase,
  Building2,
  FileText,
  Gavel,
  Landmark,
  Receipt,
  Shield,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import type { VaultDocument } from "@/lib/data/documents";
import { categoryLabel, DOCUMENT_CATEGORIES } from "@/lib/utils/document-helpers";

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pessoal: User,
  financeiro: Landmark,
  patrimonial: Building2,
  investimento: TrendingUp,
  consorcio: Users,
  contrato: FileText,
  juridico: Gavel,
  fiscal: Receipt,
  seguro: Shield,
  outro: Briefcase,
};

export function VaultCategoriesGrid({
  documents,
  activeCategory,
  onSelect,
}: {
  documents: VaultDocument[];
  activeCategory: string;
  onSelect: (category: string) => void;
}) {
  const counts = new Map<string, number>();
  for (const doc of documents) {
    const key = doc.category ?? "outro";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {DOCUMENT_CATEGORIES.map((category, index) => {
        const Icon = CATEGORY_ICON[category] ?? FileText;
        const count = counts.get(category) ?? 0;
        const active = activeCategory === category;

        return (
          <motion.button
            key={category}
            type="button"
            onClick={() => onSelect(active ? "all" : category)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className={[
              "card-premium flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all duration-200",
              active ? "border-primary" : "",
            ].join(" ")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm font-bold text-foreground">{categoryLabel(category)}</p>
            <p className="text-xs text-card-beige-muted-foreground">
              {count} {count === 1 ? "documento" : "documentos"}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
