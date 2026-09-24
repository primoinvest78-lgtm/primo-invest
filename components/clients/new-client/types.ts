import type { Dispatch, SetStateAction } from "react";

import type { FieldErrors, RegistrationState } from "@/lib/utils/client-registration";

export type StepProps = {
  state: RegistrationState;
  setState: Dispatch<SetStateAction<RegistrationState>>;
  errors: FieldErrors;
};

/** Atualiza um grupo aninhado do estado (pf, pj, contact, address...) sem repetir spread em todo campo. */
export function patchGroup<K extends keyof RegistrationState>(
  setState: StepProps["setState"],
  group: K,
  patch: Partial<RegistrationState[K]>,
) {
  setState((prev) => ({ ...prev, [group]: { ...(prev[group] as object), ...patch } }));
}
