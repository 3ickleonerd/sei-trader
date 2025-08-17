Bun.serve({
  routes: {
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
