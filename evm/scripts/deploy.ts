import * as viem from "viem";
import { hardhat, seiTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import CaretOrchestrator from "../artifacts/src/CaretOrchestrator.sol/CaretOrchestrator.json";
import CaretEscrow from "../artifacts/src/CaretEscrow.sol/CaretEscrow.json";
import USDT from "../artifacts/src/usdt.sol/USDT.json";
import TestToken from "../artifacts/src/TestToken.sol/TestToken.json";
import { tokens } from "../../src/bot/tokens";

const networkArg = Bun.argv[2];
const isSei = networkArg === "sei";

const privateKey = Bun.env.PRIVATE_KEY_1;
if (!privateKey || !viem.isHex(privateKey)) {
  throw new Error("PRIVATE_KEY_1 is invalid");
}

const getChain = () => {
  if (isSei) return seiTestnet;
  return hardhat;
};

const getAccount = () => {
  if (isSei) return privateKeyToAccount(privateKey);

  return privateKeyToAccount(
    "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"
  );
};

const client = viem
  .createWalletClient({
    chain: getChain(),
    account: getAccount(),
    transport: viem.http(getChain().rpcUrls.default.http[0]),
  })
  .extend(viem.publicActions);

const definitions: {
  CaretOrchestrator?: {
    abi: any;
    address?: viem.Address;
  };
  CaretEscrow?: {
    abi: any;
    address?: viem.Address;
  };
  USDT?: {
    abi: any;
    address?: viem.Address;
  };
  tokens?: Record<
    string,
    {
      abi: any;
      address: viem.Address;
    }
  >;
} = {};

async function main() {
  console.log(`Deploying to ${getChain().name}...`);
  console.log(`Deployer address: ${client.account.address}`);

  if (!viem.isHex(CaretOrchestrator.bytecode))
    throw new Error("CaretOrchestrator bytecode is missing or invalid");

  if (!viem.isHex(USDT.bytecode))
    throw new Error("USDT bytecode is missing or invalid");

  if (!viem.isHex(TestToken.bytecode))
    throw new Error("TestToken bytecode is missing or invalid");

  const serverAddress = client.account.address;

  console.log("Deploying USDT...");
  const usdtHash = await client.deployContract({
    abi: USDT.abi,
    bytecode: USDT.bytecode,
    args: [],
  });

  const usdtReceipt = await client.waitForTransactionReceipt({
    hash: usdtHash,
  });

  if (!usdtReceipt.contractAddress) throw new Error("USDT deployment failed");

  console.log(`USDT deployed at: ${usdtReceipt.contractAddress}`);

  console.log("Deploying CaretOrchestrator...");
  const orchestratorHash = await client.deployContract({
    abi: CaretOrchestrator.abi,
    bytecode: CaretOrchestrator.bytecode,
    args: [serverAddress, usdtReceipt.contractAddress],
  });

  const orchestratorReceipt = await client.waitForTransactionReceipt({
    hash: orchestratorHash,
  });

  if (!orchestratorReceipt.contractAddress)
    throw new Error("CaretOrchestrator deployment failed");

  console.log(
    `CaretOrchestrator deployed at: ${orchestratorReceipt.contractAddress}`
  );

  console.log("\nDeploying test tokens...");
  const testTokens: Record<
    string,
    {
      abi: any;
      address: viem.Address;
    }
  > = {};

  for (const token of tokens) {
    const testTokenName = `Test ${token.name}`;
    const testTokenSymbol = token.symbol;

    console.log(`Deploying ${testTokenName} (${testTokenSymbol})...`);

    const tokenHash = await client.deployContract({
      abi: TestToken.abi,
      bytecode: TestToken.bytecode,
      args: [testTokenName, testTokenSymbol, usdtReceipt.contractAddress],
    });

    const tokenReceipt = await client.waitForTransactionReceipt({
      hash: tokenHash,
    });

    if (!tokenReceipt.contractAddress)
      throw new Error(`${testTokenSymbol} deployment failed`);

    console.log(
      `${testTokenSymbol} deployed at: ${tokenReceipt.contractAddress}`
    );

    testTokens[testTokenSymbol] = {
      abi: TestToken.abi,
      address: tokenReceipt.contractAddress,
    };
  }

  definitions["CaretOrchestrator"] = {
    abi: CaretOrchestrator.abi,
    address: orchestratorReceipt.contractAddress,
  };

  definitions["CaretEscrow"] = {
    abi: CaretEscrow.abi,
  };

  definitions["USDT"] = {
    abi: USDT.abi,
    address: usdtReceipt.contractAddress,
  };

  definitions.tokens = testTokens;

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log(`USDT: ${usdtReceipt.contractAddress}`);
  console.log(`CaretOrchestrator: ${orchestratorReceipt.contractAddress}`);
  console.log(`Server address: ${serverAddress}`);
  console.log(`Test Tokens deployed: ${Object.keys(testTokens).length}`);
}

main()
  .then(async () => {
    await Bun.write(
      Bun.file("../definitions.json"),
      JSON.stringify(definitions, null, 2)
    );

    await Bun.write(
      Bun.file("../definitions.ts"),
      "const definitions = " +
        JSON.stringify(definitions, null, 2) +
        " as const;\nexport default definitions;\n"
    );

    console.log("\nDeployment successful! Contract definitions written to:");
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
