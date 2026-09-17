/**
 * Fronteira de extração de dados do comprovante — arquitetura, não
 * implementação. Não existe OCR real conectado; o único provedor hoje
 * é `ManualExtractionProvider`, que só reaproveita o que a pessoa
 * digitou no formulário de upload.
 *
 * Quando um OCR/IA real for plugado (ver instrução do módulo — "NÃO
 * inventar OCR... preparar interfaces"), ele implementa esta mesma
 * interface e substitui `ManualExtractionProvider` sem que nada mais
 * no motor de matching/conciliação precise mudar: o resto do fluxo só
 * consome `ExtractedPaymentData`, nunca sabe se veio de gente ou de
 * modelo.
 */

export type ExtractedPaymentData = {
  amount: number | null;
  date: string | null;
  time: string | null;
  method: string | null;
  bank: string | null;
  beneficiary: string | null;
  transactionId: string | null;
  clientHint: string | null;
};

export type ExtractionInput = {
  fileName: string;
  mimeType: string;
  /** Dados que a pessoa já digitou no formulário — a única fonte real hoje. */
  manualEntry: ExtractedPaymentData;
};

export type ExtractionResult = {
  data: ExtractedPaymentData;
  /** De onde veio o dado — nunca "ia"/"ocr" enquanto não houver um provedor real conectado. */
  source: "manual" | "ocr" | "ai";
  /** Confiança do PRÓPRIO extrator nos campos que preencheu — não é o score de matching. */
  fieldConfidence: Partial<Record<keyof ExtractedPaymentData, number>>;
};

export interface ExtractionProvider {
  readonly name: string;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

/**
 * Único provedor real hoje: repassa o que foi digitado no upload.
 * `fieldConfidence` é 1 pra tudo que a pessoa preencheu — é dado
 * humano, não uma estimativa.
 */
export class ManualExtractionProvider implements ExtractionProvider {
  readonly name = "manual";

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const fieldConfidence: Partial<Record<keyof ExtractedPaymentData, number>> = {};
    for (const [key, value] of Object.entries(input.manualEntry)) {
      if (value !== null && value !== "") fieldConfidence[key as keyof ExtractedPaymentData] = 1;
    }

    return { data: input.manualEntry, source: "manual", fieldConfidence };
  }
}

export function getActiveExtractionProvider(): ExtractionProvider {
  return new ManualExtractionProvider();
}
