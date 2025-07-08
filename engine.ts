import { Address } from "viem";
import { resolveDatabaseAddress } from "./access";
import { getAugmentedQuery } from "./parse";

export async function execute(options: {
  query: string;
  owner: Address;
  name: string;
}) {
  return new Promise((resolve, reject) => {
    try {
      const dbAddress = resolveDatabaseAddress({
        name: options.name,
        owner: options.owner,
      });

      if (!dbAddress) {
        throw new Error("Database address not found");
      }

      const { query } = getAugmentedQuery(options.query);
    } catch (error) {
      reject(error);
      console.error("An error occurred:", error);
    }
  });
}
