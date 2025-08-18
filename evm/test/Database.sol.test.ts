import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Database", () => {
  async function deployFixture() {
    const [deployer, actor, acc1] = await hre.viem.getWalletClients();
    const database = await hre.viem.deployContract("Database", [
      deployer.account.address,
      actor.account.address,
    ]);

    const publicClient = await hre.viem.getPublicClient();

    const columnTypes = [
      { name: "userId", acceptedType: 0 },
      { name: "email", acceptedType: 2 },
    ];

    return { deployer, actor, acc1, database, columnTypes, publicClient };
  }

  describe("Deployment", () => {
    it("should deploy correctly", async () => {
      const { database } = await loadFixture(deployFixture);
      expect(database.address).to.be.a("string");
    });
  });

  describe("Table Creation", () => {
    it("should create a table from owner", async () => {
      const { deployer, database, columnTypes } = await loadFixture(deployFixture);

      const tableName = "Users";

      const tx = await database.write.createTable([columnTypes, tableName], {
        account: deployer.account,
      });

      const logs = await database.getEvents.TableCreated();
      expect(logs.length).to.eq(1);
      expect(logs[0].args.tableName).to.eq(tableName);
    });

    it("should create a table from actor", async () => {
      const { actor, database, columnTypes } = await loadFixture(deployFixture);

      const tableName = "Products";

      await database.write.createTable([columnTypes, tableName], {
        account: actor.account,
      });

      const logs = await database.getEvents.TableCreated();
      expect(logs.length).to.eq(1);
      expect(logs[0].args.tableName).to.eq(tableName);
    });

    it("should revert if not permitted", async () => {
      const { acc1, database, columnTypes } = await loadFixture(deployFixture);

      await expect(
        database.write.createTable([columnTypes, "Blocked"], {
          account: acc1.account,
        })
      ).to.be.rejectedWith("Not allowed to call this function");
    });
  });

  describe("Table Management", () => {
    it("should rename a table", async () => {
      const { database, deployer, columnTypes } = await loadFixture(deployFixture);

      await database.write.createTable([columnTypes, "OldName"], {
        account: deployer.account,
      });

      await database.write.renameTable([0n, "NewName"], {
        account: deployer.account,
      });

      const names = await database.read.tableNames();
      expect(names[0]).to.eq("NewName");
    });

    it("should drop a table and emit TableCreated with empty name", async () => {
      const { database, deployer, columnTypes } = await loadFixture(deployFixture);

      await database.write.createTable([columnTypes, "ToDelete"], {
        account: deployer.account,
      });

      await database.write.dropTable([0n], {
        account: deployer.account,
      });

      const names = await database.read.tableNames();
      expect(names.length).to.eq(0);

      const logs = await database.getEvents.TableCreated();
     expect(logs.length).to.eq(1); // ✅ Only one event emitted in this test due to drop only
    expect(logs[0].args.tableName).to.eq(""); 

    });

    it("should revert rename or drop on out-of-bounds index", async () => {
      const { database, deployer } = await loadFixture(deployFixture);

      await expect(
        database.write.renameTable([0n, "Oops"], {
          account: deployer.account,
        })
      ).to.be.rejectedWith("Index out of bounds");

      await expect(
        database.write.dropTable([0n], {
          account: deployer.account,
        })
      ).to.be.rejectedWith("Index out of bounds");
    });
  });
});
