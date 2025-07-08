import { getAugmentedQuery } from "./parse";

export async function syncOnChain(options: { query: string }) {
  const { query } = await getAugmentedQuery(options.query);
}
