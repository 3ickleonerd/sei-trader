import { z, ZodType } from "zod";
import type { Address } from "viem";

export const zEvmAddress = (message?: string) => {
  return z.custom<Address>(
    (p) => typeof p === "string" && /^0x[a-fA-F0-9]{40}$/.test(p),
    { message: message || "Invalid EVM address" }
  );
};

export const zDatabaseAccessRecord = (message?: string) =>
  z.object(
    {
      owner: zEvmAddress(),
      name: z.string().min(3, "Name too short").max(64, "Name too long"),
      address: zEvmAddress(),
    },
    { message }
  );

export type zInfer<T extends ZodType | (() => ZodType)> = z.infer<
  T extends ZodType ? T : T extends () => ZodType ? ReturnType<T> : never
>;
