import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeAbiParameters, decodeAbiParameters , encodePacked } from "viem";


describe("Table", function () {
  async function deployFixture() {
    const [deployer, acc1] = await hre.viem.getWalletClients();

    const columnTypes = [
      { name: "id", acceptedType: 0 }, // INTEGER
      { name: "isActive", acceptedType: 3 }, // BOOL
      { name: "owner", acceptedType: 4 }, // ADDRESS
    ];

    const encodedColumns = columnTypes.map((col) => [
      col.name,
      col.acceptedType,
    ]);
    const table = await hre.viem.deployContract("Table", [encodedColumns]);
    const publicClient = await hre.viem.getPublicClient();

    return { table, deployer, acc1, columnTypes, publicClient };
  }

  describe("Deployment", () => {
    it("should deploy with correct active columns", async () => {
      const { table, columnTypes } = await loadFixture(deployFixture);
      const result = await table.read.getActiveColumnTypes();

      expect(result.length).to.eq(columnTypes.length);
      result.forEach((col: any, i: number) => {
        expect(col.name).to.eq(columnTypes[i].name);
        expect(Number(col.acceptedType)).to.eq(columnTypes[i].acceptedType);
      });
    });
  });

  describe("Insertion", () => {
    it("should insert a row with valid types", async () => {
      const { table, deployer } = await loadFixture(deployFixture);

      const colIndexes = [0n, 1n, 2n];
      const values = [
        encodeAbiParameters([{ type: "uint256" }], [123n]),
        encodePacked(["bool"], [true]),
        encodePacked(["address"], [deployer.account.address]),
      ];

      await table.write.insertOne([colIndexes, values], {
        account: deployer.account,
      });
    });

    it("should revert on mismatched lengths", async () => {
      const { table, deployer } = await loadFixture(deployFixture);

      const colIndexes = [0n];
      const values = [
        encodeAbiParameters([{ type: "uint256" }], [123n]),
        encodeAbiParameters([{ type: "bool", packed: true }], [true]),
      ];

      await expect(
        table.write.insertOne([colIndexes, values], {
          account: deployer.account,
        })
      ).to.be.rejected;
    });

    it("should insert multiple rows", async () => {
      const { table, deployer } = await loadFixture(deployFixture);

      const colIndexes = [
        [0n, 2n],
        [1n, 2n],
      ];
      const values = [
        [
          encodeAbiParameters([{ type: "uint256" }], [100n]),
         encodePacked(["address"], [deployer.account.address]),
        ],
        [
           encodePacked(["bool"], [false]),
          encodePacked(["address"], [deployer.account.address]),
        ],
      ];

      await table.write.insertMany([colIndexes, values], {
        account: deployer.account,
      });
    });
  });

  describe("Reading", () => {
    it("should return a row correctly", async () => {
      const { table, deployer } = await loadFixture(deployFixture);

      const colIndexes = [0n, 2n];
      const values = [
        encodeAbiParameters([{ type: "uint256" }], [456n]),
        encodePacked(["address"], [deployer.account.address]),
      ];

      await table.write.insertOne([colIndexes, values], {
        account: deployer.account,
      });

      const row = await table.read.readRow([0n]);

      const decodedId = decodeAbiParameters(
        [{ type: "uint256" }],
        row[0].value
      );
      expect(decodedId[0]).to.eq(456n);
    });
  });

  describe("Deletion", () => {
    it("should delete a row", async () => {
      const { table, deployer } = await loadFixture(deployFixture);

      const colIndexes = [0n, 2n];
      const values = [
        encodeAbiParameters([{ type: "uint256" }], [789n]),
        encodePacked(["address"], [deployer.account.address]),
      ];

      await table.write.insertOne([colIndexes, values], {
        account: deployer.account,
      });
      await table.write.deleteOne([0n], { account: deployer.account });

      await expect(table.read.readRow([0n])).to.be.rejected;
    });

    it("should delete multiple rows", async () => {
      const { table, deployer } = await loadFixture(deployFixture);

      const colIndexes = [0n, 2n];
      const values = [
        encodeAbiParameters([{ type: "uint256" }], [101n]),
        encodePacked(["address"], [deployer.account.address]),
      ];

      await table.write.insertOne([colIndexes, values], {
        account: deployer.account,
      });
      await table.write.insertOne([colIndexes, values], {
        account: deployer.account,
      });

      await table.write.deleteMany([[0n, 1n]], { account: deployer.account });

      await expect(table.read.readRow([1n])).to.be.rejected;
    });
  });

  describe("Updating", () => {
  it("should update a row", async () => {
    const { table, deployer } = await loadFixture(deployFixture);

    const colIndexes = [0n, 1n];
    const values = [
      encodeAbiParameters([{ type: "uint256" }], [111n]),
      encodePacked(["bool"], [true]),
    ];

    await table.write.insertOne([colIndexes, values], {
      account: deployer.account,
    });

    const updateIndexes = [1n];
    const updateValues = [encodePacked(["bool"], [false])];

    await table.write.updateOne([0n, updateIndexes, updateValues], {
      account: deployer.account,
    });

    const row = await table.read.readRow([0n]);

    // ✅ Use decodePacked instead of decodeAbiParameters
   const decodedBool = row[1].value === "0x01";
    expect(decodedBool).to.eq(false);
  });
});

});
