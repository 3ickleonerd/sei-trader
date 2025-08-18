import * as viem from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import ActorRegistry from "../artifacts/contracts/ActorRegistry.sol/ActorRegistry.json";
import AuxillaryListUint256 from "../artifacts/contracts/AuxillaryListUint256.sol/AuxillaryListUint256.json";
import SeiqlOrchestrator from "../artifacts/contracts/SeiqlOrchestrator.sol/SeiqlOrchestrator.json";
import Database from "../artifacts/contracts/Database.sol/Database.json";
import DatabaseFactory from "../artifacts/contracts/DatabaseFactory.sol/DatabaseFactory.json";
import Table from "../artifacts/contracts/Table.sol/Table.json";

const networkArg = Bun.argv[2];

const privateKey = Bun.env.SEI_PRIVATE_KEY || Bun.env.PRIVATE_KEY;
if (!privateKey || !viem.isHex(privateKey)) {
  console.log("Using default hardhat private key for local development");
}

const client = viem
  .createWalletClient({
    chain: hardhat,
    account: privateKeyToAccount(
      privateKey && viem.isHex(privateKey)
        ? privateKey
        : "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e" // Hardhat default private key
    ),
    transport: viem.http(hardhat.rpcUrls.default.http[0]),
  })
  .extend(viem.publicActions);

const definitions: Record<
  string,
  {
    abi: any;
    address?: viem.Address;
  }
> = {};

async function main() {
  console.log("Starting Seiql platform deployment...");

  // Deploy the main orchestrator contract
  if (!viem.isHex(SeiqlOrchestrator.bytecode))
    throw new Error("SeiqlOrchestrator bytecode is missing or invalid");

  console.log("Deploying SeiqlOrchestrator...");
  const orchestratorHash = await client.deployContract({
    abi: SeiqlOrchestrator.abi,
    bytecode: SeiqlOrchestrator.bytecode,
  });

  const orchestratorReceipt = await client.waitForTransactionReceipt({
    hash: orchestratorHash,
  });

  if (!orchestratorReceipt.contractAddress)
    throw new Error("SeiqlOrchestrator deployment failed");

  console.log(
    `SeiqlOrchestrator deployed at: ${orchestratorReceipt.contractAddress}`
  );

  const orchestrator = viem.getContract({
    address: orchestratorReceipt.contractAddress,
    abi: SeiqlOrchestrator.abi,
    client,
  });

  // Get the deployed DatabaseFactory and ActorRegistry addresses from the orchestrator
  const databaseFactoryAddress = await client.readContract({
    address: orchestrator.address,
    abi: SeiqlOrchestrator.abi,
    functionName: "databaseFactory",
  });

  const actorRegistryAddress = await client.readContract({
    address: orchestrator.address,
    abi: SeiqlOrchestrator.abi,
    functionName: "actorRegistry",
  });

  if (
    typeof databaseFactoryAddress != "string" ||
    !viem.isAddress(databaseFactoryAddress)
  )
    throw new Error("DatabaseFactory address is invalid");

  if (
    typeof actorRegistryAddress != "string" ||
    !viem.isAddress(actorRegistryAddress)
  )
    throw new Error("ActorRegistry address is invalid");

  console.log(`DatabaseFactory deployed at: ${databaseFactoryAddress}`);
  console.log(`ActorRegistry deployed at: ${actorRegistryAddress}`);

  // Store contract definitions
  definitions["SeiqlOrchestrator"] = {
    abi: SeiqlOrchestrator.abi,
    address: orchestrator.address,
  };
  definitions["DatabaseFactory"] = {
    abi: DatabaseFactory.abi,
    address: databaseFactoryAddress,
  };
  definitions["ActorRegistry"] = {
    abi: ActorRegistry.abi,
    address: actorRegistryAddress,
  };
  definitions["Database"] = {
    abi: Database.abi,
  };
  definitions["Table"] = {
    abi: Table.abi,
  };
  definitions["AuxillaryListUint256"] = {
    abi: AuxillaryListUint256.abi,
  };

  console.log("All contracts deployed successfully!");
}

main()
  .then(async () => {
    // Create services directory if it doesn't exist
    await Bun.write(
      Bun.file("../definitions.ts"),
      "const definitions = " +
        JSON.stringify(definitions, null, 2) +
        " as const;\nexport default definitions;\n"
    );

    // Also write JSON definitions for other potential uses
    await Bun.write(
      Bun.file("../definitions.json"),
      JSON.stringify(definitions, null, 2)
    );

    console.log("Deployment successful. Contract definitions written to:");
    console.log("- ../definitions.ts");
    console.log("- ../definitions.json");

    console.log("\nDeployed contracts:");
    Object.entries(definitions).forEach(([name, def]) => {
      if (def.address) {
        console.log(`${name}: ${def.address}`);
      }
    });
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
