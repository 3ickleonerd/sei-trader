import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";


describe("ActorRegistry", () => {
    async function deployFixture() {
        const [deployer, actor, acc1] = await hre.viem.getWalletClients();
         const actorRegistry = await hre.viem.deployContract("ActorRegistry");

        const publicClient = await hre.viem.getPublicClient();

        return { deployer, actor, acc1, actorRegistry, publicClient };
    }

    describe("Deployment", () => {
        it("should deploy correctly", async () => {
            const { actorRegistry } = await loadFixture(deployFixture);
            expect(actorRegistry.address).to.be.a("string");
        });        
    })

   describe("Registration", () => {
    it("should register an actor successfully", async () => {
      const { deployer, actor, actorRegistry } = await loadFixture(deployFixture);

      const tx = await actorRegistry.write.registerActor(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      const logs = await actorRegistry.getEvents.ActorRegistered();
      expect(logs.length).to.eq(1);
      expect(logs[0].args.owner?.toLowerCase()).to.eq(deployer.account.address.toLowerCase());
      expect(logs[0].args.actor?.toLowerCase()).to.eq(actor.account.address.toLowerCase());

    });

    it("should revert if actor is already registered", async () => {
      const { deployer, actor, actorRegistry } = await loadFixture(deployFixture);

      await actorRegistry.write.registerActor(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      await expect(
        actorRegistry.write.registerActor(
          [deployer.account.address, actor.account.address],
          { account: deployer.account }
        )
      ).to.be.rejectedWith("Actor already registered");
    });

    it("should revert if actor address is zero", async () => {
      const { deployer, actorRegistry } = await loadFixture(deployFixture);

      await expect(
        actorRegistry.write.registerActor(
          [deployer.account.address, "0x0000000000000000000000000000000000000000"],
          { account: deployer.account }
        )
      ).to.be.rejectedWith("Invalid actor address");
    });
  });

  describe("Read Functions", () => {
    it("should return true for registered owner", async () => {
      const { deployer, actor, actorRegistry } = await loadFixture(deployFixture);

      await actorRegistry.write.registerActor(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      const result = await actorRegistry.read.isRegistered([
        deployer.account.address,
      ]);
      expect(result).to.eq(true);
    });

    it("should return false for unregistered owner", async () => {
      const { acc1, actorRegistry } = await loadFixture(deployFixture);

      const result = await actorRegistry.read.isRegistered([acc1.account.address]);
      expect(result).to.eq(false);
    });

    it("should return the actor address for registered owner", async () => {
      const { deployer, actor, actorRegistry } = await loadFixture(deployFixture);

      await actorRegistry.write.registerActor(
        [deployer.account.address, actor.account.address],
        { account: deployer.account }
      );

      const result = await actorRegistry.read.getActor([
        deployer.account.address,
      ]);

      expect(result.toLowerCase()).to.eq(actor.account.address.toLowerCase());
    });

    it("should revert getActor for unregistered owner", async () => {
      const { acc1, actorRegistry } = await loadFixture(deployFixture);

      await expect(
        actorRegistry.read.getActor([acc1.account.address])
      ).to.be.rejectedWith("Actor not registered");
    });
  });
});