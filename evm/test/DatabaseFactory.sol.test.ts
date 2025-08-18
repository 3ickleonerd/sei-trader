import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DatabaseFactory", () => {
  async function deployFixture() {
    const [deployer, actor] = await hre.viem.getWalletClients();
    const factory = await hre.viem.deployContract("DatabaseFactory");
    const publicClient = await hre.viem.getPublicClient();
    return { factory, deployer, actor , publicClient };
  }

  describe("Deployment", () => {
    it("should deploy DatabaseFactory", async () => {
      const { factory } = await loadFixture(deployFixture);
      expect(factory.address).to.be.a("string");
    });
  });

  describe("Database Creation", () => {
    it("should create a database and emit event", async () => {
      const { factory, deployer, actor , publicClient } = await loadFixture(deployFixture);

      await factory.write.createDatabase(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      const logs = await factory.getEvents.DatabaseCreated();

      expect(logs.length).to.be.eq(1);
      const log = logs[0].args;

      expect(log.creator?.toLowerCase()).to.eq(deployer.account.address.toLowerCase());
      expect(log.dbAddress).to.be.a("string");

      const dbAddressFromFactory = await factory.read.getDatabase([0n]);
      expect(dbAddressFromFactory.toLowerCase()).to.eq(log.dbAddress?.toLowerCase());
    });

    it("should return correct indices per owner", async () => {
      const { factory, deployer, actor } = await loadFixture(deployFixture);

      await factory.write.createDatabase(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );
      await factory.write.createDatabase(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      const indices = await factory.read.getDatabaseIndicesByOwner([
        deployer.account.address,
      ]);

      expect(indices.length).to.eq(2);
      expect(indices[0]).to.deep.equal(0n);
      expect(indices[1]).to.deep.equal(1n);
    });

    it("should return the correct database address", async () => {
      const { factory, deployer, actor } = await loadFixture(deployFixture);

      await factory.write.createDatabase(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      const dbAddress = await factory.read.getDatabase([0n]);
      expect(dbAddress).to.be.a("string");
    });

    it("should revert when getDatabase is out of bounds", async () => {
      const { factory } = await loadFixture(deployFixture);

      await expect(factory.read.getDatabase([0n])).to.be.rejectedWith("Index out of bounds");
    });
  });
});
