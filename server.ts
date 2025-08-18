import * as access from "./access";
import { contracts } from "./evm";

Bun.serve({
  routes: {
    "/db": {
      POST: async (req) => {
        let synced = 0;

        const dbsInStore = access.getDatabaseCount();
        const dbsOnChain = Number(
          await contracts.databaseFactory().read.databasesCount()
        );

        for (let i = dbsInStore; i < dbsOnChain; i++) {
          const dbAddress = await contracts
            .databaseFactory()
            .read.getDatabase([BigInt(i)]);

          const database = await contracts.database(dbAddress);

          const owner = await database.read.owner();
          const name = await database.read.name();

          access.addDatabaseAccessRecord({
            owner,
            name,
            address: dbAddress,
          });
          synced++;
        }

        return Response.json({ synced });
      },
    },

    "/raw": {
      POST: async (req) => {
        const sql = await req.text();
        console.log("Received SQL query:", sql);
        const headers = req.headers;
        console.log("Headers:", headers);
        return Response.json({ status: "ok" });
      },
    },
  },

  fetch(_) {
    return new Response("Not Found", { status: 404 });
  },

  port: 3040,
});
