import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveOwnDrawNumbers, sha256Hex, verifyOwnDraw } from "../own-draw.ts";
import { validateLotteryResult } from "../source.ts";

// Valores de referência gerados pela função SQL consortium_own_draw_derive
// no banco real — o TypeScript tem de reproduzi-los exatamente.
const SEED = "ab12cd34";
const ENTROPY = "frase | 2026-09-25T12:00:00.000Z";
const SQL_PRIZES = ["31518", "98973", "45469", "70861", "43101"];
const SQL_COMMIT = "034941017c353b1e5e89c7c3fae330a632e5f1517fef17bfa33d8dfa2418a94d";

describe("Sorteio próprio (roleta)", () => {
  it("reproduz byte a byte o selo e os números calculados pelo banco", async () => {
    assert.equal(await sha256Hex(SEED), SQL_COMMIT);
    assert.deepEqual(await deriveOwnDrawNumbers(SEED, ENTROPY, 5, 5), SQL_PRIZES);
  });

  it("nunca repete número e preserva zeros à esquerda", async () => {
    const out = await deriveOwnDrawNumbers(SEED, "x", 10, 3);
    assert.deepEqual(out, ["370", "346", "962", "042", "542", "533", "425", "951", "560", "961"]);
    assert.equal(new Set(out).size, out.length);
  });

  it("confere um sorteio íntegro", async () => {
    const v = await verifyOwnDraw({ commitmentHash: SQL_COMMIT, revealedSeed: SEED, publicEntropy: ENTROPY, prizes: SQL_PRIZES, prizeDigits: 5 });
    assert.equal(v.ok, true);
    assert.ok(v.checks.every((c) => c.ok));
  });

  it("denuncia segredo trocado ou número adulterado", async () => {
    const trocado = await verifyOwnDraw({ commitmentHash: SQL_COMMIT, revealedSeed: "ffff", publicEntropy: ENTROPY, prizes: SQL_PRIZES, prizeDigits: 5 });
    assert.equal(trocado.ok, false);
    assert.equal(trocado.checks[0].ok, false);
    const adulterado = await verifyOwnDraw({
      commitmentHash: SQL_COMMIT, revealedSeed: SEED, publicEntropy: ENTROPY, prizes: ["31518", "98973", "45469", "70861", "00001"], prizeDigits: 5,
    });
    assert.equal(adulterado.ok, false);
    assert.equal(adulterado.checks[1].ok, false);
  });

  it("antes do sorteio só existe o selo", async () => {
    const v = await verifyOwnDraw({ commitmentHash: SQL_COMMIT, revealedSeed: null, publicEntropy: null, prizes: null, prizeDigits: null });
    assert.equal(v.ok, false);
  });

  it("o resultado do sorteio próprio passa na validação da fonte", () => {
    const r = validateLotteryResult(
      { source: "OWN_DRAW", contestNumber: "SP-20260925-12", drawDate: "2026-09-25", prizes: SQL_PRIZES },
      { prizeDigits: 5, prizeCount: 5 },
      "2026-09-25",
    );
    assert.deepEqual(r, { status: "VALID", errors: [] });
    const federalComFormatoDeRoleta = validateLotteryResult(
      { source: "FEDERAL_LOTTERY", contestNumber: "SP-20260925-12", drawDate: "2026-09-25", prizes: SQL_PRIZES },
      { prizeDigits: 5, prizeCount: 5 },
      "2026-09-25",
    );
    assert.equal(federalComFormatoDeRoleta.status, "VALIDATION_FAILED");
  });
});
