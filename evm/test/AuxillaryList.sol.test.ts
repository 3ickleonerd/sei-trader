import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AuxillaryList", function () {
  async function deployFixture() {
    const [owner, acc1, acc2] = await hre.viem.getWalletClients();
    const list = await hre.viem.deployContract("AuxillaryListUint256", []);

    const publicClient = await hre.viem.getPublicClient();

    // Add one default value
    await list.write.add([1n]);

    return { list, owner, acc1, acc2, publicClient };
  }

  describe("Deployment", () => {
    it("Should set deployer as owner", async () => {
      const { list, owner } = await loadFixture(deployFixture);

      expect((await list.read.owner()).toLowerCase()).eq(
        owner.account.address,
      );
    });
  });

  describe("Element Addition", () => {
    it("Should allow owner to add elements", async () => {
      const { list } = await loadFixture(deployFixture);

      await list.write.add([2n]);
      expect(await list.read.contains([2n])).to.true;
    });

    it("Should increment length on element addition", async () => {
      const { list } = await loadFixture(deployFixture);

      const lengthBefore = await list.read.length();
      await list.write.add([3n]);
      const lengthAfter = await list.read.length();

      expect(lengthAfter).eq(lengthBefore + 1n);
    });

    it("Should return correct index after addition", async () => {
      const { list } = await loadFixture(deployFixture);

      const len = await list.read.length();
      await list.write.add([4n]);

      expect(await list.read.indexOf([4n])).eq(len);
    });

    it("Should contain added value", async () => {
      const { list } = await loadFixture(deployFixture);

      await list.write.add([5n]);
      expect(await list.read.contains([5n])).to.true;
    });

    it("Should not allow non-owner to add values", async () => {
      const { acc1, list } = await loadFixture(deployFixture);

      await expect(
        list.write.add([6n], { account: acc1.account }),
      ).to.be.rejected;
    });
  });

  describe("Element Deletion", () => {
    it("Should allow owner to remove elements", async () => {
      const { list } = await loadFixture(deployFixture);

      await list.write.add([10n]);
      await list.write.remove([10n]);

      expect(await list.read.contains([10n])).to.false;
    });

    it("Should decrement length on deletion", async () => {
      const { list } = await loadFixture(deployFixture);

      await list.write.add([20n]);
      const lenBefore = await list.read.length();

      await list.write.remove([20n]);
      const lenAfter = await list.read.length();

      expect(lenAfter).eq(lenBefore - 1n);
    });

    it("Should not allow non-owner to remove", async () => {
      const { list, acc1 } = await loadFixture(deployFixture);

      await list.write.add([30n]);
      await expect(
        list.write.remove([30n], { account: acc1.account }),
      ).to.be.rejected;
    });
  });

  describe("Safe Functions", () => {
    it("safeAdd should reject duplicates", async () => {
      const { list } = await loadFixture(deployFixture);

      await expect(list.write.safeAdd([1n])).to.be.rejected;
    });

    it("safeRemove should reject if value doesn't exist", async () => {
      const { list } = await loadFixture(deployFixture);

      await expect(list.write.safeRemove([999n])).to.be.rejected;
    });

    it("add should silently ignore duplicates", async () => {
      const { list } = await loadFixture(deployFixture);

      const lenBefore = await list.read.length();
      await list.write.add([1n]);
      const lenAfter = await list.read.length();

      expect(lenBefore).eq(lenAfter);
    });

    it("remove should silently ignore non-existent", async () => {
      const { list } = await loadFixture(deployFixture);

      const lenBefore = await list.read.length();
      await list.write.remove([888n]);
      const lenAfter = await list.read.length();

      expect(lenBefore).eq(lenAfter);
    });
  });

  describe("Getters", () => {
    it("getAll should return correct array", async () => {
      const { list } = await loadFixture(deployFixture);

      await list.write.add([11n]);
      await list.write.add([22n]);

      const all = await list.read.getAll();
      expect(all.map((n) => n.toString())).to.deep.eq(["1", "11", "22"]);
    });

    it("indexOf should reflect correct position", async () => {
      const { list } = await loadFixture(deployFixture);

      await list.write.add([42n]);
      const idx = await list.read.indexOf([42n]);

      expect(idx).to.be.a("bigint");
    });

    it("contains should return true/false", async () => {
      const { list } = await loadFixture(deployFixture);

      expect(await list.read.contains([1n])).to.true;
      expect(await list.read.contains([12345n])).to.false;
    });
  });
});
