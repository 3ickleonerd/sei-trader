import env from "../../env";
import { generateTncHtml } from "./utils/tncHtml.ts";
import { bot } from "../telegram";

bot.start();

const port = parseInt(env.PORT);

export default {
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (url.pathname === "/tnc") {
      const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
      const html = generateTncHtml({
        title: "Terms & Conditions - Caret Sei Trading Bot",
        theme,
      });

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    if (url.pathname.startsWith("/api")) {
      if (url.pathname === "/api/ping") {
        return new Response(JSON.stringify({ message: "pong" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

console.log(`🚀 Server running on port ${port}`);
