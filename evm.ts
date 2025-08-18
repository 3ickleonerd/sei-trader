import {
  Address,
  createWalletClient,
  getContract,
  http,
  isAddress,
  isHex,
  publicActions,
} from "viem";
import { env, isProd } from "./env";
import { hardhat, seiTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import definitions from "./definitions";

const privateKey = env.SERVER_PRIVATE_KEY;
if (!isHex(privateKey)) {
  throw new Error("Invalid private key. Check env");
}

const primaryChain = isProd ? seiTestnet : hardhat;

export const evmClient = createWalletClient({
  chain: primaryChain,
  account: privateKeyToAccount(privateKey),
  transport: http(primaryChain.rpcUrls.default.http[0]),
}).extend(publicActions);
export type EvmClient = typeof evmClient;

export const contracts = {
  actorRegistry: () =>
    getContract({
      client: evmClient,
      ...definitions.ActorRegistry,
    }),
  seiqlOrchestrator: () =>
    getContract({
      client: evmClient,
      ...definitions.SeiqlOrchestrator,
    }),
  databaseFactory: () =>
    getContract({
      client: evmClient,
      ...definitions.DatabaseFactory,
    }),
  database: (address: Address) =>
    getContract({
      client: evmClient,
      ...definitions.Database,
      address,
    }),
  table: (address: Address) =>
    getContract({
      client: evmClient,
      ...definitions.Table,
      address,
    }),
};
