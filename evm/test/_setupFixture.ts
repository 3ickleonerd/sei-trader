import hre from "hardhat";

export default async function setupFixture() {
  const [server, acc1, acc2] = await hre.viem.getWalletClients();

  const orchestrator = await hre.viem.deployContract("CaretOrchestrator");

  const databaseFactoryAddress = await orchestrator.read.databaseFactory();
  const databaseFactory = await hre.viem.getContractAt(
    "DatabaseFactory",
    databaseFactoryAddress
  );

  const database = await databaseFactory.write.createDatabase([]);

  return {
    owner,
    acc1,
    acc2,
    orchestrator,
  };
}
