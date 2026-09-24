/**
 * Consortium Intelligence Core — motor determinístico de consórcios.
 *
 *   NUMBER   numbering.ts     numeração e representação das cotas
 *   RULE     rules.ts         validação, ciclo de vida, vigência, hash
 *   SOURCE   source.ts        validação do resultado oficial
 *   CANDIDATE candidates.ts   resultado + plano → candidatos
 *   EQUIVALENCE equivalence.ts candidato → cota primária
 *   ELIGIBILITY eligibility.ts snapshot congelado de aptidão
 *   RESOURCE resources.ts     quantas contemplações cabem
 *   DRAW     draw.ts          apuração do sorteio + trace
 *   BID      bids.ts          apuração de lances (depois do sorteio)
 *   AUDIT    hash.ts/trace.ts prova do cálculo + hashes
 *   STATE    state-machine.ts ciclo da assembleia
 *   RETIFY   retification.ts  retificação e reprodução
 *
 * Tudo puro — ver comentário em types.ts.
 */
export * from "./types.ts";
export * from "./hash.ts";
export * from "./numbering.ts";
export * from "./rules.ts";
export * from "./source.ts";
export * from "./candidates.ts";
export * from "./equivalence.ts";
export * from "./eligibility.ts";
export * from "./sequences.ts";
export * from "./resources.ts";
export * from "./trace.ts";
export * from "./draw.ts";
export * from "./bids.ts";
export * from "./state-machine.ts";
export * from "./retification.ts";
