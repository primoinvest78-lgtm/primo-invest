"use client";

import { useEffect, useRef } from "react";

import { registerReportView } from "@/lib/actions/reports";

/**
 * Conta uma abertura do relatório.
 *
 * Precisa ser um componente de cliente: chamar a action direto na página
 * de servidor contaria também prefetch e revalidação, e o "mais
 * consultados" da home viraria ficção. O `useRef` protege do StrictMode,
 * que monta o efeito duas vezes em desenvolvimento.
 */
export function ReportViewTracker({
  reportId,
  currentCount,
}: {
  reportId: string;
  currentCount: number;
}) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    // Falhar aqui não pode atrapalhar a leitura do documento — o
    // contador é métrica de uso, não parte do conteúdo.
    void registerReportView(reportId, currentCount).catch(() => {});
  }, [reportId, currentCount]);

  return null;
}
